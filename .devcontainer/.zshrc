fpath+=($HOME/.zsh/pure)
autoload -U promptinit
promptinit
prompt pure

# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load
ZSH_THEME=""

# Plugins
plugins=(git docker docker-compose)

if [ -f "$ZSH/oh-my-zsh.sh" ]; then
	source "$ZSH/oh-my-zsh.sh"
else
	echo "oh-my-zsh not found, skipping..."
fi

source "$HOME/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
source "$HOME/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh"

# User configuration
export LANG=en_US.UTF-8
