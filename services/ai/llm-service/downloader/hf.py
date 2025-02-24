import os
import time
import logging
from pathlib import Path
from typing import Optional, Callable, Any, Set

from huggingface_hub import snapshot_download
from huggingface_hub.hf_api import HfApi
from config.settings import Settings

logger = logging.getLogger(__name__)


class ModelDownloader:
    """Download component."""
    REQUIRED_FILES: Set[str] = {
        "config.json",
        "tokenizer.json",
        "tokenizer_config.json"
    }

    def __init__(self, settings: 'Settings') -> None:
        self.settings = settings
        self.api = HfApi()
        if self.settings.cache is None:
            raise ValueError("Cache manager not initialized")

    def download(self, model_id: str, progress_callback: Optional[Callable[[Any], None]] = None) -> bool:
        """Download model with progress monitoring."""
        try:
            assert self.settings.cache is not None
            model_dir = self.settings.cache.get_model_path(model_id)

            # Verify model exists
            try:
                self.api.model_info(model_id)
            except Exception as e:
                logger.error(f"Model {model_id} not found: {e}")
                return False

            # Download with retries
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    result = snapshot_download(
                        repo_id=model_id,
                        local_dir=str(model_dir),
                        local_files_only=False,
                        token=os.getenv("HF_TOKEN"),
                        max_workers=4
                    )
                    if isinstance(result, str):
                        return Path(result).exists()
                    return False

                except (ConnectionError, TimeoutError) as e:
                    if attempt == max_retries - 1:
                        logger.error(f"Max retries reached: {e}")
                        return False
                    wait_time = 2 ** attempt
                    logger.warning(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)

            return False

        except Exception as e:
            logger.error(f"Download failed: {e}")
            return False

    def _verify_model(self, model_dir: Path) -> bool:
        """Verify downloaded model files."""
        if not model_dir.exists():
            return False

        required_files = {"config.json", "model.safetensors", "tokenizer.json"}
        existing_files = {f.name for f in model_dir.iterdir() if f.is_file()}

        return bool(required_files.intersection(existing_files))
