## Creating the qi-v2-dp project
References:
 - [Adding locally hosted code to GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github#adding-a-local-repository-to-github-with-github-cli)
 - [Managing remote repositories](https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories)

1. Create a new repository `qi-v2-dp` in github website.
2. Initialize the local directory as a Git repository. By default, the initial branch is called main.
   ```bash
   git init -b main
   ```
3. Add the files in the new local repository. This stages them for the first commit.
   ```bash
   git add .
   ```
4. Commit the files that we've staged in the local repository.
   ```bash
   git commit -m "Initial commit"
   ```
5. Adding a local repository to GitHub using Git
    ```bash
    git remote add origin git@github.com:zhifengzhang-sz/qi-v2-dp.git
    git branch -M main
    git push -u origin main
    ```