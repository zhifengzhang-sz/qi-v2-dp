import json
from pathlib import Path

def inspect_samples(filepath="training_data/samples.json"):
    """Display information about downloaded samples"""
    try:
        with open(filepath) as f:
            samples = json.load(f)
        
        print("\nDataset Information:")
        print("-------------------")
        print(f"Total samples: {len(samples)}")
        
        print("\nFirst sample preview:")
        print("--------------------")
        if samples:
            print(samples[0][:200] + "...\n")
            
        print("Sample Statistics:")
        print("-----------------")
        lengths = [len(s) for s in samples]
        print(f"Average length: {sum(lengths)/len(lengths):.0f} characters")
        print(f"Shortest: {min(lengths)} characters")
        print(f"Longest: {max(lengths)} characters")
        
    except FileNotFoundError:
        print(f"No samples file found at {filepath}")
    except Exception as e:
        print(f"Error reading samples: {str(e)}")

if __name__ == "__main__":
    inspect_samples()