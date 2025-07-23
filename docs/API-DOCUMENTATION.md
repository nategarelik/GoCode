# ClaudeCodeUI API Documentation

## Overview
This document provides comprehensive API documentation for ClaudeCodeUI's backend services and WebSocket endpoints.

## Base Configuration
```
Base URL: http://localhost:3008
WebSocket: ws://localhost:3008/ws
Content-Type: application/json
```

## Authentication

### POST /api/auth/setup
Initial authentication setup for new installations.

**Request:**
```json
{
  "password": "string (required, min 8 characters)",
  "confirmPassword": "string (required, must match password)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Authentication setup completed"
}
```

### POST /api/auth/login
User authentication endpoint.

**Request:**
```json
{
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "string (JWT token)",
  "user": {
    "id": "string",
    "setupComplete": true
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid password
- `423 Locked`: Too many failed attempts

### POST /api/auth/logout
Logout and invalidate token.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## File Operations

### GET /api/files
List files and directories in a project.

**Query Parameters:**
- `path`: string (optional) - Directory path to list
- `project`: string (required) - Project identifier

**Response (200):**
```json
{
  "files": [
    {
      "name": "string",
      "path": "string", 
      "type": "file|directory",
      "size": "number (bytes)",
      "modified": "string (ISO date)",
      "children": "array (for directories)"
    }
  ]
}
```

### GET /api/files/content
Get file contents.

**Query Parameters:**
- `path`: string (required) - File path
- `project`: string (required) - Project identifier

**Response (200):**
```json
{
  "content": "string",
  "encoding": "utf8",
  "mimeType": "string"
}
```

### PUT /api/files/content
Update file contents.

**Request:**
```json
{
  "path": "string (required)",
  "project": "string (required)",
  "content": "string (required)",
  "encoding": "utf8"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "File updated successfully"
}
```

### POST /api/files
Create new file or directory.

**Request:**
```json
{
  "path": "string (required)",
  "project": "string (required)",
  "type": "file|directory",
  "content": "string (optional, for files)"
}
```

### DELETE /api/files
Delete file or directory.

**Query Parameters:**
- `path`: string (required) - Path to delete
- `project`: string (required) - Project identifier

## Claude Integration

### POST /api/claude/execute
Execute Claude Code commands.

**Request:**
```json
{
  "command": "string (required)",
  "project": "string (required)",
  "sessionId": "string (optional)",
  "stream": "boolean (default: true)"
}
```

**Response (200):**
```json
{
  "success": true,
  "output": "string",
  "sessionId": "string",
  "exitCode": "number"
}
```

### GET /api/claude/sessions
List Claude Code sessions.

**Query Parameters:**
- `project`: string (optional) - Filter by project

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "string",
      "project": "string",
      "created": "string (ISO date)",
      "lastActivity": "string (ISO date)",
      "messageCount": "number"
    }
  ]
}
```

### GET /api/claude/sessions/:sessionId/messages
Get session message history.

**Parameters:**
- `sessionId`: string (required) - Session identifier

**Response (200):**
```json
{
  "messages": [
    {
      "id": "string",
      "timestamp": "string (ISO date)",
      "role": "user|assistant|system",
      "content": "string",
      "metadata": "object"
    }
  ]
}
```

## Git Operations

### GET /api/git/status
Get git repository status.

**Query Parameters:**
- `project`: string (required) - Project identifier

**Response (200):**
```json
{
  "branch": "string",
  "ahead": "number",
  "behind": "number",
  "staged": "array of strings",
  "unstaged": "array of strings",
  "untracked": "array of strings"
}
```

### POST /api/git/add
Stage files for commit.

**Request:**
```json
{
  "project": "string (required)",
  "files": "array of strings (required)"
}
```

### POST /api/git/commit
Create git commit.

**Request:**
```json
{
  "project": "string (required)",
  "message": "string (required)",
  "files": "array of strings (optional)"
}
```

### POST /api/git/push
Push commits to remote repository.

**Request:**
```json
{
  "project": "string (required)",
  "branch": "string (optional, default: current)"
}
```

### POST /api/git/pull
Pull changes from remote repository.

**Request:**
```json
{
  "project": "string (required)",
  "branch": "string (optional, default: current)"
}
```

### GET /api/git/branches
List git branches.

**Query Parameters:**
- `project`: string (required) - Project identifier

**Response (200):**
```json
{
  "current": "string",
  "branches": [
    {
      "name": "string",
      "current": "boolean",
      "remote": "boolean"
    }
  ]
}
```

### POST /api/git/checkout
Switch git branch.

**Request:**
```json
{
  "project": "string (required)",
  "branch": "string (required)",
  "create": "boolean (default: false)"
}
```

## Analytics

### GET /api/analytics/overview
Get analytics overview.

**Query Parameters:**
- `timeRange`: string (optional) - "1h|24h|7d|30d" (default: "24h")
- `project`: string (optional) - Filter by project

**Response (200):**
```json
{
  "timeRange": "string",
  "metrics": {
    "totalSessions": "number",
    "totalMessages": "number",
    "activeProjects": "number",
    "averageSessionDuration": "number (minutes)"
  },
  "trends": {
    "sessions": "array of {timestamp, count}",
    "messages": "array of {timestamp, count}"
  }
}
```

### GET /api/analytics/projects
Get project-specific analytics.

**Response (200):**
```json
{
  "projects": [
    {
      "name": "string",
      "sessions": "number",
      "messages": "number",
      "lastActivity": "string (ISO date)",
      "languages": "array of strings"
    }
  ]
}
```

### POST /api/analytics/events
Track custom analytics event.

**Request:**
```json
{
  "event": "string (required)",
  "properties": "object (optional)",
  "timestamp": "string (ISO date, optional)"
}
```

## Health & Status

### GET /api/health
System health check endpoint.

**Response (200):**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "string (ISO date)",
  "uptime": "number (seconds)",
  "version": "string",
  "environment": "string",
  "checks": {
    "database": {"status": "healthy|unhealthy", "latency": "number"},
    "filesystem": {"status": "healthy|unhealthy"},
    "claudeCLI": {"status": "healthy|unhealthy"},
    "memory": {
      "status": "healthy|warning|critical",
      "usage": "string",
      "percentage": "string"
    }
  }
}
```

### GET /api/version
Get application version information.

**Response (200):**
```json
{
  "version": "string",
  "build": "string",
  "commit": "string",
  "buildDate": "string (ISO date)"
}
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3008/ws');
```

### Message Format
All WebSocket messages follow this format:
```json
{
  "type": "string (message type)",
  "data": "object (message payload)",
  "timestamp": "string (ISO date)",
  "id": "string (optional, for request tracking)"
}
```

### Chat Messages
**Client → Server:**
```json
{
  "type": "chat-message",
  "data": {
    "message": "string (required)",
    "sessionId": "string (optional)",
    "project": "string (required)"
  }
}
```

**Server → Client:**
```json
{
  "type": "chat-response",
  "data": {
    "content": "string",
    "sessionId": "string",
    "role": "assistant",
    "metadata": "object"
  }
}
```

### Terminal Operations
**Client → Server:**
```json
{
  "type": "terminal-command",
  "data": {
    "command": "string (required)",
    "project": "string (required)",
    "sessionId": "string (optional)"
  }
}
```

**Server → Client:**
```json
{
  "type": "terminal-output",
  "data": {
    "output": "string",
    "exitCode": "number",
    "sessionId": "string"
  }
}
```

### File Watching
**Client → Server:**
```json
{
  "type": "watch-files",
  "data": {
    "project": "string (required)",
    "paths": "array of strings (optional)"
  }
}
```

**Server → Client:**
```json
{
  "type": "file-changed",
  "data": {
    "path": "string",
    "event": "changed|added|deleted",
    "project": "string"
  }
}
```

### Project Updates
**Server → Client:**
```json
{
  "type": "project-updated",
  "data": {
    "project": "string",
    "changes": "array of changes"
  }
}
```

### Error Messages
**Server → Client:**
```json
{
  "type": "error",
  "data": {
    "message": "string",
    "code": "string (error code)",
    "details": "object (optional)"
  }
}
```

## Error Codes

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Custom Error Codes
- `AUTH_REQUIRED`: Authentication token required
- `AUTH_INVALID`: Invalid authentication token
- `AUTH_EXPIRED`: Authentication token expired
- `PROJECT_NOT_FOUND`: Requested project not found
- `FILE_NOT_FOUND`: Requested file not found
- `PERMISSION_DENIED`: Insufficient permissions
- `CLAUDE_ERROR`: Claude CLI execution error
- `GIT_ERROR`: Git operation error
- `VALIDATION_ERROR`: Request validation failed

## Rate Limiting

### Limits
- API endpoints: 100 requests/minute per IP
- WebSocket messages: 60 messages/minute per connection
- File uploads: 10 uploads/minute per user

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Examples

### Complete Chat Session
```javascript
// 1. Authenticate
const authResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({password: 'mypassword'})
});
const {token} = await authResponse.json();

// 2. Connect WebSocket
const ws = new WebSocket('ws://localhost:3008/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    data: {token}
  }));
};

// 3. Send chat message
ws.send(JSON.stringify({
  type: 'chat-message',
  data: {
    message: 'Help me create a React component',
    project: 'my-project'
  }
}));
```

### File Operations
```javascript
// List project files
const files = await fetch('/api/files?project=my-project', {
  headers: {'Authorization': `Bearer ${token}`}
});

// Read file content
const content = await fetch('/api/files/content?project=my-project&path=src/App.jsx', {
  headers: {'Authorization': `Bearer ${token}`}
});

// Update file
await fetch('/api/files/content', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project: 'my-project',
    path: 'src/App.jsx',
    content: 'new content'
  })
});
```

### Git Operations
```javascript
// Get git status
const status = await fetch('/api/git/status?project=my-project', {
  headers: {'Authorization': `Bearer ${token}`}
});

// Stage and commit files
await fetch('/api/git/add', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project: 'my-project',
    files: ['src/App.jsx']
  })
});

await fetch('/api/git/commit', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project: 'my-project',
    message: 'Update App component'
  })
});
```

## SDK Examples

### JavaScript/Node.js
```javascript
class ClaudeUIClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getFiles(project, path) {
    return this.request(`/api/files?project=${project}&path=${path || ''}`);
  }

  async updateFile(project, path, content) {
    return this.request('/api/files/content', {
      method: 'PUT',
      body: JSON.stringify({project, path, content})
    });
  }
}
```

This API documentation provides comprehensive coverage of all ClaudeCodeUI backend services with examples and error handling information.