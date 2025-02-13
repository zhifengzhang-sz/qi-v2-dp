from .base import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging

logger = logging.getLogger(__name__)


class CodeLlama(BaseModel):
    def __init__(self, model_config):
        super().__init__()
        self.model_id = model_config["model_id"]
        self.params = model_config["parameters"]

    def load_model(self):
        """Load the CodeLlama model and tokenizer"""
        logger.info(f"Loading CodeLlama model: {self.model_id}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            use_fast=True,
            trust_remote_code=True,
            cache_dir=self.cache_dir,
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            device_map="cpu",  # Assuming CPU usage, modify for GPU
            torch_dtype=torch.bfloat16,
            trust_remote_code=True,
            low_cpu_mem_usage=True,
            offload_folder="offload",
            cache_dir=self.cache_dir,
        )

        logger.info("CodeLlama model loaded successfully")
        return self.model, self.tokenizer

    def generate(self, prompt: str, **kwargs):
        """Generate code from a prompt"""
        if not self.model or not self.tokenizer:
            raise RuntimeError("Model and tokenizer must be loaded before generation")

        # Merge default parameters with any provided kwargs
        params = {**self.params, **kwargs}

        inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True)

        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=params.get("max_length", 2048),
                temperature=params.get("temperature", 0.7),
                top_p=params.get("top_p", 0.95),
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response.replace(prompt, "").strip()

    def validate_input(self, prompt: str) -> bool:
        if not prompt or not prompt.strip():
            return False
        if len(prompt) > self.params.get("max_length", 2048):
            return False
        return True

    def preprocess_prompt(self, prompt: str) -> str:
        return prompt.strip()
