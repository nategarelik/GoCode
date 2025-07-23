# iOS SSH Key Management Guide

This guide covers generating, managing, and using SSH keys on iOS devices with Blink Shell and Termius.

## SSH Key Basics

SSH keys provide secure, password-less authentication. They consist of:
- **Private Key**: Kept secret on your device
- **Public Key**: Shared with servers you want to access

## Blink Shell Key Management

### Generating Keys in Blink

1. **Open Blink Shell**
2. **Access Settings**: `Cmd + ,`
3. **Navigate to Keys**
4. **Generate New Key**:
   ```bash
   # In Blink's command line:
   ssh-keygen -t ed25519 -C "mobile@example.com"
   
   # Or for RSA (if ed25519 not supported):
   ssh-keygen -t rsa -b 4096 -C "mobile@example.com"
   ```

### Key Storage in Blink

Blink stores keys in its secure container:
- Location: `~/.ssh/` within Blink's sandbox
- Backed up with iCloud Keychain (if enabled)
- Encrypted at rest

### Exporting Keys from Blink

1. **View public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

2. **Export for backup**:
   ```bash
   # Display private key (be careful!)
   cat ~/.ssh/id_ed25519
   
   # Copy to clipboard
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```

3. **Share via Blink's UI**:
   - Settings → Keys → Select Key → Share

## Termius Key Management

### Generating Keys in Termius

1. **Open Termius**
2. **Go to Keychain**
3. **Tap '+' → Generate Key**
4. **Configure**:
   - Name: `Mobile Access Key`
   - Type: `Ed25519` (recommended)
   - Password: Optional (adds extra security)

### Importing Keys to Termius

1. **From File**:
   - Keychain → '+' → Import
   - Select file from Files app

2. **From Clipboard**:
   - Copy key content
   - Keychain → '+' → Import → Paste

3. **From QR Code** (Premium):
   - Generate QR code on desktop
   - Scan in Termius

### Key Organization in Termius

- **Tags**: Organize keys by project/purpose
- **Sync**: Keys sync across devices (with account)
- **Security**: Face ID/Touch ID protection

## Server-Side Setup

### Adding Your Public Key to Server

1. **Manual Method**:
   ```bash
   # On your iOS device, copy your public key:
   cat ~/.ssh/id_ed25519.pub
   
   # On the server, add to authorized_keys:
   echo "your-public-key-here" >> ~/.ssh/authorized_keys
   ```

2. **Using ssh-copy-id** (from another machine):
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server
   ```

3. **One-liner from iOS**:
   ```bash
   cat ~/.ssh/id_ed25519.pub | ssh user@server 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
   ```

### Proper Permissions

Ensure correct permissions on the server:
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## Key Security Best Practices

### 1. Use Strong Key Types
```bash
# Preferred: Ed25519 (fast, secure, small)
ssh-keygen -t ed25519

# Alternative: RSA 4096-bit
ssh-keygen -t rsa -b 4096

# Avoid: DSA, RSA < 2048-bit
```

### 2. Protect Private Keys
- Enable Face ID/Touch ID in apps
- Use key passwords for extra security
- Never share private keys
- Regularly rotate keys

### 3. Key Naming Convention
```bash
# Generate with descriptive names
ssh-keygen -t ed25519 -f ~/.ssh/mobile_work -C "work-ipad@2024"
ssh-keygen -t ed25519 -f ~/.ssh/mobile_personal -C "personal-iphone@2024"
```

## Advanced Key Management

### Multiple Keys for Different Servers

1. **Create SSH config** in Blink:
   ```bash
   # ~/.ssh/config
   Host work
       HostName work.example.com
       User john
       IdentityFile ~/.ssh/mobile_work
       
   Host personal
       HostName personal.example.com
       User john
       IdentityFile ~/.ssh/mobile_personal
   ```

2. **In Termius**:
   - Assign specific keys to each host
   - Set in host configuration

### Key Rotation Schedule

1. **Generate new key**:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_new
   ```

2. **Add new key to servers**:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519_new.pub user@server
   ```

3. **Test new key**:
   ```bash
   ssh -i ~/.ssh/id_ed25519_new user@server
   ```

4. **Remove old key from server**:
   ```bash
   # On server, edit ~/.ssh/authorized_keys
   # Remove the old public key line
   ```

### Emergency Key Recovery

1. **Backup Strategy**:
   - Export keys to secure location
   - Use password manager for storage
   - Enable iCloud Keychain (Blink)

2. **Recovery Options**:
   - Restore from iCloud (Blink)
   - Re-import from backup (Termius)
   - Generate new keys if lost

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   # Check key is being offered
   ssh -v user@server
   
   # Verify key in agent
   ssh-add -l
   ```

2. **Key Not Accepted**:
   ```bash
   # Check server logs (on server)
   sudo tail -f /var/log/auth.log
   
   # Verify authorized_keys format
   cat ~/.ssh/authorized_keys
   ```

3. **Multiple Keys Confusion**:
   ```bash
   # Explicitly specify key
   ssh -i ~/.ssh/specific_key user@server
   ```

### iOS-Specific Issues

1. **Keys Not Persisting**:
   - Enable "Background App Refresh" for SSH apps
   - Check app permissions

2. **Clipboard Issues**:
   - Use app's built-in sharing features
   - Try "Copy to Clipboard" in share sheet

3. **Sync Problems**:
   - Check iCloud/account sync settings
   - Manually export/import as backup

## Quick Reference

### Generate Ed25519 Key
```bash
ssh-keygen -t ed25519 -C "description"
```

### View Public Key
```bash
cat ~/.ssh/id_ed25519.pub
```

### Add to Server
```bash
ssh-copy-id user@server
# or
cat ~/.ssh/id_ed25519.pub | ssh user@server 'cat >> ~/.ssh/authorized_keys'
```

### Test Connection
```bash
ssh -v user@server
```

### List Keys in Agent
```bash
ssh-add -l
```

## Security Checklist

- [ ] Using Ed25519 or RSA 4096-bit keys
- [ ] Private keys protected with Face ID/Touch ID
- [ ] Regular key rotation (every 6-12 months)
- [ ] Backup strategy in place
- [ ] Server authorized_keys regularly audited
- [ ] Unused keys removed from servers
- [ ] Key passwords for high-security scenarios
- [ ] Keys named descriptively
- [ ] SSH config properly organized
- [ ] Emergency recovery plan documented