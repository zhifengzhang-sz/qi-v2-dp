import socket
import requests

def check_connectivity():
    """Check connectivity to required services"""
    services = [
        ('huggingface.co', 443),
        ('cdn-lfs.huggingface.co', 443)
    ]
    
    print("Checking connectivity...")
    for host, port in services:
        try:
            # Try DNS resolution
            ip = socket.gethostbyname(host)
            print(f"✓ DNS resolution successful for {host} ({ip})")
            
            # Try HTTPS connection
            response = requests.get(f"https://{host}", timeout=5)
            print(f"✓ HTTPS connection successful to {host}")
        except socket.gaierror:
            print(f"✗ Failed to resolve {host}")
        except requests.exceptions.RequestException as e:
            print(f"✗ Failed to connect to {host}: {e}")

if __name__ == "__main__":
    check_connectivity()