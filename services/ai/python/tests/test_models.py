import pytest
from models.factory import ModelFactory
from models.base import BaseModel
from config.model_config import MODEL_CONFIGS


def test_model_factory():
    model = ModelFactory.get_model("deepseek")
    assert issubclass(model, BaseModel)


def test_model_config_validation():
    config = MODEL_CONFIGS["deepseek"]
    from config.validation import ModelConfig

    model_config = ModelConfig(**config)
    model_config.validate()  # Should not raise


def test_model_input_validation():
    model = ModelFactory.get_model("deepseek")(MODEL_CONFIGS["deepseek"])
    assert model.validate_input("valid prompt") is True
    assert model.validate_input("" * 3000) is False


def test_model_preprocessing():
    model = ModelFactory.get_model("deepseek")(MODEL_CONFIGS["deepseek"])
    assert model.preprocess_prompt("  test  ") == "test"
