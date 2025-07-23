#!/bin/bash
# Tailscale Installation and Configuration Script

set -e

echo "=== Tailscale Setup Script ==="
echo "This script will install and configure Tailscale for secure networking"
echo

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

# Install Tailscale
install_tailscale() {
    echo "Installing Tailscale..."
    
    if [[ "$OS" == "linux" ]]; then
        # Add Tailscale's package signing key and repository
        curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/focal.gpg | sudo apt-key add -
        curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/focal.list | sudo tee /etc/apt/sources.list.d/tailscale.list
        
        sudo apt-get update
        sudo apt-get install -y tailscale
    elif [[ "$OS" == "macos" ]]; then
        # Install via Homebrew
        if ! command -v brew &> /dev/null; then
            echo "Homebrew not found. Please install Homebrew first."
            exit 1
        fi
        brew install tailscale
    fi
}

# Configure Tailscale
configure_tailscale() {
    echo "Configuring Tailscale..."
    
    # Start Tailscale
    if [[ "$OS" == "linux" ]]; then
        sudo systemctl enable --now tailscaled
    fi
    
    # Authenticate
    echo "Starting Tailscale authentication..."
    echo "You will be prompted to authenticate via your browser."
    sudo tailscale up --ssh
    
    echo "Tailscale is now configured with SSH enabled!"
}

# Set up access controls
setup_acls() {
    echo
    echo "=== Tailscale ACL Configuration ==="
    echo "To configure access controls, visit: https://login.tailscale.com/admin/acls"
    echo
    echo "Recommended ACL configuration for mobile access:"
    cat << 'EOF' > tailscale-acl.json
{
  "acls": [
    {
      "action": "accept",
      "users": ["*"],
      "ports": ["*:22", "*:60000-60100"]
    }
  ],
  "ssh": [
    {
      "action": "accept",
      "users": ["*"],
      "dst": ["*"]
    }
  ],
  "nodeAttrs": [
    {
      "target": ["*"],
      "attr": ["funnel"]
    }
  ]
}
EOF
    
    echo "Sample ACL configuration saved to tailscale-acl.json"
    echo "Upload this to your Tailscale admin panel to apply."
}

# Main execution
main() {
    install_tailscale
    configure_tailscale
    setup_acls
    
    echo
    echo "=== Tailscale Setup Complete ==="
    echo "Your Tailscale IP: $(tailscale ip -4)"
    echo "Device name: $(tailscale status --json | jq -r '.Self.DNSName' | cut -d'.' -f1)"
    echo
    echo "Next steps:"
    echo "1. Install Tailscale on your iOS device from the App Store"
    echo "2. Sign in with the same account"
    echo "3. Your devices will automatically connect!"
}

main