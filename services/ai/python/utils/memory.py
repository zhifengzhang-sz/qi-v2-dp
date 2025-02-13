import psutil
import logging

logger = logging.getLogger(__name__)


def log_memory_usage() -> float:
    process = psutil.Process()
    memory_info = process.memory_info()
    memory_mb = memory_info.rss / 1024 / 1024

    logger.info(
        f"Memory Usage - RSS: {memory_mb:.2f}MB, "
        f"VMS: {memory_info.vms / 1024 / 1024:.2f}MB"
    )
    return memory_mb
