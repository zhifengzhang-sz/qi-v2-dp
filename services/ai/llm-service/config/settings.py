from pathlib import Path
import os
import logging
from typing import Dict, Any, Callable, Optional, Set, ClassVar
from cache.manager import CacheManager
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Configuration component."""
    # Pydantic model config
    model_config = SettingsConfigDict(arbitrary_types_allowed=True)

    # Class variables
    REQUIRED_ENV: ClassVar[Set[str]] = {"ENV"}
    OPTIONAL_ENV: ClassVar[Set[str]] = {
        "HF_MAX_RETRIES",
        "HF_HUB_ENABLE_HF_TRANSFER",
        "HF_HUB_OFFLINE",
        "CACHE_DIR",
        "HF_HUB_DOWNLOAD_TIMEOUT",
        "MODEL_ID"
    }

    # Instance fields
    ENV: str = "test"
    CACHE_DIR: Path = Path.home() / ".cache" / "huggingface"
    HF_MAX_RETRIES: Optional[int] = 3
    HF_HUB_ENABLE_HF_TRANSFER: Optional[bool] = True
    HF_HUB_OFFLINE: Optional[bool] = False
    HF_HUB_DOWNLOAD_TIMEOUT: Optional[int] = 300
    MODEL_ID: Optional[str] = None
    cache: Optional[CacheManager] = None

    @model_validator(mode='after')
    def setup_cache(self) -> 'Settings':
        """Initialize cache manager after model validation."""
        if self.ENV == "test":
            self.CACHE_DIR = Path("/tmp/test_cache")
        if self.cache is None:
            self.cache = CacheManager(self.CACHE_DIR)
        return self

    VALIDATORS: Dict[str, Callable[[Any], Any]] = {
        "HF_HUB_DOWNLOAD_TIMEOUT": lambda x: int(x) if x else 300,
        "CACHE_DIR": lambda x: str(x) if x else ".cache",
        "HF_MAX_RETRIES": lambda x: int(x) if x else 3,
        # Add missing validator
        "HF_HUB_ENABLE_HF_TRANSFER": lambda x: bool(int(x)) if x else False,
        # Add missing validator
        "HF_HUB_OFFLINE": lambda x: bool(int(x)) if x else False,
    }

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self._config: Dict[str, Any] = {}
        if not self._load_env():
            logger.error("Failed to load environment configuration")

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
