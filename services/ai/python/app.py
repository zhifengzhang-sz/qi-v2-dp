from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def load_model():
    model_id = "deepseek-ai/deepseek-coder-6.7b-base"
    
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    
    print("Loading model (this will take a while on CPU)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        device_map="cpu",
        torch_dtype=torch.float32,
        low_cpu_mem_usage=True
    )
    
    return model, tokenizer

def generate_text(prompt, model, tokenizer, max_length=500):
    inputs = tokenizer(prompt, return_tensors="pt")
    
    outputs = model.generate(
        **inputs,
        max_length=max_length,
        num_return_sequences=1,
        temperature=0.7,
        do_sample=True,
        top_p=0.95,
        pad_token_id=tokenizer.eos_token_id
    )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

if __name__ == "__main__":
    print("Starting DeepSeek Coder 6.7B setup...")
    model, tokenizer = load_model()
    
    # Test with a coding task
    prompt = """Write a Python function to implement merge sort. Include comments explaining the code."""
    
    print("\nGenerating code...")
    response = generate_text(prompt, model, tokenizer)
    print(f"\nResponse:\n{response}")