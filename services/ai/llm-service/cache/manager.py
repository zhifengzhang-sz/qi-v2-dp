from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Cache management component."""

    def __init__(self, cache_dir: Path) -> None:
        self.cache_dir = cache_dir
        self.models_dir = cache_dir / "models"
        self._ensure_dirs()

    def _ensure_dirs(self) -> None:
        """Ensure cache directories exist."""
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def get_model_path(self, model_id: str) -> Path:
        """Get model directory path."""
        return self.models_dir / model_id.replace("/", "--")
