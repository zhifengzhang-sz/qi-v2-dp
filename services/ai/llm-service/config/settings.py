from pathlib import Path
import os
import logging
from typing import Dict, Any
from cache.manager import CacheManager

logger = logging.getLogger(__name__)


class Settings:
    """Configuration component."""
    REQUIRED_ENV = {"ENV"}
    OPTIONAL_ENV = {
        "MODEL_ID",
        "CACHE_DIR",
        "HF_HUB_DOWNLOAD_TIMEOUT",
        "HF_MAX_RETRIES",
        "HF_HUB_ENABLE_HF_TRANSFER",
        "HF_HUB_OFFLINE"
    }

    VALIDATORS = {
        "HF_HUB_DOWNLOAD_TIMEOUT": lambda x: int(x) if x else 300,
        "CACHE_DIR": lambda x: str(x) if x else ".cache",
        "HF_MAX_RETRIES": lambda x: int(x) if x else 3,
        # Add missing validator
        "HF_HUB_ENABLE_HF_TRANSFER": lambda x: bool(int(x)) if x else False,
        # Add missing validator
        "HF_HUB_OFFLINE": lambda x: bool(int(x)) if x else False,
    }

    def __init__(self) -> None:
        self._config: Dict[str, Any] = {}
        if not self._load_env():
            logger.error("Failed to load environment configuration")
        self.cache_dir = Path(self.get("CACHE_DIR", ".cache"))
        self.cache = CacheManager(self.cache_dir)

    def _load_env(self) -> bool:
        """Load environment configuration."""
        env = os.getenv("ENV", "default")
        env_file = Path(__file__).parent / "infra" / f"{env}.env"

        # Load env file if exists
        if env_file.exists():
            if not self._load_env_file(env_file):
                return False

        # Override with environment variables
        for key in self.REQUIRED_ENV:
            if value := os.getenv(key):
                self._config[key] = value

        return self.validate_env()

    def _load_env_file(self, env_file: Path) -> bool:
        """Load environment file configuration."""
        try:
            with env_file.open() as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        key, value = line.split("=", 1)
                        self._config[key.strip()] = value.strip()
        except Exception as e:
            logger.error(f"Failed to load env file {env_file}: {e}")
            return False
        return True

    def validate_env(self) -> bool:
        """Validate environment configuration."""
        missing = self.REQUIRED_ENV - self._config.keys()
        if missing:
            logger.error(f"Missing required environment variables: {missing}")
            return False

        for key, value in self._config.items():
            if validator := self.VALIDATORS.get(key):
                try:
                    self._config[key] = validator(value)
                except (ValueError, TypeError) as e:
                    logger.error(f"Invalid value for {key}: {e}")
                    return False
        return True

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value with validation."""
        value = self._config.get(key, default)
        if validator := self.VALIDATORS.get(key):
            try:
                return validator(value)
            except (ValueError, TypeError):
                return default
        return value
