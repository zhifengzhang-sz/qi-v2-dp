from huggingface_hub import snapshot_download
from tqdm.auto import tqdm
import os


def download_model():
    print("Starting model download...")
    snapshot_download(
        "codellama/CodeLlama-7b-instruct-hf",
        local_dir="/data",
        cache_dir="/data",
        max_workers=1,
        force_download=True,
        tqdm_class=tqdm
    )
    print("Download completed")


if __name__ == "__main__":
    download_model()
