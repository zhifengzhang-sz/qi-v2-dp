import pytest
from pathlib import Path
from downloader.hf import ModelDownloader
from config.settings import Settings


def test_download_initialization():
    """Test downloader initialization."""
    settings = Settings()
    downloader = ModelDownloader(settings)
    assert hasattr(downloader, 'settings')


def test_download_verification(tmp_path):
    """Test model verification."""
    settings = Settings()
    settings.cache_dir = tmp_path
    downloader = ModelDownloader(settings)
    assert not downloader._verify_model(tmp_path)


def test_download_retry(mocker):
    """Test retry mechanism."""
    settings = Settings()
    downloader = ModelDownloader(settings)
    mock_download = mocker.patch("huggingface_hub.snapshot_download")
    mock_download.side_effect = [TimeoutError(), None]

    assert downloader.download("test/model")
    assert mock_download.call_count == 2


def test_download_timeout(mocker):
    """Test timeout handling."""
    settings = Settings()
    downloader = ModelDownloader(settings)
    mock_download = mocker.patch("huggingface_hub.snapshot_download")
    mock_download.side_effect = TimeoutError()

    assert not downloader.download("test/model")


def test_download_with_progress(mocker):
    """Test download with progress monitoring."""
    settings = Settings()
    downloader = ModelDownloader(settings)
    progress_calls = []

    def progress_callback(info):
        progress_calls.append(info)

    mock_download = mocker.patch("huggingface_hub.snapshot_download")
    downloader.download("test/model", progress_callback)
    assert len(progress_calls) > 0


def test_download_retry_mechanism(mocker):
    """Test retry mechanism."""
    settings = Settings()
    downloader = ModelDownloader(settings)
    mock_download = mocker.patch("huggingface_hub.snapshot_download")
    mock_download.side_effect = [TimeoutError(
        "Timeout"), None]  # Fix return value

    assert downloader.download("test/model")
    assert mock_download.call_count == 2
