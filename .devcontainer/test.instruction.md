# Testing Instructions for Devcontainer Setup

## 1. Create Test Environment

First, create a test directory structure that mirrors your devcontainer setup:

```bash
# Create test directory structure
mkdir -p devcontainer-test/{python,qi}
cd devcontainer-test

# Create symbolic links to original configuration files
ln -s ../.devcontainer/docker-compose.yml .
ln -s ../.devcontainer/Makefile .

# Link Python configuration files
ln -s ../.devcontainer/python/Dockerfile python/
ln -s ../.devcontainer/python/requirements.txt python/
ln -s ../.devcontainer/python/devcontainer.json python/

# Link JavaScript configuration files
ln -s ../.devcontainer/qi/Dockerfile qi/
ln -s ../.devcontainer/qi/devcontainer.json qi/

# Create test files
echo 'print("Python environment test")' > python/test.py
echo 'console.log("JavaScript environment test");' > qi/test.js
```

## 2. Initialize Test Environment

```bash
# Generate .env file using the Makefile
make setup
```

## 3. Test Container Builds

```bash
# Build the containers
docker compose build --no-cache

# Start the containers
docker compose up -d
```

## 4. Verify Container Configuration

### Test Python Container
```bash
# Check Python environment
docker compose exec coder bash -c '
echo "=== Python Container Tests ==="
echo "1. Python Version:"
python --version
echo "\n2. Zsh Installation:"
which zsh
echo "\n3. Oh My Zsh Installation:"
ls -la ~/.oh-my-zsh || echo "Oh My Zsh not installed"
echo "\n4. Zsh Plugins:"
ls -la ~/.zsh || echo "Zsh plugins not installed"
echo "\n5. User and Permissions:"
whoami && id
echo "\n6. Sudo Access:"
sudo echo "Sudo works" || echo "Sudo failed"
echo "\n7. Test Python Script:"
python python/test.py
'
```

### Test JavaScript Container
```bash
# Check JavaScript environment
docker compose exec dp_js bash -c '
echo "=== JavaScript Container Tests ==="
echo "1. Node Version:"
node --version
echo "\n2. NPM Version:"
npm --version
echo "\n3. Zsh Installation:"
which zsh
echo "\n4. Oh My Zsh Installation:"
ls -la ~/.oh-my-zsh || echo "Oh My Zsh not installed"
echo "\n5. Zsh Plugins:"
ls -la ~/.zsh || echo "Zsh plugins not installed"
echo "\n6. SSH Status:"
sudo service ssh status
echo "\n7. Test JavaScript Script:"
node qi/test.js
'
```

## 5. Test VS Code Integration

1. Open VS Code
2. Install the "Remote Development" extension pack if not already installed
3. Click the "Remote Explorer" icon in the sidebar
4. You should see your containers listed
5. Try connecting to both containers:
   ```bash
   # For Python container
   code --folder-uri vscode-remote://attached-container+$(pwd)/python
   
   # For JavaScript container
   code --folder-uri vscode-remote://attached-container+$(pwd)/qi
   ```

## 6. Debug Common Issues

If you encounter problems:

```bash
# Check container logs
docker compose logs coder
docker compose logs dp_js

# Check shell configuration
docker compose exec coder cat /etc/passwd
docker compose exec dp_js cat /etc/passwd

# Verify symbolic links
ls -la
ls -la python/
ls -la qi/

# Check devcontainer feature installation logs
docker compose exec coder cat ~/.vscode-server/data/Machine/features/log.txt
docker compose exec dp_js cat ~/.vscode-server/data/Machine/features/log.txt
```

## 7. Clean Up

After testing:

```bash
# Stop containers
docker compose down

# Remove test files (but keep symbolic links for reference)
rm python/test.py qi/test.js

# If everything works, you can remove the test directory
cd ..
rm -rf devcontainer-test
```