import pytest
from pathlib import Path
from config.settings import Settings


@pytest.fixture
def env_file(tmp_path):
    """Create test environment file."""
    env_file = tmp_path / "test.env"
    env_file.write_text("HF_HUB_DOWNLOAD_TIMEOUT=60\nCACHE_DIR=/tmp/cache")
    return env_file


def test_settings_initialization():
    """Test settings initialization."""
    settings = Settings()
    assert isinstance(settings.cache_dir, Path)


def test_env_loading():
    """Test environment loading."""
    settings = Settings()
    assert hasattr(settings, '_config')


def test_env_file_loading(env_file, monkeypatch):
    """Test loading specific env file."""
    monkeypatch.setenv("ENV", "test")
    settings = Settings()
    assert settings.get("HF_HUB_DOWNLOAD_TIMEOUT") == 60
    assert settings.get("CACHE_DIR") == "/tmp/cache"


def test_optional_env_loading(monkeypatch):
    """Test loading optional env vars."""
    monkeypatch.setenv("HF_HUB_DOWNLOAD_TIMEOUT", "120")
    settings = Settings()
    assert settings.get("HF_HUB_DOWNLOAD_TIMEOUT") == 120
    assert settings.get("NONEXISTENT", "default") == "default"
