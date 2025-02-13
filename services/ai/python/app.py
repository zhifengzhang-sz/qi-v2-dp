import os
import time

import torch
from tqdm import tqdm
from transformers import AutoModelForCausalLM, AutoTokenizer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_model():
    model_id = "deepseek-ai/deepseek-coder-6.7b-base"
    logger.info("Starting DeepSeek Coder 6.7B setup (CPU mode)...")

    logger.info("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)

    logger.info("Loading model in CPU mode...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float32,  # Use float32 for CPU
        device_map="cpu",
        trust_remote_code=True
    )

    return model, tokenizer


def generate_text(prompt, model, tokenizer, max_length=500):
    # Add progress bar for generation
    inputs = tokenizer(prompt, return_tensors="pt")

    print("\nGenerating response...")
    outputs = model.generate(
        **inputs,
        max_length=max_length,
        num_return_sequences=1,
        temperature=0.7,
        do_sample=True,
        top_p=0.95,
        repetition_penalty=1.1,
        pad_token_id=tokenizer.eos_token_id,
        use_cache=True,
    )

    return tokenizer.decode(outputs[0], skip_special_tokens=True)


def run_benchmark(model, tokenizer):
    from tqdm import tqdm
    logger.info("Starting benchmark with optimized settings...")
    prompts = [
        "Write a sorting function",
        "Implement binary search",
        "Create a linked list class"
    ]
    
    results = []
    for prompt in tqdm(prompts, desc="Running benchmarks"):
        start_time = time.time()
        response = generate_text(prompt, model, tokenizer)
        duration = time.time() - start_time
        results.append({
            "prompt": prompt,
            "duration": duration,
            "tokens": len(response.split())
        })
    
    return results


def setup_environment():
    # Set number of threads based on CPU cores
    num_threads = min(
        os.cpu_count() or 1, 8
    )  # Cap at 8 threads, default to 1 if cpu_count is None
    os.environ["OMP_NUM_THREADS"] = str(num_threads)
    os.environ["MKL_NUM_THREADS"] = str(num_threads)
    torch.set_num_threads(num_threads)

    # Enable memory efficient options
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--benchmark", action="store_true", help="Run benchmark mode")
    args = parser.parse_args()

    print("Optimizing environment settings...")
    setup_environment()
    model, tokenizer = load_model()

    if args.benchmark:
        logger.info("Running benchmark tests...")
        results = run_benchmark(model, tokenizer)
        print("\nBenchmark Results:")
        for result in results:
            print(f"Prompt: {result['prompt'][:30]}...")
            print(f"Duration: {result['duration']:.2f}s")
            print(f"Tokens: {result['tokens']}\n")
    else:
        print("Starting DeepSeek Coder 6.7B setup (optimized for CPU)...")
        model, tokenizer = load_model()

        # Test with a coding task
        prompt = """Write a Python function to implement merge sort. Include comments explaining the code."""

        print("\nGenerating code...")
        response = generate_text(prompt, model, tokenizer)
        print(f"\nResponse:\n{response}")
