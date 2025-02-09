FROM python:3.11-slim-bookworm

ARG TARGETARCH
RUN echo "Building for architecture: $TARGETARCH"

ARG USERNAME=zzhang
ARG USER_UID=1000
ARG USER_GID=1000

# System dependencies - install sudo first
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      sudo \
      git \
      curl \
      gcc \
      g++ \
      make \
      procps \
      zsh \
      locales && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /etc/sudoers.d && \
    mkdir -p /cache/transformers /cache/huggingface && \
    locale-gen && \
    echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
    locale-gen

# User setup
RUN groupadd --gid $USER_GID $USERNAME && \
    useradd --uid $USER_UID --gid $USER_GID -m -s /bin/zsh $USERNAME && \
    echo "$USERNAME ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME && \
    chmod 0440 /etc/sudoers.d/$USERNAME

# Cache directories
RUN chown -R $USERNAME:$USERNAME /cache

# Install oh-my-zsh and plugins
RUN mkdir -p "/home/$USERNAME/.zsh" && \
    git clone https://github.com/sindresorhus/pure.git "/home/$USERNAME/.zsh/pure" && \
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git "/home/$USERNAME/.zsh/zsh-syntax-highlighting" && \
    git clone https://github.com/zsh-users/zsh-autosuggestions "/home/$USERNAME/.zsh/zsh-autosuggestions" && \
    chown -R $USERNAME:$USERNAME "/home/$USERNAME/.zsh"

# Python setup
WORKDIR /home/${USERNAME}
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Ensure the workspace is owned by the user
RUN chown -R $USERNAME:$USERNAME /home/${USERNAME}

USER $USERNAME

# Install oh-my-zsh after switching to user
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

RUN if [ "$TARGETARCH" = "arm64" ]; then \
    echo "Installing ARM-specific dependencies"; \
    fi

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import torch; print(torch.__version__)" || exit 1