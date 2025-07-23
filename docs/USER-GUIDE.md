# ClaudeCodeUI User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)  
3. [Chat Interface](#chat-interface)
4. [File Management](#file-management)
5. [Terminal Operations](#terminal-operations)
6. [Git Integration](#git-integration)
7. [Project Management](#project-management)
8. [Settings & Configuration](#settings--configuration)
9. [Mobile Usage](#mobile-usage)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. **Open ClaudeCodeUI** in your web browser
2. **Complete Initial Setup**: Create a secure password for accessing the interface
3. **Select Project**: Choose from your available Claude Code projects or create a new one
4. **Configure Tools**: Enable the Claude Code tools you want to use (optional, all disabled by default for security)

### System Requirements

**Minimum Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection for real-time features
- 2GB RAM recommended
- Claude Code CLI installed and configured

**Recommended:**
- Desktop: 1920x1080 resolution or higher
- Mobile: iOS 14+ or Android 10+ for optimal PWA experience
- Stable internet connection (WebSocket support required)

### Quick Start Checklist

- [ ] ClaudeCodeUI is accessible via web browser
- [ ] Initial password setup completed
- [ ] At least one Claude Code project is available
- [ ] Tools configuration reviewed and set up
- [ ] Test chat message sent successfully

## Interface Overview

### Layout Structure

ClaudeCodeUI features a responsive layout that adapts to your screen size:

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Header (Logo, Settings, Dark Mode)                 │
├─────────────┬───────────────────────────────────────┤
│             │                                       │
│  Sidebar    │        Main Content Area              │
│  - Projects │        - Chat Interface               │
│  - Sessions │        - File Browser                 │
│  - Git      │        - Terminal                     │
│  - Settings │        - Analytics                    │
│             │                                       │
└─────────────┴───────────────────────────────────────┘
```

**Mobile Layout:**
```
┌─────────────────────────────────┐
│ Header with Menu Button         │
├─────────────────────────────────┤
│                                 │
│     Main Content Area           │
│     (Full Width)                │
│                                 │
├─────────────────────────────────┤
│ Bottom Navigation Tabs          │
└─────────────────────────────────┘
```

### Navigation Tabs

- **💬 Chat**: Interactive conversation with Claude Code
- **📁 Files**: File browser and editor
- **🖥️ Shell**: Terminal interface for command execution
- **📊 Analytics**: Usage statistics and project insights
- **⚙️ Settings**: Tools and application configuration

### Theme Options

- **🌞 Light Mode**: Default clean interface
- **🌙 Dark Mode**: Eye-friendly dark theme
- **🔄 Auto**: Follows system preference
- **⚡ High Contrast**: Enhanced accessibility mode

## Chat Interface

### Starting a Conversation

1. **Select Project**: Choose your active project from the sidebar
2. **Type Message**: Click in the message input area at the bottom
3. **Send Message**: Press `Enter` or click the Send button
4. **Wait for Response**: Claude will process your request and respond

### Message Types

**Text Messages:**
- Regular conversation with Claude
- Code questions and explanations
- Project guidance and assistance

**File Attachments:**
- Drag and drop files onto the chat area
- Use the 📎 attachment button to browse files
- Supported formats: text files, images, documents
- Maximum file size: 10MB per file

**Voice Messages:**
- Click the 🎤 microphone button to start recording
- Speak clearly for best speech-to-text accuracy
- Click again to stop recording and send

### Advanced Features

**Message Formatting:**
```
**Bold text** for emphasis
*Italic text* for subtle emphasis
`inline code` for code snippets
```

**Code Blocks:**
```javascript
function example() {
    return "Formatted code with syntax highlighting";
}
```

**Session Management:**
- **New Session**: Click "+ New Chat" to start fresh
- **Resume Session**: Select previous conversations from the sidebar
- **Session History**: All conversations are automatically saved
- **Export Chat**: Download conversation history as text or JSON

### Chat Settings

Access chat settings via the ⚙️ gear icon:

- **Auto-scroll**: Automatically scroll to new messages (default: on)
- **Send Method**: Enter to send vs Ctrl+Enter (default: Enter)
- **Message Timestamps**: Show/hide message times
- **Compact Mode**: Reduce spacing for more content
- **Sound Notifications**: Audio alerts for new messages

## File Management

### File Browser

The file browser provides a complete view of your project structure:

**Tree View:**
- Expandable folders with arrow icons
- File type icons for easy identification
- Size and modification date information
- Right-click context menu for operations

**List View:**
- Detailed file listing with metadata
- Sortable columns (name, size, date)
- Quick search and filtering
- Bulk selection capabilities

### File Operations

**Opening Files:**
- **Single Click**: Select file
- **Double Click**: Open in editor
- **Right Click → Open**: Alternative method
- **Enter Key**: Open selected file

**File Management:**
- **Create File**: Right-click → "New File"
- **Create Folder**: Right-click → "New Folder"  
- **Rename**: Right-click → "Rename" or press F2
- **Delete**: Right-click → "Delete" or press Delete key
- **Copy Path**: Right-click → "Copy Path"

**File Upload:**
- Drag files from your computer into the file browser
- Use the "Upload" button in the toolbar
- Multiple file selection supported
- Automatic conflict resolution options

### File Editor

**Features:**
- Syntax highlighting for 100+ languages
- Line numbers and code folding
- Find and replace functionality
- Auto-save after 2 seconds of inactivity
- Undo/redo with full history

**Keyboard Shortcuts:**
- `Ctrl+S`: Save file
- `Ctrl+F`: Find in file
- `Ctrl+H`: Find and replace
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+/`: Toggle comment

### Search and Filtering

**File Search:**
- Use the search box at the top of the file browser
- Real-time filtering as you type
- Search by filename or extension
- Regular expression support with `/pattern/` syntax

**Content Search:**
- Search across all files in the project
- Case-sensitive and regex options
- Results show file location and context
- Click results to jump to location

## Terminal Operations

### Terminal Interface

The terminal provides direct access to your system and Claude Code CLI:

**Features:**
- Full terminal emulation with color support
- Command history (up/down arrows)
- Tab completion for files and commands
- Copy/paste support
- Resizable terminal window

### Common Commands

**Claude Code Commands:**
```bash
# Start new conversation
claude

# Execute specific command
claude "help me debug this function"

# Work with files
claude --file src/app.js "review this code"
```

**System Commands:**
```bash
# Navigate directories
cd project-folder
ls -la
pwd

# File operations
cat filename.txt
nano filename.txt
mkdir new-folder

# Git operations (see Git Integration section)
git status
git add .
git commit -m "message"
```

### Terminal Settings

- **Theme**: Light or dark terminal theme
- **Font Size**: Adjustable from 12px to 24px
- **Font Family**: Choose between monospace fonts
- **Cursor Style**: Block, underline, or bar cursor
- **Bell**: Enable/disable terminal bell sounds

### Multiple Sessions

- **New Terminal**: Click "+" to open additional terminals
- **Switch Tabs**: Click tab headers to switch between terminals
- **Close Terminal**: Click "×" on tab or type `exit`
- **Rename Session**: Right-click tab to rename

## Git Integration

### Repository Overview

The Git panel provides a visual overview of your repository status:

**Status Indicators:**
- 🟢 **Clean**: No changes
- 🟡 **Modified**: Files have changes
- 🔴 **Conflicts**: Merge conflicts present
- 📤 **Ahead**: Local commits not pushed
- 📥 **Behind**: Remote commits not pulled

### Working with Changes

**Staging Changes:**
1. View changed files in the "Changes" section
2. Click the "+" icon next to files to stage
3. Or use "Stage All" to stage everything
4. Review staged changes in the "Staged" section

**Committing Changes:**
1. Write a descriptive commit message
2. Optionally add detailed description
3. Click "Commit" to create the commit
4. Push changes with "Push" button

**Handling Conflicts:**
1. Conflicts appear in the "Conflicts" section
2. Click on conflicted files to open merge editor
3. Choose "Accept Incoming", "Accept Current", or edit manually
4. Mark conflicts as resolved
5. Complete the merge commit

### Branch Management

**Switching Branches:**
- Select from the branch dropdown
- Click "New Branch" to create and switch
- Enter branch name and base branch

**Branch Operations:**
- **Merge**: Merge selected branch into current
- **Delete**: Remove local or remote branches
- **Rename**: Change branch name
- **Track**: Set up tracking for remote branches

### Remote Operations

**Synchronization:**
- **Pull**: Fetch and merge remote changes
- **Push**: Send local commits to remote
- **Fetch**: Download remote references without merging
- **Sync**: Pull then push in one operation

**Remote Management:**
- View configured remotes
- Add new remote repositories
- Change remote URLs
- Remove unused remotes

## Project Management

### Project Selection

**Available Projects:**
- Projects are automatically detected from `~/.claude/projects/`
- Recently used projects appear first
- Search projects by name or path
- Pin frequently used projects to top

**Creating Projects:**
1. Click "New Project" in the sidebar
2. Choose project template or start blank
3. Set project name and location
4. Configure initial settings
5. Click "Create" to initialize

### Project Settings

**General Settings:**
- Project name and description
- Default Claude Code model
- File exclusion patterns
- Auto-save preferences

**Tool Configuration:**
- Enable/disable specific Claude Code tools
- Set tool-specific parameters
- Configure safety restrictions
- Review tool permissions

**Performance Settings:**
- File watching sensitivity
- Auto-refresh intervals
- Cache size limits
- Memory optimization options

### Session Management

**Session Organization:**
- Sessions are grouped by project
- Automatic session naming based on first message
- Manual session renaming available
- Session archiving for old conversations

**Session Recovery:**
- Automatic recovery of interrupted sessions
- Manual session export/import
- Backup and restore functionality
- Cross-device session sync (when configured)

## Settings & Configuration

### Application Settings

**General:**
- Language selection (English, Spanish, French, German, Japanese)
- Time zone configuration
- Date/time format preferences
- Startup behavior

**Appearance:**
- Theme selection (Light/Dark/Auto/High Contrast)
- Font size and family
- UI density (Compact/Comfortable/Spacious)
- Animation preferences

**Privacy:**
- Analytics data collection
- Error reporting
- Usage statistics
- Local data retention

### Tool Configuration

**Security Settings:**
- All tools disabled by default for security
- Individual tool enable/disable
- Permission levels per tool
- Safety mode configuration

**Available Tools:**
- **File Operations**: Read, write, create, delete files
- **Shell Access**: Execute system commands
- **Git Operations**: Repository management
- **Web Access**: HTTP requests and web browsing
- **Code Analysis**: Syntax and semantic analysis

**Tool Safety:**
- **Safe Mode**: Extra validation before tool use
- **Confirmation Prompts**: Ask before destructive operations
- **Audit Log**: Track all tool usage
- **Rate Limiting**: Prevent excessive tool use

### Keyboard Shortcuts

**Global Shortcuts:**
- `Ctrl+1-5`: Switch between main tabs
- `Ctrl+N`: New chat session
- `Ctrl+,`: Open settings
- `F1`: Toggle help panel
- `F11`: Toggle fullscreen

**Chat Interface:**
- `Enter`: Send message (configurable)
- `Ctrl+Enter`: Send message (alternative)
- `Shift+Enter`: New line in message
- `↑/↓`: Navigate message history
- `Ctrl+K`: Clear chat

**File Browser:**
- `F2`: Rename selected file
- `Delete`: Delete selected file
- `Ctrl+C`: Copy file path
- `Enter`: Open selected file
- `Space`: Preview file

**Terminal:**
- `↑/↓`: Command history
- `Tab`: Auto-complete
- `Ctrl+C`: Interrupt command
- `Ctrl+L`: Clear terminal
- `Ctrl+Shift+C/V`: Copy/paste

## Mobile Usage

### Progressive Web App (PWA)

**Installation:**
1. Open ClaudeCodeUI in mobile browser
2. Look for "Add to Home Screen" prompt
3. Tap "Add" to install as app
4. Access from home screen like native app

**PWA Features:**
- Full-screen experience
- Offline functionality for cached content
- Push notifications (when enabled)
- Fast loading with service worker
- Native app-like navigation

### Mobile Interface

**Touch Gestures:**
- **Tap**: Select/activate
- **Double Tap**: Open file or expand folder
- **Long Press**: Context menu
- **Swipe Left/Right**: Navigate tabs
- **Pinch**: Zoom in code editor

**Mobile-Specific Features:**
- Bottom navigation for easy thumb access
- Collapsible sidebar for more screen space
- Touch-optimized button sizes
- Voice input with mobile speech recognition
- Haptic feedback (on supported devices)

### Mobile Optimization

**Performance:**
- Lazy loading of heavy components
- Optimized image sizes for mobile bandwidth
- Reduced animations on low-power mode
- Efficient WebSocket management

**Accessibility:**
- Large touch targets (minimum 44px)
- High contrast mode for outdoor use
- Voice control support
- Screen reader optimization

## Tips & Best Practices

### Effective Communication

**Writing Clear Messages:**
- Be specific about what you want to achieve
- Include relevant context and files
- Ask one question at a time for clarity
- Use descriptive file names and paths

**Using Attachments:**
- Attach relevant code files for context
- Include error messages and logs
- Share screenshots of visual issues
- Keep file sizes reasonable (<10MB)

### Project Organization

**File Structure:**
- Maintain clean, logical folder organization
- Use descriptive file and folder names
- Keep project root clean of clutter
- Document project structure in README

**Session Management:**
- Use descriptive session names
- Archive old sessions periodically
- Export important conversations
- Keep related discussions in same session

### Performance Optimization

**Large Projects:**
- Use file search instead of browsing large directories
- Close unused terminal sessions
- Clear chat history periodically
- Exclude unnecessary files from watching

**Network Usage:**
- Enable compression for slow connections
- Use offline mode when available
- Minimize large file uploads
- Cache frequently accessed content

### Security Best Practices

**Tool Usage:**
- Only enable tools you actually need
- Review tool permissions regularly
- Use safe mode for destructive operations
- Monitor tool usage in audit logs

**Data Protection:**
- Use strong passwords for authentication
- Log out when using shared computers
- Be cautious with sensitive file uploads
- Regular backup of important data

## Troubleshooting

### Common Issues

**Connection Problems:**
- **Symptom**: WebSocket connection failures
- **Solution**: Check network connection, refresh page, verify server status
- **Prevention**: Use stable internet connection

**Performance Issues:**
- **Symptom**: Slow loading or unresponsive interface
- **Solution**: Clear browser cache, close unused tabs, reduce concurrent sessions
- **Prevention**: Regular browser maintenance, adequate system resources

**File Access Errors:**
- **Symptom**: Cannot read/write files
- **Solution**: Check file permissions, verify project path, restart application
- **Prevention**: Proper project setup, regular permission audits

### Error Messages

**"No Claude projects found":**
1. Ensure Claude CLI is properly installed
2. Run `claude` command in at least one project directory
3. Verify `~/.claude/projects/` directory exists
4. Check file system permissions

**"Authentication failed":**
1. Verify password is correct
2. Clear browser cookies and cache
3. Check for authentication timeout
4. Restart the application if needed

**"Tool execution failed":**
1. Verify tool is enabled in settings
2. Check tool permissions and safety mode
3. Review error details in console
4. Try disabling and re-enabling the tool

### Performance Troubleshooting

**Slow File Loading:**
- Enable file caching in settings
- Exclude large binary files from watching
- Reduce file tree depth limit
- Use list view instead of tree view

**Memory Usage:**
- Close unused chat sessions
- Clear message history periodically
- Reduce terminal scrollback buffer
- Disable unnecessary animations

**Network Issues:**
- Check WebSocket connection status
- Try different network connection
- Disable browser extensions temporarily
- Use incognito/private browsing mode

### Getting Help

**Documentation:**
- Check this user guide for detailed information
- Review API documentation for technical details
- Visit component library for UI guidance
- Read deployment guide for setup issues

**Support Channels:**
- GitHub Issues for bug reports and feature requests
- Community discussions for general questions
- Email support for account and security issues
- Live chat support (when available)

**Diagnostic Information:**
When reporting issues, include:
- Browser name and version
- Operating system
- Error messages or console logs
- Steps to reproduce the issue
- Screenshots of the problem

---

## Quick Reference Card

### Essential Shortcuts
| Action | Shortcut |
|--------|----------|
| Send Message | `Enter` |
| New Chat | `Ctrl+N` |
| Switch Tabs | `Ctrl+1-5` |
| Save File | `Ctrl+S` |
| Find in File | `Ctrl+F` |
| Terminal Clear | `Ctrl+L` |
| Settings | `Ctrl+,` |
| Help | `F1` |

### Status Indicators
- 🟢 Connected and ready
- 🟡 Processing or loading
- 🔴 Error or disconnected
- 📤 Uploading/sending
- 📥 Downloading/receiving

### File Types
- 📄 Text/code files
- 📁 Folders/directories  
- 🖼️ Images
- 📊 Data files
- ⚙️ Configuration files
- 🔒 Protected/hidden files

This comprehensive user guide covers all aspects of using ClaudeCodeUI effectively. For additional help or specific questions, please refer to the troubleshooting section or contact support.