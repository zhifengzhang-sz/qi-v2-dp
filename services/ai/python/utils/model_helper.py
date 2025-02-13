import os
from config.model_config import MODEL_CONFIGS

def get_model_config():
    model_name = os.getenv("MODEL_NAME", "deepseek-6.7b")
    if model_name not in MODEL_CONFIGS:
        raise ValueError(f"Unknown model: {model_name}. Available models: {list(MODEL_CONFIGS.keys())}")
    return MODEL_CONFIGS[model_name]