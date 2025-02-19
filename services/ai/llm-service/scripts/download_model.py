#!/usr/bin/env python3

from huggingface_hub import snapshot_download, HfApi
from pathlib import Path
from typing import List, Optional, Any, Callable, TypeVar
from abc import ABC, abstractmethod
from dataclasses import dataclass
import logging
import sys
import os
import time
from urllib.error import URLError
from requests.exceptions import RequestException
import shutil  # For cache cleanup
from huggingface_hub.hf_api import ModelInfo as HFModelInfo

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass  # Should use dataclass decorator
class DownloadResult:
    """Represents the result of a model download operation"""  # Add docstring
    success: bool
    error: Optional[str] = None
    model_path: Optional[Path] = None


class DownloadStrategy(ABC):
    @abstractmethod
    def download(self, model_id: str, cache_dir: Path) -> bool:
        pass


class SafetensorsStrategy(DownloadStrategy):
    def download(self, model_id: str, cache_dir: Path) -> bool:
        try:
            snapshot_download(
                repo_id=model_id,
                local_dir=cache_dir,
                resume_download=True,
                max_workers=1,
                allow_patterns=ModelDownloader.MODEL_FILE_PATTERNS + ModelDownloader.CONFIG_FILE_PATTERNS
            )
            return True
        except Exception as e:
            logger.error(f"Safetensors strategy download failed: {e}")
            return False


class DefaultStrategy(DownloadStrategy):
    def download(self, model_id: str, cache_dir: Path) -> bool:
        try:
            snapshot_download(
                repo_id=model_id,
                local_dir=cache_dir,
                resume_download=True,
                max_workers=1,
            )
            return True
        except Exception as e:
            logger.error(f"Default strategy download failed: {e}")
            return False


class DownloadStrategyFactory:
    def __init__(self):
        self.repository = HuggingFaceRepository()

    def create_strategy(self, model_id: str) -> DownloadStrategy:
        try:
            model_info = self.repository.get_model_info(model_id)
            if any(f.rfilename.endswith('.safetensors') for f in model_info.siblings):
                return SafetensorsStrategy()
            return DefaultStrategy()
        except Exception as e:
            logger.error(f"Strategy creation failed: {e}")
            return DefaultStrategy()


@dataclass
class ModelInfo:
    siblings: List[HFModelInfo]  # Proper type definition


class ModelRepository(ABC):
    @abstractmethod
    def get_model_info(self, model_id: str) -> ModelInfo:
        pass


class HuggingFaceRepository(ModelRepository):
    def __init__(self):
        self.api = HfApi()

    def get_model_info(self, model_id: str) -> ModelInfo:
        try:
            info = self.api.model_info(model_id)
            return ModelInfo(siblings=info.siblings)
        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            raise


class CacheManager:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir

    def get_model_path(self, model_id: str) -> Path:
        return self.base_dir / f"models--{model_id.replace('/', '--')}"

    def cleanup_strategy(self, max_age: int = 30) -> None:
        """Remove cache files older than max_age days"""
        current_time = time.time()
        for path in self.base_dir.glob("models--*"):
            if path.stat().st_mtime < (current_time - (max_age * 24 * 3600)):
                logger.info(f"Removing old cache: {path}")
                shutil.rmtree(path)


T = TypeVar('T')

class RetryPolicy:
    def __init__(self, max_retries: int, delay: int):
        self.max_retries = max_retries
        self.delay = delay

    def execute(self, func: Callable[[], T]) -> T:
        retry_count = 0
        while retry_count < self.max_retries:
            try:
                return func()
            except Exception as e:
                retry_count += 1
                if retry_count == self.max_retries:
                    raise
                logger.warning(f"Retry {retry_count}/{self.max_retries} after error: {e}")
                time.sleep(self.delay)


class ModelDownloader:
    """Handles downloading and caching of HuggingFace models.

    Attributes:
        MAX_RETRIES (int): Maximum number of download attempts
        SPACE_BUFFER (float): Extra space factor for downloads
        RETRY_DELAY (int): Seconds to wait between retries
    """
    # File patterns
    MODEL_FILE_PATTERNS = ["*.safetensors", "*.bin"]
    CONFIG_FILE_PATTERNS = ["*.json", "*.txt", "*.md"]
    INCOMPLETE_PATTERNS = ["*.incomplete", "*.part*"]
    
    # Performance tuning
    MAX_RETRIES = 3
    SPACE_BUFFER = 1.1
    RETRY_DELAY = 1
    
    # Size constants
    GB = 1024 ** 3
    MB = 1024 ** 2

    def __init__(self, model_id: str, cache_dir: Path):
        if not model_id or not isinstance(model_id, str):
            raise ValueError("Invalid model_id")
        self.model_id = model_id
        self.cache_dir = Path(cache_dir)
        self.api = HfApi()  # Initialize API first
        self.repository = HuggingFaceRepository()  # Then repository
        self.strategy = DownloadStrategyFactory().create_strategy(model_id)  # Finally strategy

    def validate_cache(self) -> bool:
        """Check if model is already downloaded and valid"""
        try:
            model_files: List[Path] = list(self.cache_dir.rglob("*.safetensors")) + \
                list(self.cache_dir.rglob("*.bin"))

            if not model_files:
                logger.info("No model files found in cache")
                return False

            if list(self.cache_dir.rglob("*.incomplete")):
                logger.info("Found incomplete downloads")
                return False

            total_size = sum(f.stat().st_size for f in model_files)
            logger.info(
                f"Found complete model in cache ({total_size/1024**3:.1f}GB)")
            logger.debug(f"Found files: {[f.name for f in model_files]}")
            return True

        except Exception as e:
            logger.error(f"Cache validation failed: {e}")
            return False

    def ensure_space(self) -> bool:
        """Verify sufficient disk space"""
        try:
            info = self.api.model_info(self.model_id)
            total_size = sum(f.size for f in info.siblings if f.size)
            required = total_size * self.SPACE_BUFFER  # 10% buffer
            # Fix: Use statvfs for actual available space
            stats = self.cache_dir.parent.statvfs()
            available = stats.f_frsize * stats.f_bavail
            logger.info(
                f"Required space: {required/self.GB:.1f}GB, "
                f"Available: {available/self.GB:.1f}GB")
            return available >= required
        except Exception as e:
            if "NameResolutionError" in str(e):
                logger.error(
                    f"Network error: Failed to resolve hostname. Check DNS settings: {e}")
            else:
                logger.error(f"Space check failed: {e}")
            return False

    def download_files(self) -> bool:
        """Download model files with proper resume handling"""
        try:
            logger.info("Checking existing downloads...")
            # Find partially downloaded files
            incomplete_files = list(self.cache_dir.rglob("*.incomplete"))
            partial_files = list(self.cache_dir.rglob("*.part*"))

            if incomplete_files or partial_files:
                logger.info(
                    f"Found {len(incomplete_files)} incomplete and {len(partial_files)} partial files")
                logger.info("Attempting to resume download...")
            else:
                logger.info("Starting fresh download")

            snapshot_download(
                repo_id=self.model_id,
                local_dir=self.cache_dir,
                resume_download=True,
                max_workers=1,
                local_files_only=False,
                token=os.getenv("HF_TOKEN"),
                force_download=False  # Ensure we don't force a fresh download
            )

            return self.validate_cache()

        except (URLError, RequestException) as e:
            logger.warning(f"Network error: {e}")
            return False
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return False

    def cleanup_incomplete(self) -> None:
        """Remove incomplete downloads"""
        for pattern in ModelDownloader.INCOMPLETE_PATTERNS:
            for f in self.cache_dir.rglob(pattern):
                f.unlink()

    def download(self) -> DownloadResult:
        """Main download method with resume support"""
        retry_policy = RetryPolicy(self.MAX_RETRIES, self.RETRY_DELAY)

        def attempt_download():
            if self.validate_cache():
                return DownloadResult(True, model_path=self.cache_dir)

            if not self.ensure_space():
                return DownloadResult(False, error="Insufficient disk space")

            if self.download_files():
                return DownloadResult(True, model_path=self.cache_dir)

            raise Exception("Download attempt failed")

        try:
            return retry_policy.execute(attempt_download)
        except Exception as e:
            return DownloadResult(False, error=f"Download failed after {self.MAX_RETRIES} attempts: {e}")


def main():
    model_id = os.getenv("MODEL_ID")
    if not model_id:
        logger.error("MODEL_ID environment variable not set")
        sys.exit(1)

    # Use container path when running in Docker, local path otherwise
    base_cache = Path("/data/hub" if os.path.exists("/data/hub") else ".cache")
    cache_dir = base_cache / f"models--{model_id.replace('/', '--')}"

    try:
        base_cache.mkdir(exist_ok=True)
        logger.info(f"Using cache directory: {cache_dir}")
    except Exception as e:
        logger.error(f"Failed to create cache directory: {e}")
        sys.exit(1)

    downloader = ModelDownloader(model_id, cache_dir)
    result = downloader.download()

    if not result.success:
        logger.error(f"Download failed: {result.error}")
        sys.exit(1)

    logger.info(f"Download successful: {result.model_path}")
    sys.exit(0)


if __name__ == "__main__":
    main()
