#!/bin/bash
# Quick Connect Aliases and Functions for Mobile Access

# This file should be sourced in your .bashrc or .zshrc
# Add: source ~/claudecodeui/quick-connect-aliases.sh

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Quick connect function with auto-retry
qc() {
    local host="${1:-default}"
    local method="${2:-auto}"
    
    echo -e "${BLUE}Quick connecting to $host...${NC}"
    
    # Auto-detect best method if not specified
    if [ "$method" = "auto" ]; then
        # Check if host is reachable via Tailscale
        if command -v tailscale &> /dev/null && tailscale ping -c 1 "$host" &> /dev/null; then
            method="tailscale"
        elif command -v mosh &> /dev/null; then
            method="mosh"
        else
            method="ssh"
        fi
    fi
    
    case "$method" in
        tailscale|ts)
            echo -e "${GREEN}Using Tailscale SSH...${NC}"
            tailscale ssh "$host"
            ;;
        mosh|m)
            echo -e "${GREEN}Using Mosh...${NC}"
            mosh "$host"
            ;;
        ssh|s)
            echo -e "${GREEN}Using SSH...${NC}"
            ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 "$host"
            ;;
        *)
            echo "Unknown method: $method"
            return 1
            ;;
    esac
}

# Persistent connection with auto-reconnect
pc() {
    local host="${1:-default}"
    local delay=5
    
    echo -e "${BLUE}Starting persistent connection to $host...${NC}"
    echo "Will auto-reconnect on disconnect (Ctrl+C to stop)"
    
    while true; do
        qc "$host"
        echo -e "${YELLOW}Connection lost. Reconnecting in $delay seconds...${NC}"
        sleep $delay
    done
}

# Tailscale-specific quick connect
tsc() {
    local host="${1}"
    if [ -z "$host" ]; then
        echo "Usage: tsc <hostname>"
        tailscale status
        return 1
    fi
    tailscale ssh "$host"
}

# Mosh with custom server binary path (useful for non-standard installs)
moshc() {
    local host="${1}"
    local server_path="${2:-/usr/bin/mosh-server}"
    
    if [ -z "$host" ]; then
        echo "Usage: moshc <hostname> [server-path]"
        return 1
    fi
    
    mosh --server="$server_path" "$host"
}

# SSH with port forwarding preset
sshf() {
    local host="${1}"
    local local_port="${2:-8080}"
    local remote_port="${3:-80}"
    
    if [ -z "$host" ]; then
        echo "Usage: sshf <hostname> [local-port] [remote-port]"
        return 1
    fi
    
    echo -e "${BLUE}SSH to $host with port forward $local_port:localhost:$remote_port${NC}"
    ssh -L "$local_port:localhost:$remote_port" "$host"
}

# SOCKS proxy setup
sshproxy() {
    local host="${1}"
    local proxy_port="${2:-8888}"
    
    if [ -z "$host" ]; then
        echo "Usage: sshproxy <hostname> [proxy-port]"
        return 1
    fi
    
    echo -e "${GREEN}Starting SOCKS proxy on port $proxy_port via $host${NC}"
    echo "Configure your browser to use SOCKS5 proxy: localhost:$proxy_port"
    ssh -D "$proxy_port" -N "$host"
}

# List all available connections
lsc() {
    echo -e "${BLUE}Available quick connections:${NC}"
    echo
    
    # Check Tailscale devices
    if command -v tailscale &> /dev/null && tailscale status &> /dev/null; then
        echo -e "${GREEN}Tailscale devices:${NC}"
        tailscale status | grep -v "^$" | tail -n +2 | awk '{print "  " $2 " (" $1 ")"}'
        echo
    fi
    
    # Check SSH config hosts
    if [ -f ~/.ssh/config ]; then
        echo -e "${GREEN}SSH config hosts:${NC}"
        grep "^Host " ~/.ssh/config | grep -v "*" | awk '{print "  " $2}'
        echo
    fi
    
    # Check mobile-connect hosts
    if [ -d ~/.mobile-connect/hosts ]; then
        echo -e "${GREEN}Mobile-connect hosts:${NC}"
        ls ~/.mobile-connect/hosts | sed 's/^/  /'
        echo
    fi
}

# Test connection quality
testcon() {
    local host="${1}"
    
    if [ -z "$host" ]; then
        echo "Usage: testcon <hostname>"
        return 1
    fi
    
    echo -e "${BLUE}Testing connection to $host...${NC}"
    
    # Ping test
    echo -n "Latency: "
    ping -c 4 "$host" 2>/dev/null | tail -1 | awk -F '/' '{print $5 "ms average"}'
    
    # Bandwidth test (if iperf3 is available)
    if command -v iperf3 &> /dev/null; then
        echo "Run 'iperf3 -s' on the server and 'iperf3 -c $host' here for bandwidth test"
    fi
}

# Session management with tmux
tmc() {
    local host="${1}"
    local session="${2:-mobile}"
    
    if [ -z "$host" ]; then
        echo "Usage: tmc <hostname> [session-name]"
        return 1
    fi
    
    echo -e "${BLUE}Connecting to tmux session '$session' on $host...${NC}"
    ssh -t "$host" "tmux attach-session -t $session || tmux new-session -s $session"
}

# Aliases for common connections
alias qa='qc'                    # Quick connect with auto-detect
alias qm='qc $1 mosh'           # Quick connect with Mosh
alias qs='qc $1 ssh'            # Quick connect with SSH
alias qt='qc $1 tailscale'      # Quick connect with Tailscale
alias pl='pc'                    # Persistent connection with auto-reconnect
alias sshx='ssh -X'             # SSH with X11 forwarding
alias sshy='ssh -Y'             # SSH with trusted X11 forwarding
alias mssh='mosh'               # Mosh shortcut

# Notification on connection drop (macOS/Linux)
notify_disconnect() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'display notification "SSH connection dropped" with title "Connection Lost"'
    elif command -v notify-send &> /dev/null; then
        notify-send "Connection Lost" "SSH connection dropped"
    fi
}

# Advanced: Auto-connect to most recent host
last_connection() {
    if [ -f ~/.mobile-connect/connection.log ]; then
        local last_host=$(grep "Attempting connection to" ~/.mobile-connect/connection.log | tail -1 | awk '{print $5}')
        if [ ! -z "$last_host" ]; then
            echo -e "${BLUE}Reconnecting to last host: $last_host${NC}"
            qc "$last_host"
        else
            echo "No recent connections found"
        fi
    else
        echo "No connection history available"
    fi
}

alias qlast='last_connection'

# Help function
qhelp() {
    cat << EOF
Quick Connect Commands:
  qc [host] [method]     - Quick connect (auto-detect method)
  pc [host]              - Persistent connection (auto-reconnect)
  tsc <host>             - Tailscale SSH connect
  moshc <host>           - Mosh connect with custom server path
  sshf <host> [ports]    - SSH with port forwarding
  sshproxy <host> [port] - Create SOCKS proxy
  lsc                    - List available connections
  testcon <host>         - Test connection quality
  tmc <host> [session]   - Connect to tmux session
  qlast                  - Reconnect to last host

Aliases:
  qa - Quick connect (auto)
  qm - Quick connect (Mosh)
  qs - Quick connect (SSH)
  qt - Quick connect (Tailscale)
  pl - Persistent connection

Tips:
  - Set DEFAULT_HOST in ~/.mobile-connect/config for quick 'qc' without args
  - Use 'pc' for unstable connections - it auto-reconnects
  - Run 'lsc' to see all available hosts
EOF
}

# Show help on source
echo -e "${GREEN}Mobile quick-connect aliases loaded!${NC} Type 'qhelp' for commands."