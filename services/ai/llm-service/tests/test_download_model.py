from scripts.download_model import (
    ModelDownloader,
    DownloadResult,
    DownloadStrategy,
    SafetensorsStrategy,
    DefaultStrategy,
    RetryPolicy
)
import sys
from pathlib import Path
import pytest
from unittest.mock import Mock, patch
import shutil

sys.path.append(str(Path(__file__).parent.parent))


@pytest.fixture(autouse=True)
def mock_hf_api(mocker):
    """Mock HF API with necessary returns"""
    # Mock the API class
    mock = mocker.patch('huggingface_hub.HfApi')

    # Create mock objects with proper attributes
    mock_sibling = Mock(
        rfilename="model.safetensors",
        size=1_000_000,  # 1MB for testing
        lfs=True
    )

    # Set up model_info mock with proper structure
    mock_info = Mock(siblings=[mock_sibling])

    # Important: Configure the mock chain BEFORE any access
    api_instance = Mock()
    api_instance.model_info = Mock(return_value=mock_info)
    mock.return_value = api_instance

    return mock


@pytest.fixture
def cache_dir():
    path = Path(".cache/test")
    path.mkdir(parents=True, exist_ok=True)
    yield path
    if path.exists():
        shutil.rmtree(path)


@pytest.fixture
def tiny_llama_id():
    return "TinyLlama/TinyLlama-1.1B-Chat-v1.0"


@patch('os.statvfs')
@patch('huggingface_hub.snapshot_download')
def test_model_download(mock_snapshot, mock_statvfs, mock_hf_api, cache_dir, tiny_llama_id):
    """Test basic download functionality"""
    # Setup space check
    mock_statvfs.return_value = Mock(
        f_frsize=4096,
        f_bavail=262144  # 1GB
    )

    # Setup successful download
    mock_snapshot.return_value = str(cache_dir)

    # Create test files to simulate download
    (cache_dir / "model.safetensors").touch()

    downloader = ModelDownloader(tiny_llama_id, cache_dir)
    result = downloader.download()
    assert result.success


@patch('os.statvfs')
@patch('huggingface_hub.snapshot_download')
def test_download_resume(mock_snapshot, mock_statvfs, mock_hf_api, cache_dir):
    """Test download resume capability"""
    # Use same space check values as test_model_download
    mock_statvfs.return_value = Mock(
        f_frsize=4096,
        f_bavail=262144  # 1GB
    )
    mock_snapshot.return_value = str(cache_dir)

    # Create test files
    (cache_dir / "model.safetensors").touch()

    downloader = ModelDownloader("test/model", cache_dir)
    result = downloader.download()
    assert result.success


def test_strategy_selection(mock_hf_api, cache_dir):
    """Test strategy selection logic"""
    # Create mock instance and response
    api_instance = Mock()
    mock_sibling = Mock(rfilename="model.safetensors", size=1_000_000)
    mock_info = Mock(siblings=[mock_sibling])
    api_instance.model_info = Mock(return_value=mock_info)

    # Set up the mock chain
    mock_hf_api.return_value = api_instance

    # Create downloader and verify strategy
    downloader = ModelDownloader("test/model", cache_dir)
    assert isinstance(downloader.strategy, SafetensorsStrategy)


@patch('os.statvfs')
def test_space_check(mock_statvfs, mock_hf_api, cache_dir):
    """Test disk space verification"""
    # Create mock instance and response
    api_instance = Mock()
    mock_sibling = Mock(rfilename="model.safetensors", size=1_000_000)
    mock_info = Mock(siblings=[mock_sibling])
    api_instance.model_info = Mock(return_value=mock_info)

    # Set up the mock chain
    mock_hf_api.return_value = api_instance

    # Set up disk space mock
    mock_statvfs.return_value = Mock(
        f_frsize=4096,
        f_bavail=262144  # 1GB worth of blocks
    )

    # Create downloader and verify space check
    downloader = ModelDownloader("test/model", cache_dir)
    assert downloader.ensure_space()


def test_invalid_model(cache_dir):
    """Test error handling for invalid model"""
    with pytest.raises(ValueError):
        ModelDownloader("", cache_dir)


def test_cache_validation(mock_hf_api, cache_dir):
    """Test cache validation logic"""
    downloader = ModelDownloader("test/model", cache_dir)
    # Create mock cached files
    (cache_dir / "model.safetensors").touch()
    assert downloader.validate_cache()


def test_retry_policy():
    """Test retry mechanism"""
    policy = RetryPolicy(max_retries=2, delay=0)
    counter = {'attempts': 0}

    def test_func():
        counter['attempts'] += 1
        if counter['attempts'] < 2:
            raise Exception("Test error")
        return True

    assert policy.execute(test_func)
    assert counter['attempts'] == 2


def test_cleanup_incomplete(cache_dir):
    """Test cleanup of incomplete downloads"""
    downloader = ModelDownloader("test/model", cache_dir)

    # Create incomplete files
    (cache_dir / "model.safetensors.incomplete").touch()
    (cache_dir / "model.bin.part").touch()

    downloader.cleanup_incomplete()
    assert not list(cache_dir.glob("*.incomplete"))
    assert not list(cache_dir.glob("*.part"))
