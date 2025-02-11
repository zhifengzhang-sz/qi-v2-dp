Here's a step-by-step approach to test the new devcontainer setup before fully rebuilding:

1. First, let's create a test branch and temporary test directory:

```bash
# Create and switch to test branch
git checkout -b test-devcontainer

# Create a temporary test directory
mkdir devcontainer-test
cd devcontainer-test
```

2. Create a minimal test structure to verify the configuration:



3. Copy your updated configuration files to test directory:

```bash
# Copy devcontainer configs
cp path/to/your/updated/.devcontainer/devcontainer.json .devcontainer/
cp path/to/your/updated/python/Dockerfile python/
cp path/to/your/updated/qi/Dockerfile qi/
```

4. Test the configuration:

```bash
# Initialize test environment
make test-setup

# Build and start containers
docker compose build
docker compose up -d

# Test Python container
make test-python

# Test JavaScript container
make test-js

# Test shell configuration in Python container
docker compose exec coder zsh -c 'echo $ZSH && ls -la ~/.oh-my-zsh'

# Test shell configuration in JS container
docker compose exec dp_js zsh -c 'echo $ZSH && ls -la ~/.oh-my-zsh'

# Test VS Code remote connection
code --folder-uri vscode-remote://attached-container+$(pwd)/python
```

5. Verification checklist:

```bash
# Python container checks
docker compose exec coder /bin/bash -c '
echo "1. Checking Python installation..."
python --version

echo "2. Checking Zsh installation..."
which zsh

echo "3. Checking Oh My Zsh installation..."
test -d ~/.oh-my-zsh && echo "Oh My Zsh installed" || echo "Oh My Zsh missing"

echo "4. Checking Zsh plugins..."
test -d ~/.zsh/pure && \
test -d ~/.zsh/zsh-syntax-highlighting && \
test -d ~/.zsh/zsh-autosuggestions && \
echo "All plugins installed" || echo "Some plugins missing"

echo "5. Checking user permissions..."
sudo echo "Sudo works" || echo "Sudo failed"
'

# JavaScript container checks
docker compose exec dp_js /bin/bash -c '
echo "1. Checking Node installation..."
node --version

echo "2. Checking npm installation..."
npm --version

echo "3. Checking Zsh installation..."
which zsh

echo "4. Checking Oh My Zsh installation..."
test -d ~/.oh-my-zsh && echo "Oh My Zsh installed" || echo "Oh My Zsh missing"

echo "5. Checking Zsh plugins..."
test -d ~/.zsh/pure && \
test -d ~/.zsh/zsh-syntax-highlighting && \
test -d ~/.zsh/zsh-autosuggestions && \
echo "All plugins installed" || echo "Some plugins missing"

echo "6. Checking SSH configuration..."
sudo service ssh status
'
```

6. Clean up after testing:

```bash
# Stop and remove containers
docker compose down

# Remove test directory if everything works
cd ..
rm -rf devcontainer-test

# If everything works, commit changes
git add .
git commit -m "Update devcontainer configuration"
```

If you encounter any issues during testing:

1. Check logs:
```bash
docker compose logs coder
docker compose logs dp_js
```

2. Debug shell configuration:
```bash
# Check shell configuration
docker compose exec coder cat /etc/passwd
docker compose exec dp_js cat /etc/passwd

# Check Zsh configuration
docker compose exec coder cat ~/.zshrc
docker compose exec dp_js cat ~/.zshrc
```

3. Debug VS Code configuration:
```bash
# Check VS Code server logs
docker compose exec coder cat ~/.vscode-server/data/logs/20240210T000000/remoteagent.log
```

Only after all tests pass successfully should you proceed with rebuilding your main containers:

```bash
# If all tests pass, rebuild main containers
cd /path/to/main/project
docker compose down
docker compose build --no-cache
docker compose up -d
```

This testing approach allows you to verify the configuration changes in isolation before applying them to your main development environment. Would you like me to explain any part of the testing process in more detail?