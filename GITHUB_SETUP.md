# GitHub Repository Setup Instructions

## 🚀 Quick Setup

To publish this production-ready Claude Code UI to your GitHub account, follow these steps:

### 1. Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `GoCode`
3. Description: "Production-ready web interface for Claude Code - Access your AI coding assistant from any device"
4. Make it **Public** (required for GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 2. Push the Code

After creating the empty repository, run these commands in your terminal:

```bash
cd /home/ngarelik/claudecodeui

# Push to your repository
git push -u origin main
```

If you get a authentication error, you'll need to:
1. Generate a Personal Access Token at: https://github.com/settings/tokens/new
2. Select scopes: `repo` (full control of private repositories)
3. Use your GitHub username and the token as password when prompted

### 3. Enable GitHub Pages (Optional - for static demo)

To host a static version:

1. Go to your repository settings: https://github.com/nategarelik/GoCode/settings
2. Scroll to "Pages" section
3. Source: Deploy from a branch
4. Branch: main
5. Folder: /dist
6. Click Save

### 4. Set Up Secrets for CI/CD

If you want to use the automated deployment pipelines:

1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password
   - `DEPLOY_KEY`: SSH key for deployment server (if using)

### 5. Access Your App

After pushing, you can:

- **Clone on any device**: `git clone https://github.com/nategarelik/GoCode.git`
- **Run locally**: `npm install && npm start`
- **Access at**: http://localhost:3008

## 🌐 Remote Access Options

### Option 1: Deploy to a Cloud Provider

The repository includes configurations for:
- **Docker**: `docker-compose up`
- **Kubernetes**: Apply manifests in `k8s/` directory
- **Terraform**: Infrastructure as code in `terraform/` directory

### Option 2: Use Tailscale (Recommended for Personal Use)

1. Install Tailscale on your devices
2. Run the setup script: `./setup-tailscale.sh`
3. Access from any device on your Tailscale network

### Option 3: Traditional Port Forwarding

1. Configure your router to forward port 3008
2. Use dynamic DNS for a stable hostname
3. Consider security implications

## 📱 Mobile Access

- The app is fully responsive and works on all devices
- Install as PWA: Visit the site and "Add to Home Screen"
- iOS shortcuts are available in `ios-shortcut.html`

## 🔒 Security Notes

- Default setup uses JWT authentication
- Configure strong passwords in production
- Use HTTPS for remote access
- Review security settings in `.env` file

## 📚 Additional Resources

- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
- [API Documentation](./docs/API-DOCUMENTATION.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [User Guide](./docs/USER-GUIDE.md)

## 🆘 Troubleshooting

If you encounter issues:

1. Check that Claude Code CLI is installed: `claude --version`
2. Verify Node.js version: `node --version` (should be 18+)
3. Clear browser cache if styles don't load
4. Check console for errors: F12 → Console tab

## 📄 License

This project is MIT licensed. See [LICENSE](./LICENSE) file for details.