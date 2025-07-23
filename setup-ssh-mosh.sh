#!/bin/bash
# SSH + Mosh Configuration Script for Mobile Access

set -e

echo "=== SSH + Mosh Setup Script ==="
echo "Optimizing SSH and installing Mosh for persistent mobile connections"
echo

# Install Mosh
install_mosh() {
    echo "Installing Mosh..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y mosh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install mosh
        else
            echo "Please install Homebrew first"
            exit 1
        fi
    fi
    
    echo "Mosh installed successfully!"
}

# Configure SSH for mobile optimization
configure_ssh() {
    echo "Configuring SSH for mobile access..."
    
    # Backup existing config
    if [ -f /etc/ssh/sshd_config ]; then
        sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    fi
    
    # Create optimized SSH config
    cat << 'EOF' | sudo tee /etc/ssh/sshd_config.d/mobile-optimized.conf
# Mobile-optimized SSH configuration
# Allows both password and key authentication for flexibility
PasswordAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Connection persistence settings
ClientAliveInterval 15
ClientAliveCountMax 4
TCPKeepAlive yes

# Security settings
PermitRootLogin no
MaxAuthTries 3
MaxSessions 10

# Performance optimizations
UseDNS no
Compression yes

# Allow Mosh connections
# Mosh uses UDP ports 60000-61000
EOF

    # Restart SSH service
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo systemctl restart sshd || sudo systemctl restart ssh
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        sudo launchctl stop com.openssh.sshd
        sudo launchctl start com.openssh.sshd
    fi
    
    echo "SSH configured for mobile access!"
}

# Set up SSH keys
setup_ssh_keys() {
    echo "Setting up SSH key authentication..."
    
    # Create SSH directory if it doesn't exist
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # Generate key if it doesn't exist
    if [ ! -f ~/.ssh/id_ed25519 ]; then
        echo "Generating new SSH key..."
        ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "mobile-access@$(hostname)"
    fi
    
    # Create authorized_keys file
    touch ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    
    echo
    echo "=== SSH Key Information ==="
    echo "Your SSH public key (add this to iOS clients):"
    echo
    cat ~/.ssh/id_ed25519.pub
    echo
    echo "Save this key to add to your iOS SSH clients!"
}

# Configure firewall for Mosh
configure_firewall() {
    echo "Configuring firewall for Mosh..."
    
    if command -v ufw &> /dev/null; then
        # UFW (Ubuntu/Debian)
        sudo ufw allow 22/tcp comment "SSH"
        sudo ufw allow 60000:61000/udp comment "Mosh"
        echo "UFW rules added for SSH and Mosh"
    elif command -v firewall-cmd &> /dev/null; then
        # firewalld (RHEL/CentOS/Fedora)
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-port=60000-61000/udp
        sudo firewall-cmd --reload
        echo "Firewalld rules added for SSH and Mosh"
    else
        echo "No supported firewall found. Please manually allow:"
        echo "  - TCP port 22 (SSH)"
        echo "  - UDP ports 60000-61000 (Mosh)"
    fi
}

# Create client configuration
create_client_config() {
    echo "Creating client configuration..."
    
    mkdir -p ~/mobile-access
    
    # Get system information
    HOSTNAME=$(hostname)
    IP_ADDR=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)
    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "Not configured")
    
    cat << EOF > ~/mobile-access/connection-info.txt
=== Server Connection Information ===

Hostname: $HOSTNAME
Local IP: $IP_ADDR
Tailscale IP: $TAILSCALE_IP

SSH Port: 22
Mosh Ports: 60000-61000 (UDP)

Username: $(whoami)

=== Connection Methods ===

1. Direct SSH:
   ssh $(whoami)@$IP_ADDR

2. Mosh (recommended for mobile):
   mosh $(whoami)@$IP_ADDR

3. Via Tailscale:
   ssh $(whoami)@$HOSTNAME
   mosh $(whoami)@$HOSTNAME

EOF
    
    echo "Connection information saved to ~/mobile-access/connection-info.txt"
}

# Main execution
main() {
    install_mosh
    configure_ssh
    setup_ssh_keys
    configure_firewall
    create_client_config
    
    echo
    echo "=== SSH + Mosh Setup Complete ==="
    echo "Mosh is now installed and configured for mobile access!"
    echo "Check ~/mobile-access/connection-info.txt for connection details"
}

main