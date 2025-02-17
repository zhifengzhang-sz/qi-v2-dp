from huggingface_hub import snapshot_download, logging
import os
import sys
from tqdm.auto import tqdm
import time
import socket

# Set up logging
logging.set_verbosity_info()


def wait_for_network():
    """Wait for network connectivity."""
    print("Checking network connectivity...")
    while True:
        try:
            # Try multiple DNS servers
            for dns in ['8.8.8.8', '1.1.1.1']:
                try:
                    socket.create_connection((dns, 53), timeout=3)
                    print(f"Network connectivity established via {dns}")
                    return True
                except OSError:
                    continue
            print("No network connectivity. Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            return False


def download_model(model_id="codellama/CodeLlama-7b-instruct-hf", cache_dir="cache"):
    """Download model with improved network resilience."""
    try:
        print(f"Resuming download of {model_id}")

        if not wait_for_network():
            return False

        # Download with improved settings
        snapshot_download(
            repo_id=model_id,
            local_dir=cache_dir,
            max_workers=1,
            resume_download=True,
            tqdm_class=tqdm,
            token=os.getenv('HF_TOKEN')  # In case authentication helps
        )

        print(f"\nModel successfully downloaded to {cache_dir}")
        return True

    except Exception as e:
        print(f"\nError downloading model: {str(e)}", file=sys.stderr)
        raise


if __name__ == "__main__":
    max_attempts = 3
    current_attempt = 0

    while current_attempt < max_attempts:
        try:
            current_attempt += 1
            print(f"\nAttempt {current_attempt} of {max_attempts}")

            if download_model():
                print("Download completed successfully!")
                break

        except KeyboardInterrupt:
            print("\nDownload interrupted by user")
            sys.exit(1)
        except Exception as e:
            print(f"Download failed: {str(e)}")
            if current_attempt < max_attempts:
                print(f"Waiting 30 seconds before next attempt...")
                time.sleep(30)
            else:
                print(
                    "Maximum attempts reached. Please check your network connection and try again later.")
                sys.exit(1)
