FROM node:22-bookworm
RUN npm install -g npm@10.8.3

# Install prerequisites
RUN apt-get update && \
    apt-get install -y \
    lsb-release \
    curl \
    git \
    sudo \
    openssh-server \
    rsync \
    zip \
    clang-format \
    && rm -rf /var/lib/apt/lists/*

# SSH configuration
RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config && \
    echo 'PermitEmptyPasswords yes' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    ssh-keygen -A

# Create the required directory for sshd
RUN mkdir -p /var/run/sshd

EXPOSE 22

# Setting up user
ARG USERNAME=zzhang
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG QI_WORKDIR=/home/${USERNAME}/qi
ENV QI_WORKDIR=${QI_WORKDIR}

# Create the user
RUN userdel node \
    && groupadd -f --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m -s /bin/bash $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

USER root

# Add entrypoint script
RUN echo '#!/bin/sh\n\
/usr/sbin/sshd\n\
exec "$@"' > /usr/local/bin/docker-entrypoint.sh && \
chmod +x /usr/local/bin/docker-entrypoint.sh

USER $USERNAME
WORKDIR ${QI_WORKDIR}

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["sleep", "infinity"]
