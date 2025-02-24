from pathlib import Path
from typing import Any

import pytest
from pytest_mock import MockerFixture

from config.settings import Settings
from downloader import ModelDownloader


@pytest.fixture
def env_setup(monkeypatch: pytest.MonkeyPatch) -> None:
    """Setup required environment variables."""
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("HF_TOKEN", "dummy-token")


@pytest.fixture
def test_settings(tmp_path: Path, env_setup: None) -> Settings:
    """Setup test settings with temp path."""
    settings = Settings(ENV="test", CACHE_DIR=tmp_path)
    return settings


def test_download_retry(mocker: MockerFixture, test_settings: Settings) -> None:
    """Test retry mechanism."""
    # Setup model path
    model_path = test_settings.CACHE_DIR / "test_model"
    model_path.mkdir(parents=True, exist_ok=True)
    (model_path / "pytorch_model.bin").touch()

    # Mock HuggingFace Hub calls
    mocker.patch("huggingface_hub.hf_api.HfApi.model_info")
    mock_download = mocker.patch(
        "downloader.hf.snapshot_download",
        autospec=True,
        side_effect=[ConnectionError(), str(model_path)],
    )

    downloader = ModelDownloader(test_settings)
    result = downloader.download("test/model")

    assert result is True
    assert mock_download.call_count == 2


def test_download_timeout(mocker: MockerFixture, test_settings: Settings) -> None:
    """Test timeout handling."""
    # Mock HuggingFace Hub calls
    mocker.patch("huggingface_hub.hf_api.HfApi.model_info")
    mock_download = mocker.patch(
        "downloader.hf.snapshot_download", autospec=True, side_effect=TimeoutError()
    )

    downloader = ModelDownloader(test_settings)
    result = downloader.download("test/model")

    assert not result
    assert mock_download.call_count == 3  # Matches retry logic in implementation


def test_download_with_progress(mocker: MockerFixture, test_settings: Settings) -> None:
    """Test progress callback."""
    # Setup model path
    model_path = test_settings.CACHE_DIR / "test_model"
    model_path.mkdir(parents=True, exist_ok=True)
    (model_path / "pytorch_model.bin").touch()

    # Mock HuggingFace Hub calls
    mocker.patch("huggingface_hub.hf_api.HfApi.model_info")
    mock_download = mocker.patch(
        "downloader.hf.snapshot_download", autospec=True, return_value=str(model_path)
    )

    progress_calls = []

    def progress_callback(x: Any) -> None:
        progress_calls.append(x)

    downloader = ModelDownloader(test_settings)
    result = downloader.download("test/model", progress_callback=progress_callback)

    assert result is True
    assert mock_download.called
