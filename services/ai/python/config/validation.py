from typing import Dict, Any
from dataclasses import dataclass


class ModelConfigError(Exception):
    """Raised when model configuration is invalid"""

    pass


@dataclass
class ModelConfig:
    model_id: str
    parameters: Dict[str, Any]

    def validate(self) -> None:
        if not isinstance(self.model_id, str):
            raise ModelConfigError("model_id must be a string")
