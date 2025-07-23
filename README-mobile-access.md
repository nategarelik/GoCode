# Mobile Remote Access Setup Guide

Complete setup for secure iOS remote access to your server using Tailscale, SSH, and Mosh.

## Quick Start

1. **Run Setup Scripts**:
   ```bash
   # Install and configure Tailscale
   ./setup-tailscale.sh
   
   # Install and configure SSH + Mosh
   ./setup-ssh-mosh.sh
   ```

2. **Configure iOS Client**:
   - Install Tailscale from App Store
   - Install Blink Shell or Termius
   - Follow the iOS setup guide: `ios-client-setup.md`

3. **Test Connection**:
   ```bash
   # From iOS device (Blink Shell)
   mosh username@your-tailscale-name
   ```

## Files Overview

### Setup Scripts
- **`setup-tailscale.sh`**: Installs Tailscale VPN for secure networking
- **`setup-ssh-mosh.sh`**: Configures SSH and Mosh for mobile connections
- **`mobile-connect.sh`**: Connection management utility

### Documentation
- **`ios-client-setup.md`**: Complete iOS client configuration guide
- **`ios-ssh-keys.md`**: SSH key management for iOS devices
- **`README-mobile-access.md`**: This file

### Utilities
- **`quick-connect-aliases.sh`**: Bash aliases for quick connections
- **`mobile-connect.sh`**: Advanced connection management tool

## Features

### Tailscale VPN
- Zero-configuration mesh VPN
- Automatic NAT traversal
- End-to-end encryption
- Works across all networks

### Mosh (Mobile Shell)
- Persistent connections
- Survives network changes
- Low-latency feel
- Automatic reconnection

### Mobile-Optimized SSH
- Keep-alive settings for mobile networks
- Compression enabled
- Key-based authentication
- Connection persistence

## Connection Methods

### 1. Via Tailscale (Recommended)
```bash
# Automatic routing through secure VPN
mosh username@device-name
```

### 2. Direct Mosh
```bash
# When on same network
mosh username@192.168.1.100
```

### 3. Standard SSH
```bash
# Fallback option
ssh username@device-name
```

## Mobile Connect Tool

The `mobile-connect.sh` script provides advanced connection management:

```bash
# Add a host
./mobile-connect.sh add work work.example.com -u john

# Quick connect
./mobile-connect.sh connect work

# Test connectivity
./mobile-connect.sh test work

# List configured hosts
./mobile-connect.sh list

# Show connection status
./mobile-connect.sh status
```

## Quick Connect Aliases

Source the aliases file in your shell:
```bash
echo "source ~/claudecodeui/quick-connect-aliases.sh" >> ~/.bashrc
```

Then use shortcuts:
- `qc hostname` - Quick connect with auto-detection
- `pc hostname` - Persistent connection with auto-reconnect
- `tsc hostname` - Tailscale SSH
- `lsc` - List available connections
- `qhelp` - Show all commands

## iOS App Recommendations

### Blink Shell (Recommended)
- Native Mosh support
- Multiple sessions
- Key management
- Customizable

### Termius (Alternative)
- User-friendly interface
- SFTP browser
- Snippet support
- Cross-platform sync

## Security Best Practices

1. **Use Ed25519 SSH keys**:
   ```bash
   ssh-keygen -t ed25519
   ```

2. **Enable Tailscale ACLs** for fine-grained access control

3. **Regular key rotation** (every 6-12 months)

4. **Enable 2FA** on Tailscale account

5. **Use Face ID/Touch ID** in iOS SSH apps

## Troubleshooting

### Connection Issues
```bash
# Test basic connectivity
./mobile-connect.sh test hostname

# Check Tailscale status
tailscale status

# Verify Mosh ports
sudo netstat -tulpn | grep mosh
```

### iOS-Specific Issues
- Ensure Tailscale VPN profile is active
- Check Background App Refresh is enabled
- Verify correct SSH key is configured

### Firewall Configuration
Ensure these ports are open:
- TCP 22 (SSH)
- UDP 60000-61000 (Mosh)
- UDP 41641 (Tailscale)

## Performance Tips

1. **Use Mosh** for cellular connections
2. **Enable compression** in SSH config
3. **Use Tailscale** to avoid NAT issues
4. **Configure tmux** for session persistence
5. **Set appropriate MTU** for mobile networks

## Next Steps

1. Set up tmux for persistent sessions
2. Configure automated backups
3. Set up monitoring and alerts
4. Create iOS Shortcuts for one-tap access
5. Configure additional security measures

## Support

For issues or questions:
1. Check Tailscale status: `tailscale status`
2. Review logs: `~/mobile-access/connection.log`
3. Test connectivity: `./mobile-connect.sh test`
4. Consult app-specific documentation