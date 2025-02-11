FROM python:3.11-slim-bookworm

ARG USERNAME=zzhang
ARG USER_UID=1000
ARG USER_GID=1000
ARG COMPOSE_PROJECT_NAME=qi-v2-dp
ARG PYTHON_WORKDIR=/home/${USERNAME}/python
ENV PYTHON_WORKDIR=${PYTHON_WORKDIR}

# Install system packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    git \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create user with sudo access
RUN useradd -l -m -s /bin/bash -u ${USER_UID} ${USERNAME} && \
    echo ${USERNAME} ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/${USERNAME} && \
    chmod 0440 /etc/sudoers.d/${USERNAME}

# Set up workspace and cache directories
RUN mkdir -p /home/${USERNAME}/services/ai/python/.cache/{transformers,huggingface,torch} && \
    chown -R ${USERNAME}:${USERNAME} /home/${USERNAME}

# Environment variables for ML tools
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH="/home/${USERNAME}/services/ai/python" \
    TRANSFORMERS_CACHE="/home/${USERNAME}/services/ai/python/.cache/transformers" \
    HF_HOME="/home/${USERNAME}/services/ai/python/.cache/huggingface" \
    TORCH_HOME="/home/${USERNAME}/services/ai/python/.cache/torch"

# Install Python packages
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

USER ${USERNAME}
WORKDIR ${PYTHON_WORKDIR}

CMD ["sleep", "infinity"]
ENTRYPOINT ["sh", "-c", "exec \"$@\" || sleep infinity", "--"]