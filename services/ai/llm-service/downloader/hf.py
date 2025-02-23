import os
import logging
from pathlib import Path
from typing import Set, Optional, Callable
from huggingface_hub import snapshot_download
from huggingface_hub.utils import RepositoryNotFoundError, HfHubHTTPError
import time
from config.settings import Settings

logger = logging.getLogger(__name__)


class ModelDownloader:
    """Download component."""
    REQUIRED_FILES: Set[str] = {
        "config.json",
        "tokenizer.json",
        "tokenizer_config.json"
    }

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def download(self, model_id: str, progress_callback: Optional[Callable] = None) -> bool:
        """Download model with progress monitoring."""
        try:
            model_dir = self.settings.cache.get_model_path(model_id)
            if model_dir.exists() and self._verify_model(model_dir):
                logger.info(f"Model {model_id} already exists")
                return True

            # Remove nested try blocks
            max_retries = self.settings.get("HF_MAX_RETRIES", 3)
            timeout = self.settings.get("HF_HUB_DOWNLOAD_TIMEOUT", 300)
            offline_mode = self.settings.get("HF_HUB_OFFLINE", False)

            for attempt in range(max_retries):
                try:
                    snapshot_download(
                        repo_id=model_id,
                        local_dir=model_dir,
                        token=os.getenv("HF_TOKEN"),
                        timeout=timeout,
                        max_workers=4,
                        tqdm_class=None if progress_callback else lambda x: x,
                        local_files_only=offline_mode
                    )
                    return self._verify_model(model_dir)
                except (HfHubHTTPError, TimeoutError) as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries reached: {e}")
                        return False
                    wait_time = 2 ** attempt
                    logger.warning(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)

        except Exception as e:
            logger.error(f"Download failed: {e}")
            return False

    def _verify_model(self, model_dir: Path) -> bool:
        """Verify downloaded model files."""
        if not model_dir.exists():
            return False

        files = {f.name for f in model_dir.iterdir() if f.is_file()}
        has_required = self.REQUIRED_FILES.issubset(files)
        has_weights = any(
            f in files for f in ["model.safetensors", "pytorch_model.bin"]
        )

        return has_required and has_weights
