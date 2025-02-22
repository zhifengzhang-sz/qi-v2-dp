from pathlib import Path
from typing import Any

import pytest
from huggingface_hub.utils import HfHubHTTPError, RepositoryNotFoundError
from pytest_mock import MockFixture

from scripts.download_model import REQUIRED_FILES, download_model, verify_model


@pytest.fixture
def cache_dir(tmp_path: Path) -> Path:
    """Create a temporary cache directory."""
    cache = tmp_path / "cache"
    models_dir = cache / "models"
    models_dir.mkdir(parents=True)
    return cache


@pytest.fixture
def setup_model_files(cache_dir: Path) -> Path:
    """Setup model files for testing."""
    model_dir = cache_dir / "models" / "valid--model"
    model_dir.mkdir(parents=True)
    for file in REQUIRED_FILES:
        (model_dir / file).touch()
    return model_dir


@pytest.fixture
def mock_snapshot_download(mocker: MockFixture) -> Any:
    """Mock HuggingFace download function."""
    return mocker.patch("scripts.download_model.snapshot_download")


def test_download_model_success(
    cache_dir: Path, mock_snapshot_download: Any, setup_model_files: Path
) -> None:
    """Test successful model download."""
    mock_snapshot_download.return_value = str(setup_model_files)
    assert download_model("valid/model", cache_dir)


def test_download_invalid_model(cache_dir: Path, mock_snapshot_download: Any) -> None:
    """Test download with invalid model ID."""
    mock_snapshot_download.side_effect = RepositoryNotFoundError("Invalid model")
    assert not download_model("invalid/model", cache_dir)


def test_download_http_error(cache_dir: Path, mock_snapshot_download: Any) -> None:
    """Test download with HTTP error."""
    mock_snapshot_download.side_effect = HfHubHTTPError("HTTP Error", None)
    assert not download_model("valid/model", cache_dir)


def test_download_unexpected_error(
    cache_dir: Path, mock_snapshot_download: Any
) -> None:
    """Test download with unexpected error."""
    mock_snapshot_download.side_effect = Exception("Unexpected error")
    assert not download_model("valid/model", cache_dir)


def test_verify_model(setup_model_files: Path) -> None:
    """Test model verification."""
    assert verify_model(setup_model_files, "valid/model")


def test_verify_model_missing_files(cache_dir: Path) -> None:
    """Test model verification with missing files."""
    model_dir = cache_dir / "models" / "test--model"
    model_dir.mkdir(parents=True)
    assert not verify_model(model_dir, "test/model")


def test_main_success(monkeypatch: pytest.MonkeyPatch, cache_dir: Path) -> None:
    """Test main function success."""
    monkeypatch.setattr(
        "sys.argv",
        ["script", "--model-id", "test/model", "--cache-dir", str(cache_dir)],
    )
    monkeypatch.setattr("scripts.download_model.download_model", lambda *args: True)

    with pytest.raises(SystemExit) as exc:
        from scripts.download_model import main

        main()
    assert exc.value.code == 0


def test_main_failure(monkeypatch: pytest.MonkeyPatch, cache_dir: Path) -> None:
    """Test main function failure."""
    monkeypatch.setattr(
        "sys.argv",
        ["script", "--model-id", "test/model", "--cache-dir", str(cache_dir)],
    )
    monkeypatch.setattr("scripts.download_model.download_model", lambda *args: False)

    with pytest.raises(SystemExit) as exc:
        from scripts.download_model import main

        main()
    assert exc.value.code == 1


def test_download_real_model() -> None:
    """Integration test with real tiny model."""
    cache_dir = Path(".cache")
    model_id = "hf-internal-testing/tiny-random-gpt2"
    assert download_model(model_id, cache_dir)
