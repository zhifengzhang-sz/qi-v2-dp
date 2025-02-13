from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Tuple
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from utils.memory import log_memory_usage


class BaseModel(ABC):
    def __init__(self, cache_dir: str = "/cache/transformers") -> None:
        self.cache_dir = cache_dir
        self.model: Optional[AutoModelForCausalLM] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        log_memory_usage()  # Monitor initial state

    @abstractmethod
    def load_model(self) -> Tuple[AutoModelForCausalLM, AutoTokenizer]:
        pass

    @abstractmethod
    def generate(self, prompt: str, **kwargs: Dict[str, Any]) -> str:
        """
        Generate text from a prompt.

        Args:
            prompt: Input text to generate from
            **kwargs: Additional generation parameters

        Returns:
            Generated text response

        Raises:
            RuntimeError: If model not loaded
        """
        pass

    @abstractmethod
    def validate_input(self, prompt: str) -> bool:
        """Validate input prompt before generation"""
        pass

    @abstractmethod
    def preprocess_prompt(self, prompt: str) -> str:
        """Preprocess the input prompt"""
        pass
