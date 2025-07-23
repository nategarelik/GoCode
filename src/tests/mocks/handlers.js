import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: { id: 1, username: 'testuser' }
    })
  }),

  http.post('/api/auth/setup', () => {
    return HttpResponse.json({
      success: true,
      message: 'Setup completed successfully'
    })
  }),

  http.get('/api/auth/verify', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json({ valid: true })
    }
    return HttpResponse.json({ valid: false }, { status: 401 })
  }),

  // File system endpoints
  http.get('/api/files/tree', () => {
    return HttpResponse.json({
      name: 'root',
      type: 'directory',
      children: [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'App.jsx', type: 'file', size: 1024 },
            { name: 'main.jsx', type: 'file', size: 512 }
          ]
        },
        { name: 'package.json', type: 'file', size: 2048 }
      ]
    })
  }),

  http.get('/api/files/content', ({ request }) => {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    
    return HttpResponse.json({
      content: `// Mock content for ${path}\nexport default function Component() {\n  return <div>Hello World</div>\n}`,
      language: 'javascript'
    })
  }),

  http.post('/api/files/save', () => {
    return HttpResponse.json({ success: true })
  }),

  // Claude Code endpoints
  http.post('/api/claude/execute', () => {
    return HttpResponse.json({
      success: true,
      output: 'Mock command output',
      timestamp: Date.now()
    })
  }),

  // Git endpoints
  http.get('/api/git/status', () => {
    return HttpResponse.json({
      branch: 'main',
      staged: [],
      unstaged: ['src/App.jsx'],
      untracked: []
    })
  }),

  http.post('/api/git/add', () => {
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/git/commit', () => {
    return HttpResponse.json({
      success: true,
      hash: 'abc123',
      message: 'Test commit'
    })
  }),

  // Analytics endpoints
  http.get('/api/analytics/dashboard', () => {
    return HttpResponse.json({
      totalCommands: 150,
      averageResponseTime: 1200,
      errorRate: 0.02,
      activeUsers: 5,
      recentActivity: []
    })
  }),

  http.post('/api/analytics/event', () => {
    return HttpResponse.json({ success: true })
  }),

  // MCP endpoints
  http.get('/api/mcp/servers', () => {
    return HttpResponse.json([
      { name: 'context7', status: 'connected' },
      { name: 'sequential', status: 'connected' }
    ])
  }),

  // Version check
  http.get('/api/version', () => {
    return HttpResponse.json({
      version: '1.5.0',
      claudeVersion: '1.0.24'
    })
  }),

  // Error simulation for testing error handling
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  })
]