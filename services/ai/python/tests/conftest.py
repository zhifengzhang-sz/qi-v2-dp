import pytest
import warnings


def pytest_configure(config):
    """Configure pytest - filter out known warnings."""
    warnings.filterwarnings(
        "ignore",
        message=".*TRANSFORMERS_CACHE.*",
        category=FutureWarning,
    )


@pytest.fixture(autouse=True)
def setup_test_env():
    """Set up test environment."""
    # Add any test environment setup here
    yield
    # Add any cleanup here
