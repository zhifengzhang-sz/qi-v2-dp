from typing import TypedDict, Dict, Literal
from dataclasses import dataclass


@dataclass
class ModelParameters:
    max_length: int
    temperature: float
    top_p: float
    num_threads: int

    def validate(self) -> None:
        assert 0 < self.temperature <= 1, "Temperature must be between 0 and 1"
        assert 0 < self.top_p <= 1, "Top_p must be between 0 and 1"
        assert self.max_length > 0, "Max length must be positive"
        assert self.num_threads > 0, "Number of threads must be positive"


@dataclass
class ModelConfig:
    model_id: str
    model_type: Literal["deepseek", "codegen", "starcoder", "phi"]
    description: str
    parameters: str
    cpu_friendly: bool

# Available model configurations
MODEL_CONFIGS = {
    "deepseek-6.7b": ModelConfig(
        model_id="deepseek-ai/deepseek-coder-6.7b-base",
        model_type="deepseek",
        description="DeepSeek Coder 6.7B - Full model",
        parameters="6.7B",
        cpu_friendly=False
    ),
    "codegen-350m": ModelConfig(
        model_id="Salesforce/codegen-350m-mono",
        model_type="codegen",
        description="CodeGen 350M - Fast CPU model",
        parameters="350M",
        cpu_friendly=True
    ),
    "starcoder-1b": ModelConfig(
        model_id="bigcode/starcoderbase-1b",
        model_type="starcoder",
        description="StarCoder 1B - Balanced model",
        parameters="1B",
        cpu_friendly=True
    )
}

ACTIVE_MODEL = "deepseek"
