import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/tests/utils/test-utils'
import ChatInterface from '../ChatInterface'

// Mock modules
vi.mock('../TodoList', () => ({
  default: () => <div data-testid="todo-list">Todo List</div>
}))

vi.mock('../ClaudeLogo.jsx', () => ({
  default: () => <div data-testid="claude-logo">Claude Logo</div>
}))

vi.mock('../ClaudeStatus', () => ({
  default: () => <div data-testid="claude-status">Claude Status</div>
}))

vi.mock('../MicButton.jsx', () => ({
  MicButton: ({ onTranscription }) => (
    <button 
      data-testid="mic-button" 
      onClick={() => onTranscription('test transcription')}
    >
      Mic
    </button>
  )
}))

vi.mock('@/utils/api', () => ({
  api: {
    sendClaudeMessage: vi.fn(),
    uploadFile: vi.fn()
  }
}))

describe('ChatInterface', () => {
  let mockWebSocket
  let user

  beforeEach(() => {
    user = userEvent.setup()
    
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 1,
      OPEN: 1
    }
    
    global.WebSocket = vi.fn(() => mockWebSocket)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    isProjectLoaded: true,
    onProjectLoad: vi.fn(),
    onShowSettings: vi.fn(),
    onFileOpen: vi.fn(),
    currentSessionId: 'test-session-id'
  }

  it('renders chat interface with all components', () => {
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    expect(screen.getByTestId('claude-logo')).toBeInTheDocument()
    expect(screen.getByTestId('claude-status')).toBeInTheDocument()
    expect(screen.getByTestId('todo-list')).toBeInTheDocument()
    expect(screen.getByTestId('mic-button')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('sends message when form is submitted', async () => {
    const { api } = await import('@/utils/api')
    api.sendClaudeMessage.mockResolvedValue({ success: true })

    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(input, 'Hello Claude')
    await user.click(sendButton)
    
    expect(api.sendClaudeMessage).toHaveBeenCalledWith(
      'Hello Claude',
      undefined,
      'test-session-id'
    )
  })

  it('sends message with Enter key', async () => {
    const { api } = await import('@/utils/api')
    api.sendClaudeMessage.mockResolvedValue({ success: true })

    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/type your message/i)
    
    await user.type(input, 'Hello Claude{enter}')
    
    expect(api.sendClaudeMessage).toHaveBeenCalledWith(
      'Hello Claude',
      undefined,
      'test-session-id'
    )
  })

  it('prevents sending empty messages', async () => {
    const { api } = await import('@/utils/api')
    
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.click(sendButton)
    
    expect(api.sendClaudeMessage).not.toHaveBeenCalled()
  })

  it('clears input after sending message', async () => {
    const { api } = await import('@/utils/api')
    api.sendClaudeMessage.mockResolvedValue({ success: true })

    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/type your message/i)
    
    await user.type(input, 'Test message')
    await user.type(input, '{enter}')
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('handles mic transcription', async () => {
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const micButton = screen.getByTestId('mic-button')
    const input = screen.getByPlaceholderText(/type your message/i)
    
    await user.click(micButton)
    
    expect(input.value).toBe('test transcription')
  })

  it('displays messages correctly', () => {
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    // Simulate receiving a message via WebSocket
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'message',
        content: 'Hello from Claude!',
        role: 'assistant'
      })
    })
    
    // Find the WebSocket addEventListener call for 'message'
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    if (messageHandler) {
      messageHandler(messageEvent)
    }
    
    expect(screen.getByText('Hello from Claude!')).toBeInTheDocument()
  })

  it('handles file uploads', async () => {
    const { api } = await import('@/utils/api')
    api.uploadFile.mockResolvedValue({ success: true, url: '/uploads/test.txt' })

    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const dropzone = screen.getByText(/drop files here/i).closest('[data-testid]') || 
                    document.querySelector('[data-rfd-drag-handle-draggable-id]') ||
                    screen.getByPlaceholderText(/type your message/i).closest('div')
    
    if (dropzone) {
      const dropEvent = new DragEvent('drop', {
        dataTransfer: {
          files: [file],
          items: [{ kind: 'file', type: 'text/plain', getAsFile: () => file }],
          types: ['Files']
        }
      })
      
      fireEvent(dropzone, dropEvent)
      
      await waitFor(() => {
        expect(api.uploadFile).toHaveBeenCalledWith(file)
      })
    }
  })

  it('shows loading state when sending message', async () => {
    const { api } = await import('@/utils/api')
    // Make API call hang to test loading state
    api.sendClaudeMessage.mockImplementation(() => new Promise(() => {}))

    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(input, 'Test message')
    await user.click(sendButton)
    
    expect(sendButton).toBeDisabled()
  })

  it('handles WebSocket connection states', () => {
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    // Test connection open
    const openHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'open')?.[1]
    
    if (openHandler) {
      openHandler(new Event('open'))
    }
    
    // Test connection close
    const closeHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'close')?.[1]
    
    if (closeHandler) {
      closeHandler(new CloseEvent('close'))
    }
    
    // Test connection error
    const errorHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'error')?.[1]
    
    if (errorHandler) {
      errorHandler(new Event('error'))
    }
    
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('handles tool use messages correctly', () => {
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const toolUseEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'tool-use',
        content: 'Using file tool',
        tool: 'file-read',
        parameters: { path: '/test/file.js' }
      })
    })
    
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    if (messageHandler) {
      messageHandler(toolUseEvent)
    }
    
    expect(screen.getByText(/using file tool/i)).toBeInTheDocument()
  })

  it('scrolls to bottom on new messages', () => {
    const scrollIntoViewMock = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoViewMock

    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'message',
        content: 'New message',
        role: 'assistant'
      })
    })
    
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    if (messageHandler) {
      messageHandler(messageEvent)
    }
    
    // Should attempt to scroll
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })

  it('handles project not loaded state', () => {
    renderWithProviders(
      <ChatInterface 
        {...defaultProps} 
        isProjectLoaded={false} 
      />
    )
    
    expect(screen.getByText(/no project loaded/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load project/i })).toBeInTheDocument()
  })

  it('calls onProjectLoad when load project button is clicked', async () => {
    const onProjectLoad = vi.fn()
    
    renderWithProviders(
      <ChatInterface 
        {...defaultProps} 
        isProjectLoaded={false}
        onProjectLoad={onProjectLoad}
      />
    )
    
    const loadButton = screen.getByRole('button', { name: /load project/i })
    await user.click(loadButton)
    
    expect(onProjectLoad).toHaveBeenCalled()
  })
})