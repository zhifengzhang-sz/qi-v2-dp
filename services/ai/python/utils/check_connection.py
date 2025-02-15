# check_connection.py
import socket
import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_connectivity():
    """Check connectivity to required Hugging Face services"""
    services = [
        ("huggingface.co", 443),
        ("cdn-lfs.huggingface.co", 443),
        ("s3.amazonaws.com", 443),  # HF also uses AWS for some storage
    ]

    logger.info("Checking connectivity to Hugging Face services...")
    all_successful = True

    for host, port in services:
        try:
            # Try DNS resolution
            ip = socket.gethostbyname(host)
            logger.info(f"✓ DNS resolution successful for {host} ({ip})")

            # Try HTTPS connection
            response = requests.get(f"https://{host}", timeout=10)
            response.raise_for_status()
            logger.info(f"✓ HTTPS connection successful to {host}")

        except socket.gaierror:
            logger.error(f"✗ Failed to resolve {host}")
            all_successful = False
        except requests.exceptions.RequestException as e:
            logger.error(f"✗ Failed to connect to {host}: {e}")
            all_successful = False

    # Test dataset API access
    try:
        logger.info("Testing Hugging Face Hub dataset API access...")
        response = requests.get(
            "https://huggingface.co/api/datasets/codeparrot/github-code", timeout=10
        )
        response.raise_for_status()
        logger.info("✓ Successfully accessed Hugging Face Hub API")
    except requests.exceptions.RequestException as e:
        logger.error(f"✗ Failed to access Hugging Face Hub API: {e}")
        all_successful = False

    if all_successful:
        logger.info("\nAll connectivity checks passed!")
    else:
        logger.error(
            "\nSome connectivity checks failed. Please check your network connection and try again."
        )
        logger.info("\nTroubleshooting tips:")
        logger.info(
            "1. Check if you're behind a proxy or VPN that might block connections"
        )
        logger.info("2. Verify that your DNS resolution is working properly")
        logger.info("3. Check if you have sufficient network bandwidth")
        logger.info(
            "4. Try increasing the timeout values if you have a slow connection"
        )


if __name__ == "__main__":
    check_connectivity()
