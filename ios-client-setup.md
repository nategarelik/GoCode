# iOS Client Setup Guide

This guide covers setting up Blink Shell and Termius for optimal remote access to your server.

## Prerequisites

1. Tailscale installed on your server (run `setup-tailscale.sh`)
2. SSH + Mosh configured (run `setup-ssh-mosh.sh`)
3. Your server's connection information

## Option 1: Blink Shell (Recommended)

### Installation
1. Download [Blink Shell](https://apps.apple.com/app/blink-shell-terminal/id1156707581) from the App Store
2. Open Blink Shell after installation

### Initial Setup

1. **Generate SSH Key** (if needed):
   ```
   ssh-keygen -t ed25519
   ```

2. **Configure Server Connection**:
   - Tap `Settings` → `Hosts` → `+`
   - Enter configuration:
     ```
     Host: myserver
     Hostname: [Your Tailscale IP or hostname]
     Port: 22
     User: [Your username]
     ```

3. **Enable Mosh**:
   - In the host settings, toggle on `Mosh`
   - Set Mosh Port: `60000`
   - Enable `Mosh Persist`

### SSH Key Setup

1. **Export your public key**:
   ```
   cat ~/.ssh/id_ed25519.pub
   ```

2. **Add to server** (one-time setup):
   ```
   ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
   ```

### Connection Profiles

Create quick connection aliases in Blink:

```bash
# In Blink Shell settings, add to Config:
host dev
  hostname your-tailscale-name
  user yourusername
  moshport 60000
  
host dev-direct
  hostname 192.168.1.100
  user yourusername
  moshport 60000
```

### Blink Tips

1. **Keyboard Shortcuts**:
   - `Cmd + T`: New tab
   - `Cmd + W`: Close tab
   - `Cmd + [1-9]`: Switch tabs
   - `Cmd + K`: Clear screen

2. **Mosh Commands**:
   ```bash
   # Quick connect with Mosh
   mosh myserver
   
   # Connect with specific options
   mosh --server=/usr/bin/mosh-server myserver
   ```

3. **Persistent Sessions**:
   - Blink maintains Mosh sessions even when switching apps
   - Sessions survive network changes automatically

## Option 2: Termius

### Installation
1. Download [Termius](https://apps.apple.com/app/termius-ssh-client/id549039908) from the App Store
2. Create a free account (optional but recommended for sync)

### Configuration

1. **Add New Host**:
   - Tap `+` → `New Host`
   - Enter details:
     ```
     Label: My Server
     Address: [Tailscale IP or hostname]
     Port: 22
     Username: [Your username]
     ```

2. **SSH Key Setup**:
   - Go to `Keychain` → `+` → `Generate Key`
   - Name: `Mobile Access Key`
   - Type: `Ed25519`
   - Generate and save

3. **Enable Mosh** (Termius Premium):
   - In host settings, enable `Use Mosh`
   - Set port range: `60000-61000`

### Termius Features

1. **Port Forwarding**:
   ```
   Local Forward:
   Local Port: 8080
   Remote Host: localhost
   Remote Port: 80
   ```

2. **SFTP Access**:
   - Swipe right on host → `SFTP`
   - Browse and transfer files

3. **Snippets** (Premium):
   - Create command shortcuts
   - Example: `Update System` → `sudo apt update && sudo apt upgrade`

## Tailscale iOS Setup

### Installation
1. Download [Tailscale](https://apps.apple.com/app/tailscale/id1470499037) from the App Store
2. Sign in with your Tailscale account

### Configuration
1. **Enable VPN**:
   - Follow iOS prompts to allow VPN configuration
   - Tailscale will create a VPN profile

2. **Connect to Network**:
   - Toggle Tailscale ON
   - Your devices will appear in the network list

3. **Use with SSH Clients**:
   - In Blink/Termius, use your Tailscale hostname
   - Example: `myserver.tailnet-name.ts.net`

## Connection Scripts

### Quick Connect Widget (Shortcuts App)

Create iOS Shortcuts for one-tap connections:

1. **Open Shortcuts app**
2. **Create New Shortcut**:
   ```
   1. Add "Open App" action → Select "Blink Shell"
   2. Add "Wait" action → 1 second
   3. Add "Text" action → Enter: "mosh myserver"
   4. Add "Open URLs" action → URL: "blinkshell://run?cmd=[text]"
   ```

3. **Add to Home Screen**:
   - Tap share icon → Add to Home Screen
   - Name: "Connect to Server"

### Blink Shell Scripts

Save these as shortcuts in Blink:

```bash
# ~/.blink/shortcuts/connect-home.sh
#!/bin/bash
mosh --server=/usr/bin/mosh-server home-server

# ~/.blink/shortcuts/connect-work.sh
#!/bin/bash
mosh --ssh="ssh -p 2222" work-server

# ~/.blink/shortcuts/tunnel-web.sh
#!/bin/bash
ssh -L 8080:localhost:80 -N myserver &
echo "Tunnel established on localhost:8080"
```

## Optimization Tips

### 1. Network Settings
- Enable WiFi Assist for seamless handoff
- Disable "Low Data Mode" for Tailscale
- Allow Tailscale to run in background

### 2. Battery Optimization
- Mosh uses less battery than persistent SSH
- Close unused sessions
- Use Tailscale's "Exit Node" feature sparingly

### 3. Security Best Practices
- Use Ed25519 keys (more secure, smaller)
- Enable Face ID/Touch ID in Blink/Termius
- Regularly rotate SSH keys
- Use Tailscale ACLs to restrict access

### 4. Troubleshooting

**Connection Issues**:
```bash
# Test basic connectivity
ping your-server-ip

# Test SSH
ssh -v user@server

# Test Mosh
mosh --debug user@server
```

**Tailscale Issues**:
```bash
# In Termius/Blink
tailscale status
tailscale ping your-server
```

## Advanced Features

### 1. tmux Integration
```bash
# Auto-attach to tmux on connection
# Add to ~/.bashrc on server:
if [[ -z "$TMUX" ]] && [[ "$SSH_CONNECTION" != "" ]]; then
    tmux attach-session -t mobile || tmux new-session -s mobile
fi
```

### 2. iOS Clipboard Integration
Blink Shell supports clipboard sync:
```bash
# Copy from server to iOS
echo "text" | pbcopy

# Paste from iOS to server
pbpaste
```

### 3. File Transfer
```bash
# Using Blink's built-in scp
scp file.txt myserver:~/

# Using Termius SFTP
# Swipe right on connection → SFTP
```

## Quick Reference Card

### Blink Shell
- Connect: `mosh myserver`
- New tab: `Cmd+T`
- Switch tabs: `Cmd+[1-9]`
- Settings: `Cmd+,`

### Termius
- Quick connect: Tap host
- SFTP: Swipe right → SFTP
- Port forward: Long press → Port Forwarding

### Tailscale
- Connect: Toggle ON in app
- Status: Check device list
- Exit node: Settings → Exit Node

## Support Resources

- [Blink Shell Documentation](https://docs.blink.sh)
- [Termius Help Center](https://support.termius.com)
- [Tailscale iOS Guide](https://tailscale.com/kb/1020/iOS)
- [Mosh Documentation](https://mosh.org/#usage)