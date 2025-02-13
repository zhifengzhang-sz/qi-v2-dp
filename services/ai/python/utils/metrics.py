import time
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def measure_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        logger.info(f"{func.__name__} took {duration:.2f} seconds")
        return result

    return wrapper
