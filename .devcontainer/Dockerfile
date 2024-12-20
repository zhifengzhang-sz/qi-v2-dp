FROM node:22-bookworm
RUN npm install -g npm@10.8.3

##############################################################################################################
# Install prerequisites
RUN apt-get update
RUN apt-get install -y \
    lsb-release \
    curl \
    locales \
    zsh

##############################################################################################################
# setting up user
ARG USERNAME=user-name-goes-here
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN userdel node \
    &&groupadd -f --gid $USER_GID $USERNAME \
    &&useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apt-get update \
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

RUN apt-get update && apt-get install -y openssh-server rsync zip clang-format

RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config && \
    echo 'PermitEmptyPasswords yes' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    ssh-keygen -A

EXPOSE 22 

##############################################################################################################
# setting up local
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
RUN locale-gen
RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get autoclean \
    && apt-get autoremove -y

USER $USERNAME

# install and setting up oh-my-zsh
RUN curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh | zsh || true
RUN mkdir -p "$HOME/.zsh" \
    && git clone https://github.com/sindresorhus/pure.git "$HOME/.zsh/pure"
ADD ./.zshrc /home/$USERNAME
ENV LANG="C.UTF-8"
CMD ["/usr/sbin/sshd", "-D"]
