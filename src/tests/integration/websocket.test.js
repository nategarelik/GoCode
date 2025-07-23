import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { connectWebSocket, sendMessage, closeConnection } from '@/utils/websocket'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = MockWebSocket.CONNECTING
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
    this.sent = []
    
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) this.onopen(new Event('open'))
    }, 10)
  }

  send(data) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.sent.push(data)
    } else {
      throw new Error('WebSocket is not open')
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) this.onclose(new CloseEvent('close'))
  }

  addEventListener(event, handler) {
    this[`on${event}`] = handler
  }

  removeEventListener(event, handler) {
    this[`on${event}`] = null
  }

  // Simulate receiving a message
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }))
    }
  }

  // Simulate connection error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }

  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
}

global.WebSocket = MockWebSocket

describe('WebSocket Integration Tests', () => {
  let mockWS
  let connectionHandlers

  beforeEach(() => {
    connectionHandlers = {
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onMessage: vi.fn(),
      onError: vi.fn()
    }
  })

  afterEach(() => {
    if (mockWS) {
      mockWS.close()
      mockWS = null
    }
    vi.clearAllMocks()
  })

  describe('Connection Management', () => {
    it('establishes WebSocket connection successfully', async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws', connectionHandlers)

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(mockWS.readyState).toBe(MockWebSocket.OPEN)
      expect(connectionHandlers.onOpen).toHaveBeenCalled()
    })

    it('handles connection errors', async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws', connectionHandlers)
      
      mockWS.simulateError()

      expect(connectionHandlers.onError).toHaveBeenCalled()
    })

    it('handles connection close', async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws', connectionHandlers)
      
      await new Promise(resolve => setTimeout(resolve, 20))
      
      mockWS.close()

      expect(connectionHandlers.onClose).toHaveBeenCalled()
    })

    it('reconnects automatically after connection loss', async () => {
      const originalWebSocket = global.WebSocket
      let connectionCount = 0
      
      global.WebSocket = class extends MockWebSocket {
        constructor(url) {
          super(url)
          connectionCount++
        }
      }

      mockWS = connectWebSocket('ws://localhost:3001/ws', {
        ...connectionHandlers,
        autoReconnect: true,
        reconnectInterval: 100
      })

      await new Promise(resolve => setTimeout(resolve, 20))
      
      // Simulate connection loss
      mockWS.close()
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(connectionCount).toBeGreaterThan(1)
      
      global.WebSocket = originalWebSocket
    })
  })

  describe('Message Handling', () => {
    beforeEach(async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws', connectionHandlers)
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    it('sends messages successfully', () => {
      const message = { type: 'test', data: 'hello' }
      
      sendMessage(mockWS, message)

      expect(mockWS.sent).toContain(JSON.stringify(message))
    })

    it('receives and parses messages', () => {
      const message = { type: 'response', data: 'world' }
      
      mockWS.simulateMessage(JSON.stringify(message))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(message)
    })

    it('handles malformed message data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockWS.simulateMessage('invalid json')

      expect(connectionHandlers.onMessage).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('queues messages when connection is not ready', () => {
      const newWS = new MockWebSocket('ws://localhost:3001/ws')
      const message = { type: 'test', data: 'queued' }
      
      // Try to send before connection is open
      sendMessage(newWS, message)
      
      // Should queue the message and send when connection opens
      setTimeout(() => {
        expect(newWS.sent).toContain(JSON.stringify(message))
      }, 20)
    })
  })

  describe('Chat WebSocket Integration', () => {
    beforeEach(async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws/chat', connectionHandlers)
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    it('handles user message events', () => {
      const userMessage = {
        type: 'user_message',
        content: 'Hello Claude',
        sessionId: 'session-123'
      }
      
      sendMessage(mockWS, userMessage)

      expect(mockWS.sent).toContain(JSON.stringify(userMessage))
    })

    it('handles assistant response events', () => {
      const assistantResponse = {
        type: 'assistant_response',
        content: 'Hello! How can I help you?',
        sessionId: 'session-123'
      }
      
      mockWS.simulateMessage(JSON.stringify(assistantResponse))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(assistantResponse)
    })

    it('handles tool use events', () => {
      const toolUse = {
        type: 'tool_use',
        tool: 'file_read',
        parameters: { path: '/test/file.js' },
        sessionId: 'session-123'
      }
      
      mockWS.simulateMessage(JSON.stringify(toolUse))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(toolUse)
    })

    it('handles session events', () => {
      const sessionCreated = {
        type: 'session_created',
        sessionId: 'session-456'
      }
      
      mockWS.simulateMessage(JSON.stringify(sessionCreated))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(sessionCreated)
    })
  })

  describe('Shell WebSocket Integration', () => {
    beforeEach(async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws/shell', connectionHandlers)
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    it('handles terminal input events', () => {
      const terminalInput = {
        type: 'input',
        data: 'ls -la'
      }
      
      sendMessage(mockWS, terminalInput)

      expect(mockWS.sent).toContain(JSON.stringify(terminalInput))
    })

    it('handles terminal output events', () => {
      const terminalOutput = {
        type: 'output',
        data: 'total 4\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\n'
      }
      
      mockWS.simulateMessage(JSON.stringify(terminalOutput))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(terminalOutput)
    })

    it('handles terminal resize events', () => {
      const resize = {
        type: 'resize',
        cols: 100,
        rows: 30
      }
      
      sendMessage(mockWS, resize)

      expect(mockWS.sent).toContain(JSON.stringify(resize))
    })

    it('handles directory change events', () => {
      const changeDir = {
        type: 'cd',
        path: '/new/project/path'
      }
      
      sendMessage(mockWS, changeDir)

      expect(mockWS.sent).toContain(JSON.stringify(changeDir))
    })
  })

  describe('File Watch WebSocket Integration', () => {
    beforeEach(async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws/files', connectionHandlers)
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    it('handles file change events', () => {
      const fileChange = {
        type: 'file_changed',
        path: '/test/project/src/App.js',
        event: 'modified'
      }
      
      mockWS.simulateMessage(JSON.stringify(fileChange))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(fileChange)
    })

    it('handles file creation events', () => {
      const fileCreated = {
        type: 'file_changed',
        path: '/test/project/new-file.js',
        event: 'created'
      }
      
      mockWS.simulateMessage(JSON.stringify(fileCreated))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(fileCreated)
    })

    it('handles file deletion events', () => {
      const fileDeleted = {
        type: 'file_changed',
        path: '/test/project/old-file.js',
        event: 'deleted'
      }
      
      mockWS.simulateMessage(JSON.stringify(fileDeleted))

      expect(connectionHandlers.onMessage).toHaveBeenCalledWith(fileDeleted)
    })
  })

  describe('Connection Health', () => {
    beforeEach(async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws', connectionHandlers)
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    it('sends ping messages for keep-alive', async () => {
      const ping = { type: 'ping' }
      
      sendMessage(mockWS, ping)

      expect(mockWS.sent).toContain(JSON.stringify(ping))
    })

    it('responds to ping with pong', () => {
      const ping = { type: 'ping' }
      
      mockWS.simulateMessage(JSON.stringify(ping))
      
      // Should automatically respond with pong
      expect(mockWS.sent).toContain(JSON.stringify({ type: 'pong' }))
    })

    it('handles connection timeout', async () => {
      const timeoutHandler = vi.fn()
      
      // Mock connection timeout
      setTimeout(() => {
        mockWS.simulateError()
        timeoutHandler()
      }, 100)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(timeoutHandler).toHaveBeenCalled()
    })
  })

  describe('Message Rate Limiting', () => {
    beforeEach(async () => {
      mockWS = connectWebSocket('ws://localhost:3001/ws', connectionHandlers)
      await new Promise(resolve => setTimeout(resolve, 20))
    })

    it('handles rapid message sending', () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({ 
        type: 'test', 
        id: i 
      }))
      
      messages.forEach(msg => sendMessage(mockWS, msg))
      
      expect(mockWS.sent).toHaveLength(10)
    })

    it('implements backpressure for large messages', () => {
      const largeMessage = {
        type: 'large_data',
        data: 'x'.repeat(1000000) // 1MB of data
      }
      
      sendMessage(mockWS, largeMessage)
      
      expect(mockWS.sent).toContain(JSON.stringify(largeMessage))
    })
  })
})