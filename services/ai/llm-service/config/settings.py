from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Literal


class ComputeSettings(BaseSettings):
    DEVICE_TYPE: Literal["cpu", "cuda"] = "cpu"
    GPU_MEMORY: str | None = None  # e.g. "24GiB"
    NUM_GPUS: int = 0
    QUANTIZATION: Literal["none", "4bit", "8bit"] = "none"


class DownloadSettings(BaseSettings):
    MODEL_ID: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    CACHE_DIR: Path = Path("/data/hub")
    HF_TOKEN: str | None = None
    IGNORE_PATTERNS: list[str] = ["*.msgpack", "*.h5"]
    COMPUTE: ComputeSettings = ComputeSettings()

    class Config:
        env_file = "config/infra/default.env"
        env_file_encoding = "utf-8"
