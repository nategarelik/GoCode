import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '@/utils/api'

// Mock fetch for integration tests
global.fetch = vi.fn()

describe('API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('logs in with valid credentials', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'valid-jwt-token',
          user: { id: 1, username: 'testuser' }
        })
      })

      const result = await api.login('testuser', 'password')

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password'
        })
      })

      expect(result).toEqual({
        token: 'valid-jwt-token',
        user: { id: 1, username: 'testuser' }
      })
    })

    it('handles login failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })

      await expect(api.login('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials')
    })

    it('verifies token successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true })
      })

      const result = await api.verifyToken('valid-token')

      expect(fetch).toHaveBeenCalledWith('/api/auth/verify', {
        headers: { 'Authorization': 'Bearer valid-token' }
      })

      expect(result.valid).toBe(true)
    })

    it('handles invalid token verification', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ valid: false })
      })

      await expect(api.verifyToken('invalid-token')).rejects.toThrow()
    })
  })

  describe('File Operations', () => {
    const authToken = 'test-token'

    beforeEach(() => {
      localStorage.setItem('token', authToken)
    })

    it('fetches file tree successfully', async () => {
      const mockFileTree = {
        name: 'project',
        type: 'directory',
        children: [
          { name: 'src', type: 'directory', children: [] },
          { name: 'package.json', type: 'file', size: 1024 }
        ]
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFileTree
      })

      const result = await api.getFileTree('/test/project')

      expect(fetch).toHaveBeenCalledWith('/api/files/tree?path=/test/project', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(result).toEqual(mockFileTree)
    })

    it('fetches file content successfully', async () => {
      const mockContent = {
        content: 'const test = "hello"',
        language: 'javascript'
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent
      })

      const result = await api.getFileContent('/test/project/src/App.js')

      expect(fetch).toHaveBeenCalledWith('/api/files/content?path=/test/project/src/App.js', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(result).toEqual(mockContent)
    })

    it('saves file content successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const result = await api.saveFile('/test/project/src/App.js', 'const updated = "code"')

      expect(fetch).toHaveBeenCalledWith('/api/files/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          path: '/test/project/src/App.js',
          content: 'const updated = "code"'
        })
      })

      expect(result.success).toBe(true)
    })

    it('uploads file successfully', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          url: '/uploads/test.txt' 
        })
      })

      const result = await api.uploadFile(mockFile)

      expect(fetch).toHaveBeenCalledWith('/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: expect.any(FormData)
      })

      expect(result).toEqual({
        success: true,
        url: '/uploads/test.txt'
      })
    })
  })

  describe('Claude Code Operations', () => {
    const authToken = 'test-token'

    beforeEach(() => {
      localStorage.setItem('token', authToken)
    })

    it('sends Claude message successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          response: 'Hello! How can I help?'
        })
      })

      const result = await api.sendClaudeMessage('Hello Claude', null, 'session-123')

      expect(fetch).toHaveBeenCalledWith('/api/claude/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: 'Hello Claude',
          sessionId: 'session-123'
        })
      })

      expect(result.success).toBe(true)
    })

    it('handles Claude API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Claude service unavailable' })
      })

      await expect(
        api.sendClaudeMessage('Hello Claude', null, 'session-123')
      ).rejects.toThrow('Claude service unavailable')
    })
  })

  describe('Git Operations', () => {
    const authToken = 'test-token'
    const projectPath = '/test/project'

    beforeEach(() => {
      localStorage.setItem('token', authToken)
    })

    it('gets git status successfully', async () => {
      const mockStatus = {
        branch: 'main',
        staged: ['src/App.js'],
        unstaged: ['src/utils.js'],
        untracked: ['new-file.js']
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      })

      const result = await api.getGitStatus(projectPath)

      expect(fetch).toHaveBeenCalledWith(`/api/git/status?path=${encodeURIComponent(projectPath)}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(result).toEqual(mockStatus)
    })

    it('stages files successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const result = await api.gitAdd(projectPath, 'src/App.js')

      expect(fetch).toHaveBeenCalledWith('/api/git/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          path: projectPath,
          files: 'src/App.js'
        })
      })

      expect(result.success).toBe(true)
    })

    it('commits changes successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          hash: 'abc123def',
          message: 'Test commit'
        })
      })

      const result = await api.gitCommit(projectPath, 'Test commit')

      expect(fetch).toHaveBeenCalledWith('/api/git/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          path: projectPath,
          message: 'Test commit'
        })
      })

      expect(result).toEqual({
        success: true,
        hash: 'abc123def',
        message: 'Test commit'
      })
    })
  })

  describe('Analytics Operations', () => {
    const authToken = 'test-token'

    beforeEach(() => {
      localStorage.setItem('token', authToken)
    })

    it('fetches dashboard data successfully', async () => {
      const mockData = {
        totalCommands: 150,
        averageResponseTime: 1200,
        errorRate: 0.02,
        activeUsers: 5
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      })

      const result = await api.getAnalyticsDashboard()

      expect(fetch).toHaveBeenCalledWith('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })

      expect(result).toEqual(mockData)
    })

    it('tracks events successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const result = await api.trackEvent('command_executed', {
        command: '/analyze',
        duration: 1500
      })

      expect(fetch).toHaveBeenCalledWith('/api/analytics/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          event: 'command_executed',
          data: {
            command: '/analyze',
            duration: 1500
          }
        })
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.getFileTree('/test')).rejects.toThrow('Network error')
    })

    it('handles timeout errors', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      await expect(api.getFileTree('/test')).rejects.toThrow('Timeout')
    })

    it('handles malformed responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      await expect(api.getFileTree('/test')).rejects.toThrow('Invalid JSON')
    })
  })

  describe('Request Retry Logic', () => {
    it('retries failed requests', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })

      const result = await api.getFileTree('/test')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result.success).toBe(true)
    })

    it('gives up after max retries', async () => {
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      await expect(api.getFileTree('/test')).rejects.toThrow('Network error')
      expect(fetch).toHaveBeenCalledTimes(3)
    })
  })
})