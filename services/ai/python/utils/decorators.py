from functools import wraps
from .memory import log_memory_usage
from .metrics import measure_time


def track_resources(func):
    @wraps(func)
    @measure_time
    def wrapper(*args, **kwargs):
        log_memory_usage()
        result = func(*args, **kwargs)
        log_memory_usage()
        return result

    return wrapper
