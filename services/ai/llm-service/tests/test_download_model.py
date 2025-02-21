import pytest
from pathlib import Path
from scripts.download_model import download_model
from unittest.mock import patch, Mock
from huggingface_hub.utils import (
    HfHubHTTPError,
    RepositoryNotFoundError,
)
import os
import shutil
import requests


@pytest.fixture
def cache_dir(tmp_path):
    """Provide a temporary cache directory"""
    path = tmp_path / "model_cache"
    path.mkdir(parents=True, exist_ok=True)
    return path


@pytest.fixture
def mock_snapshot_download():
    with patch('scripts.download_model.snapshot_download') as mock:
        yield mock


def test_download_model_success(cache_dir, mock_snapshot_download):
    """Test successful model download"""
    mock_snapshot_download.return_value = str(cache_dir)
    assert download_model("valid/model", cache_dir)


def test_download_model_not_found(cache_dir, mock_snapshot_download):
    """Test handling of non-existent model"""
    mock_snapshot_download.side_effect = RepositoryNotFoundError(
        "Model not found")
    assert not download_model("invalid/model", cache_dir)


def test_download_model_http_error(cache_dir, mock_snapshot_download):
    """Test handling of HTTP errors"""
    # Create a mock Request object
    mock_request = Mock(spec=requests.Request)

    # Create a mock Response object with all required attributes
    mock_response = Mock(spec=requests.Response)
    mock_response.headers = {"x-request-id": "test-request-id"}
    mock_response.status_code = 500
    mock_response.request = mock_request
    mock_response.url = "https://huggingface.co/api/models/test"

    # Create HfHubHTTPError with proper Response object
    error = HfHubHTTPError("HTTP Error", response=mock_response)
    mock_snapshot_download.side_effect = error

    assert not download_model("valid/model", cache_dir)


def test_download_model_unexpected_error(cache_dir, mock_snapshot_download):
    """Test handling of unexpected errors"""
    mock_snapshot_download.side_effect = Exception("Unexpected error")
    assert not download_model("valid/model", cache_dir)


def test_download_model_no_token(cache_dir, mock_snapshot_download, monkeypatch):
    """Test download without HF token"""
    monkeypatch.delenv("HF_TOKEN", raising=False)
    mock_snapshot_download.return_value = str(cache_dir)
    assert download_model("valid/model", cache_dir)


@pytest.mark.integration
def test_download_real_model(cache_dir):
    """Test downloading a real tiny test model"""
    model_id = "hf-internal-testing/tiny-random-gpt2"
    assert download_model(model_id, cache_dir)
    # Verify files were downloaded
    assert any(cache_dir.iterdir())


def test_main_no_model_id(monkeypatch):
    """Test main function when MODEL_ID is not set"""
    monkeypatch.delenv("MODEL_ID", raising=False)
    with pytest.raises(SystemExit) as exit_info:
        from scripts.download_model import main
        main()
    assert exit_info.value.code == 1


def test_main_success(monkeypatch, cache_dir):
    """Test main function with successful download"""
    monkeypatch.setenv("MODEL_ID", "test/model")
    monkeypatch.setenv("HF_TOKEN", "test-token")
    monkeypatch.setattr(
        "scripts.download_model.download_model", lambda *args: True)

    with pytest.raises(SystemExit) as exit_info:
        from scripts.download_model import main
        main()
    assert exit_info.value.code == 0


def test_main_failure(monkeypatch, cache_dir):
    """Test main function with failed download"""
    monkeypatch.setenv("MODEL_ID", "test/model")
    monkeypatch.setattr(
        "scripts.download_model.download_model", lambda *args: False)

    with pytest.raises(SystemExit) as exit_info:
        from scripts.download_model import main
        main()
    assert exit_info.value.code == 1
