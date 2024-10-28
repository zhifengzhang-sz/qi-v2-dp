fpath+=($HOME/.zsh/pure)
autoload -U promptinit; promptinit
prompt pure
export PATH=$PWD/bin:$PATH
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="eastwood"

plugins=(git)

source $ZSH/oh-my-zsh.sh
