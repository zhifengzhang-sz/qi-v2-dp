from pathlib import Path

import pytest

from config.settings import Settings


@pytest.fixture
def test_env(tmp_path: Path) -> Path:
    """Setup test environment."""
    env_file = tmp_path / ".env"
    env_file.write_text(
        """
    ENV=test
    CACHE_DIR=/tmp/test_cache
    HF_HUB_DOWNLOAD_TIMEOUT=60
    """
    )
    return env_file


def test_settings_initialization(test_env: Path) -> None:
    """Test settings initialization."""
    settings = Settings(_env_file=test_env)
    assert isinstance(settings.CACHE_DIR, Path)


def test_env_loading(test_env: Path) -> None:
    """Test environment loading."""
    settings = Settings(_env_file=test_env)
    assert hasattr(settings, "_config")


def test_env_file_loading(test_env: Path) -> None:
    """Test loading specific env file."""
    settings = Settings(_env_file=test_env)
    # Use exact value from env file
    assert settings.HF_HUB_DOWNLOAD_TIMEOUT == 60


def test_optional_env_loading(test_env: Path) -> None:
    """Test loading optional env vars."""
    settings = Settings(_env_file=test_env)
    assert settings.get("NONEXISTENT", "default") == "default"
