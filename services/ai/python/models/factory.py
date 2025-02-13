from typing import Type, Dict
from .base import BaseModel
from .deepseek import DeepSeekCoder
from .codellama import CodeLlama


class ModelFactory:
    """Factory class for creating LLM model instances."""

    _models: Dict[str, Type[BaseModel]] = {
        "deepseek": DeepSeekCoder,
        "codellama": CodeLlama,
    }

    @classmethod
    def get_model(cls, model_type: str) -> Type[BaseModel]:
        """
        Get a model class by type name.

        Args:
            model_type: The name of the model to retrieve

        Returns:
            The model class

        Raises:
            ValueError: If model_type is not registered
        """
        model_class = cls._models.get(model_type)
        if not model_class:
            raise ValueError(f"Unknown model type: {model_type}")
        return model_class

    @classmethod
    def register_model(cls, name: str, model_class: Type[BaseModel]) -> None:
        """
        Register a new model type.

        Args:
            name: The name to register the model under
            model_class: The model class to register
        """
        cls._models[name] = model_class
