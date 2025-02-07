from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from tqdm import tqdm
import os

def load_model():
    model_id = "deepseek-ai/deepseek-coder-6.7b-base"
    
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        use_fast=True,
        trust_remote_code=True
    )
    
    print("Loading model with 8-bit quantization...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        device_map="cpu",
        load_in_8bit=True,
        torch_dtype=torch.float16,
        trust_remote_code=True,
        low_cpu_mem_usage=True
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
        use_cache=True
    )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

def setup_environment():
    # Set number of threads based on CPU cores
    num_threads = min(os.cpu_count(), 8)  # Cap at 8 threads
    os.environ["OMP_NUM_THREADS"] = str(num_threads)
    os.environ["MKL_NUM_THREADS"] = str(num_threads)
    torch.set_num_threads(num_threads)
    
    # Enable memory efficient options
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

if __name__ == "__main__":
    print("Optimizing environment settings...")
    setup_environment()
    
    print("Starting DeepSeek Coder 6.7B setup (optimized for CPU)...")
    model, tokenizer = load_model()
    
    # Test with a coding task
    prompt = """Write a Python function to implement merge sort. Include comments explaining the code."""
    
    print("\nGenerating code...")
    response = generate_text(prompt, model, tokenizer)
    print(f"\nResponse:\n{response}")