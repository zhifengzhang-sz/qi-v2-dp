# The Data Platform

## Setting up the development environment

### Prerequisites

1. [Docker](https://docs.docker.com/get-docker/)
2. [node.js](https://nodejs.org/en/), required version 22
3. [nvm](https://github.com/nvm-sh/nvm) (optional, but highly recommended)
4. [vscode](https://code.visualstudio.com/)
5. To view documents within vscode, we require vscode extension `shd101wyy.markdown-preview-enhanced` installed
6. [git](https://git-scm.com/)
7. [zsh](docs/vscode/zsh.md)

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/zhifengzhang-sz/qi-v2-dp.git
   cd qi-v2-dp
   ```
2. Configure the environment variables for devcontainer and services:
   ```bash
   npm run config
   ```
3. Bring up the services:
   ```bash
   cd services
   docker-compose up
   ```

### Working on the project

1. Open the project in vscode: in the root project directory, run:
   ```bash
   code .
   ```
2. Using devcontainer
   In vscode, to open the devcontainer, press `F1` and type `Dev Containers: Rebuild and Reopen in Container...`.

