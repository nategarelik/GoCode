#!/bin/bash

# Install OpenClaudeUI shortcuts

echo "🔧 Installing OpenClaudeUI shortcuts..."

# Create a symbolic link in /usr/local/bin for command line access
if [ -w "/usr/local/bin" ]; then
    sudo ln -sf /home/ngarelik/claudecodeui/start-ui.sh /usr/local/bin/claudeui
    echo "✅ Command line shortcut installed: 'claudeui'"
else
    echo "⚠️  Cannot write to /usr/local/bin. Trying user's bin directory..."
    mkdir -p ~/bin
    ln -sf /home/ngarelik/claudecodeui/start-ui.sh ~/bin/claudeui
    echo "✅ Command line shortcut installed in ~/bin/claudeui"
    echo "   Make sure ~/bin is in your PATH"
fi

# Copy desktop file to applications directory
if [ -d "$HOME/.local/share/applications" ]; then
    cp /home/ngarelik/claudecodeui/OpenClaudeUI.desktop "$HOME/.local/share/applications/"
    echo "✅ Desktop shortcut installed"
fi

# Add alias to bashrc if not already present
if ! grep -q "alias claudeui" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# OpenClaudeUI alias" >> ~/.bashrc
    echo "alias claudeui='cd /home/ngarelik/claudecodeui && ./start-ui.sh'" >> ~/.bashrc
    echo "✅ Bash alias added"
fi

# Add alias to zshrc if zsh is installed and file exists
if [ -f "$HOME/.zshrc" ]; then
    if ! grep -q "alias claudeui" ~/.zshrc; then
        echo "" >> ~/.zshrc
        echo "# OpenClaudeUI alias" >> ~/.zshrc
        echo "alias claudeui='cd /home/ngarelik/claudecodeui && ./start-ui.sh'" >> ~/.zshrc
        echo "✅ Zsh alias added"
    fi
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "You can now start OpenClaudeUI using any of these methods:"
echo "  1. Command line: claudeui"
echo "  2. Desktop: Look for 'OpenClaudeUI' in your applications menu"
echo "  3. Direct: cd /home/ngarelik/claudecodeui && ./start-ui.sh"
echo ""
echo "Note: You may need to restart your terminal or run 'source ~/.bashrc' for the alias to work"