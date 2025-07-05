## Mirror setting

### Quick commands

1. Switch to global GitHub
    ```bash
    git config --global --unset url.https://github.com.cnpmjs.org/.insteadOf
    ```
2. Add the submodule
    ```bash
    git submodule add https://github.com/theavicaster/crypto-streaming dp/studies/crypto-streaming
    ```

3. Switch back to cnpmjs
    ```bash
    git config --global url.https://github.com.cnpmjs.org/.insteadOf https://github.com/
    ```

## Sumodules

1. Download the submodule (first time in the project)
    ```bash
    git submodule add https://github.com/theavicaster/crypto-streaming dp/studies/crypto-streaming 
    ```

2. Commit the submodule addition:
    ```bash
    git commit -m "Add crypto-streaming submodule for architecture study"
    ```

3. For others to use it, they need to:
    ```bash
    # Clone with submodules
    git clone --recurse-submodules <repo-url>
    
    # Or if already cloned
    git submodule update --init --recursive
    ```

4. To update the submodule later:
    ```bash
    cd dp/studies/crypto-streaming
    git pull origin main
    cd ../../..
    git add dp/studies/crypto-streaming
    git commit -m "Update crypto-streaming submodule"
    ```

The `.gitmodules` file should now contain the submodule reference that others can use.
