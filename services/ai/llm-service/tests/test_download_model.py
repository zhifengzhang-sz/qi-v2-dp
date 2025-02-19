import pytest
from pathlib import Path
from unittest.mock import Mock, patch
import shutil
from scripts.download_model import (
    ModelDownloader,
    DownloadResult,
    DownloadStrategy,
    SafetensorsStrategy,
    RetryPolicy  # Add missing import
)

@pytest.fixture
def cache_dir():
    """Provide temporary cache directory"""
    path = Path(".cache/test")
    path.mkdir(parents=True, exist_ok=True)
    yield path
    if path.exists():
        shutil.rmtree(path)

@pytest.fixture
def tiny_llama_id():
    """Test model ID"""
    return "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

@pytest.fixture
def mock_hf_api(mocker):
    """Mock HuggingFace API with specific model info"""
    mock = mocker.patch('huggingface_hub.HfApi')
    mock.return_value.model_info.return_value.siblings = [
        mocker.Mock(rfilename='model.safetensors', size=1000000)
    ]
    return mock

def test_model_download(cache_dir, tiny_llama_id):
    """Test basic download functionality"""
    downloader = ModelDownloader(tiny_llama_id, cache_dir)
    result = downloader.download()
    assert result.success
    assert result.model_path.exists()

def test_download_resume(mock_hf_api, cache_dir):
    """Test download resume capability"""
    downloader = ModelDownloader("test/model", cache_dir)
    
    # Create partial download state
    (cache_dir / "model.safetensors.incomplete").touch()
    
    result = downloader.download()
    assert result.success
    assert not list(cache_dir.glob("*.incomplete"))

def test_invalid_model(cache_dir):
    """Test error handling for invalid model"""
    with pytest.raises(ValueError):
        ModelDownloader("", cache_dir)

def test_strategy_selection(mock_hf_api, cache_dir):
    downloader = ModelDownloader("test/model", cache_dir)
    assert isinstance(downloader.strategy, SafetensorsStrategy)

def test_cache_validation(mock_hf_api, cache_dir):
    """Test cache validation logic"""
    downloader = ModelDownloader("test/model", cache_dir)
    # Create mock cached files
    (cache_dir / "model.safetensors").touch()
    assert downloader.validate_cache()

def test_space_check(mock_hf_api, cache_dir):
    """Test disk space verification with proper mocking"""
    # Mock statvfs
    with patch('pathlib.Path.statvfs') as mock_statvfs:
        mock_statvfs.return_value = Mock(
            f_frsize=4096,
            f_bavail=1000000  # Enough space
        )
        downloader = ModelDownloader("test/model", cache_dir)
        assert downloader.ensure_space()

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