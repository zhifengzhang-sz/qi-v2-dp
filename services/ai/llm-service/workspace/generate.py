def get_generator():
    """Initialize the text generation pipeline"""
    return pipeline(
        "text-generation",
        model=os.getenv("MODEL_ID"),
        device_map="auto"
    )


def generate_code(prompt: str):
    """Generate code from a prompt"""
    generator = get_generator()

    response = generator(
        prompt,
        max_length=int(os.getenv("MAX_LENGTH", 2048)),
        temperature=float(os.getenv("TEMPERATURE", 0.7)),
        top_p=float(os.getenv("TOP_P", 0.95)),
        do_sample=True
    )

    return response[0]['generated_text']


if __name__ == "__main__":
    # Example usage
    prompt = "Write a Python function to sort a list"
    print(f"Prompt: {prompt}\n")
    print(generate_code(prompt))