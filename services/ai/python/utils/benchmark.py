from typing import List, Dict, Any, Union
import time
from .memory import log_memory_usage


def benchmark_model(model, prompts: List[str]) -> List[Dict[str, Union[int, float]]]:
    results = []
    for prompt in prompts:
        start = time.time()
        response = model.generate(prompt)
        duration = time.time() - start
        results.append(
            {
                "prompt_length": len(prompt),
                "response_length": len(response),
                "duration": duration,
                "memory_usage": log_memory_usage(),
            }
        )
    return results
