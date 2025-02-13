from .base import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging

logger = logging.getLogger(__name__)


class DeepSeekCoder(BaseModel):
    def __init__(self, model_config):
        super().__init__()
        self.model_id = model_config["model_id"]
        self.params = model_config["parameters"]

    def load_model(self):
        logger.info(f"Loading DeepSeek model: {self.model_id}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id,
            use_fast=True,
            trust_remote_code=True,
            cache_dir=self.cache_dir,
        )

        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            device_map="cpu",
            torch_dtype=torch.bfloat16,
            trust_remote_code=True,
            low_cpu_mem_usage=True,
            cache_dir=self.cache_dir,
        )

        logger.info("DeepSeek model loaded successfully")
        return self.model, self.tokenizer

    def generate(self, prompt: str, **kwargs):
        if not self.model or not self.tokenizer:
            raise RuntimeError("Model and tokenizer must be loaded before generation")

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
