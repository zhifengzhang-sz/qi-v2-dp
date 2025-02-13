from pathlib import Path
import shutil
import os

def cleanup_huggingface_cache():
    """Clean up Hugging Face cache directories"""
    # Default cache locations
    cache_dirs = [
        Path.home() / '.cache/huggingface/datasets',
        Path.home() / '.cache/huggingface/hub'
    ]
    
    for cache_dir in cache_dirs:
        if cache_dir.exists():
            print(f"Removing cache directory: {cache_dir}")
            shutil.rmtree(cache_dir)
            print(f"Cleaned up {cache_dir}")
        else:
            print(f"Cache directory not found: {cache_dir}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Clean up Hugging Face cache')
    parser.add_argument('--force', action='store_true', help='Clean without confirmation')
    args = parser.parse_args()
    
    if not args.force:
        response = input("This will delete all cached datasets. Continue? [y/N] ")
        if response.lower() != 'y':
            print("Cleanup cancelled")
            exit(0)
    
    cleanup_huggingface_cache()