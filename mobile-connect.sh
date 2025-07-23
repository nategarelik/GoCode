#!/bin/bash
# Mobile Connection Management Script

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$HOME/.mobile-connect/config"
LOG_FILE="$HOME/.mobile-connect/connection.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create config directory
mkdir -p "$HOME/.mobile-connect"

# Initialize configuration
init_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        cat << 'EOF' > "$CONFIG_FILE"
# Mobile Connect Configuration
DEFAULT_USER=$(whoami)
DEFAULT_METHOD=mosh
MOSH_PORTS="60000:61000"
SSH_OPTIONS="-o ServerAliveInterval=15 -o ServerAliveCountMax=3"
PREFERRED_NETWORK=tailscale
EOF
        echo -e "${GREEN}Created default configuration at $CONFIG_FILE${NC}"
    fi
}

# Load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
    fi
}

# Show usage
usage() {
    cat << EOF
Mobile Connection Manager
Usage: $0 [command] [options]

Commands:
    connect <host>      Connect to a host (auto-selects best method)
    add <name> <host>   Add a new host configuration
    list                List configured hosts
    status              Show connection status
    setup               Run initial setup
    test <host>         Test connectivity to a host

Options:
    -m, --method        Connection method (ssh|mosh|tailscale)
    -u, --user          Username (default: current user)
    -p, --persist       Keep trying to connect on failure
    -v, --verbose       Verbose output

Examples:
    $0 connect myserver
    $0 add work work.example.com -u john
    $0 connect work -m mosh
    $0 test myserver

EOF
}

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Test connectivity
test_connectivity() {
    local host=$1
    echo -e "${BLUE}Testing connectivity to $host...${NC}"
    
    # Test ping
    echo -n "Ping test: "
    if ping -c 1 -W 2 "$host" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi
    
    # Test SSH
    echo -n "SSH test (port 22): "
    if nc -z -w 2 "$host" 22 2>/dev/null; then
        echo -e "${GREEN}✓ Open${NC}"
    else
        echo -e "${RED}✗ Closed${NC}"
    fi
    
    # Test Mosh ports
    echo -n "Mosh test (UDP 60000-61000): "
    if nc -u -z -w 2 "$host" 60000 2>/dev/null; then
        echo -e "${GREEN}✓ Likely available${NC}"
    else
        echo -e "${YELLOW}? Cannot verify UDP${NC}"
    fi
    
    # Test Tailscale
    echo -n "Tailscale test: "
    if command -v tailscale &> /dev/null && tailscale ping "$host" &> /dev/null; then
        echo -e "${GREEN}✓ Connected${NC}"
        tailscale ping -c 1 "$host" 2>/dev/null | grep "pong from"
    else
        echo -e "${YELLOW}✗ Not available${NC}"
    fi
}

# Add host configuration
add_host() {
    local name=$1
    local host=$2
    shift 2
    
    local user="$DEFAULT_USER"
    local method="$DEFAULT_METHOD"
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--user)
                user="$2"
                shift 2
                ;;
            -m|--method)
                method="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Save host configuration
    mkdir -p "$HOME/.mobile-connect/hosts"
    cat << EOF > "$HOME/.mobile-connect/hosts/$name"
HOST=$host
USER=$user
METHOD=$method
EOF
    
    echo -e "${GREEN}Added host configuration for '$name'${NC}"
    echo "  Host: $host"
    echo "  User: $user"
    echo "  Method: $method"
}

# List configured hosts
list_hosts() {
    echo -e "${BLUE}Configured Hosts:${NC}"
    echo
    
    if [ -d "$HOME/.mobile-connect/hosts" ]; then
        for host_file in "$HOME/.mobile-connect/hosts"/*; do
            if [ -f "$host_file" ]; then
                local name=$(basename "$host_file")
                source "$host_file"
                printf "%-15s %-30s %-15s %s\n" "$name" "$HOST" "$USER" "$METHOD"
            fi
        done
    else
        echo "No hosts configured. Use '$0 add' to add hosts."
    fi
}

# Smart connect function
connect_host() {
    local target=$1
    shift
    
    local host=""
    local user="$DEFAULT_USER"
    local method="$DEFAULT_METHOD"
    local persist=false
    
    # Check if target is a configured host
    if [ -f "$HOME/.mobile-connect/hosts/$target" ]; then
        source "$HOME/.mobile-connect/hosts/$target"
        host="$HOST"
        user="$USER"
        method="$METHOD"
    else
        host="$target"
    fi
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--method)
                method="$2"
                shift 2
                ;;
            -u|--user)
                user="$2"
                shift 2
                ;;
            -p|--persist)
                persist=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${BLUE}Connecting to $host as $user using $method...${NC}"
    log "Attempting connection to $host as $user using $method"
    
    # Connection loop
    local attempts=0
    while true; do
        attempts=$((attempts + 1))
        
        case $method in
            mosh)
                echo -e "${GREEN}Starting Mosh connection...${NC}"
                if mosh "$user@$host"; then
                    log "Mosh connection to $host successful"
                    break
                else
                    log "Mosh connection to $host failed"
                    if [ "$persist" = false ]; then
                        break
                    fi
                fi
                ;;
                
            ssh)
                echo -e "${GREEN}Starting SSH connection...${NC}"
                if ssh $SSH_OPTIONS "$user@$host"; then
                    log "SSH connection to $host successful"
                    break
                else
                    log "SSH connection to $host failed"
                    if [ "$persist" = false ]; then
                        break
                    fi
                fi
                ;;
                
            tailscale)
                echo -e "${GREEN}Starting Tailscale SSH connection...${NC}"
                if tailscale ssh "$user@$host"; then
                    log "Tailscale SSH connection to $host successful"
                    break
                else
                    log "Tailscale SSH connection to $host failed"
                    if [ "$persist" = false ]; then
                        break
                    fi
                fi
                ;;
                
            auto)
                echo -e "${YELLOW}Auto-detecting best connection method...${NC}"
                
                # Try Tailscale first if available
                if command -v tailscale &> /dev/null && tailscale ping "$host" &> /dev/null; then
                    method="tailscale"
                    continue
                fi
                
                # Try Mosh
                if command -v mosh &> /dev/null && nc -z -w 2 "$host" 22 2>/dev/null; then
                    method="mosh"
                    continue
                fi
                
                # Fall back to SSH
                method="ssh"
                continue
                ;;
                
            *)
                echo -e "${RED}Unknown method: $method${NC}"
                exit 1
                ;;
        esac
        
        if [ "$persist" = true ]; then
            echo -e "${YELLOW}Connection failed. Retrying in 5 seconds... (attempt $attempts)${NC}"
            sleep 5
        else
            break
        fi
    done
}

# Show connection status
show_status() {
    echo -e "${BLUE}Connection Status:${NC}"
    echo
    
    # Check Tailscale
    echo -n "Tailscale: "
    if command -v tailscale &> /dev/null; then
        if tailscale status &> /dev/null; then
            echo -e "${GREEN}Connected${NC}"
            echo "  IP: $(tailscale ip -4 2>/dev/null || echo 'N/A')"
        else
            echo -e "${RED}Not connected${NC}"
        fi
    else
        echo -e "${YELLOW}Not installed${NC}"
    fi
    
    # Check active SSH connections
    echo
    echo "Active SSH connections:"
    who | grep -E "pts/|ttys" | awk '{print "  " $1 " from " $5}'
    
    # Recent connections
    echo
    echo "Recent connections:"
    tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/  /'
}

# Initial setup
run_setup() {
    echo -e "${BLUE}Running Mobile Connect Setup...${NC}"
    echo
    
    # Check for required tools
    echo "Checking required tools..."
    
    tools=("ssh" "mosh" "tailscale" "nc")
    for tool in "${tools[@]}"; do
        echo -n "  $tool: "
        if command -v "$tool" &> /dev/null; then
            echo -e "${GREEN}✓ Installed${NC}"
        else
            echo -e "${YELLOW}✗ Not installed${NC}"
        fi
    done
    
    echo
    echo "Setup complete! You can now:"
    echo "  1. Add hosts: $0 add <name> <hostname>"
    echo "  2. Connect: $0 connect <name>"
}

# Auto-reconnect daemon
start_daemon() {
    local host=$1
    local pid_file="$HOME/.mobile-connect/daemon-$host.pid"
    
    # Check if already running
    if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
        echo -e "${YELLOW}Auto-reconnect daemon already running for $host${NC}"
        return
    fi
    
    echo -e "${GREEN}Starting auto-reconnect daemon for $host...${NC}"
    
    # Start daemon in background
    (
        while true; do
            connect_host "$host" -p
            sleep 10
        done
    ) &
    
    echo $! > "$pid_file"
    echo -e "${GREEN}Daemon started with PID $(cat "$pid_file")${NC}"
}

# Main execution
init_config
load_config

case "${1:-help}" in
    connect)
        shift
        connect_host "$@"
        ;;
    add)
        shift
        add_host "$@"
        ;;
    list)
        list_hosts
        ;;
    status)
        show_status
        ;;
    test)
        shift
        test_connectivity "$@"
        ;;
    setup)
        run_setup
        ;;
    daemon)
        shift
        start_daemon "$@"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac