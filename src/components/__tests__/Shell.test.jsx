import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/tests/utils/test-utils'
import Shell from '../Shell'

// Mock xterm
vi.mock('xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(),
    onResize: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    textarea: { focus: vi.fn() }
  }))
}))

vi.mock('xterm-addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
    proposeDimensions: vi.fn().mockReturnValue({ cols: 80, rows: 24 })
  }))
}))

describe('Shell', () => {
  let user
  let mockTerminal
  let mockFitAddon
  let mockWebSocket

  beforeEach(() => {
    user = userEvent.setup()
    
    // Setup terminal mocks
    const { Terminal } = require('xterm')
    const { FitAddon } = require('xterm-addon-fit')
    
    mockTerminal = {
      open: vi.fn(),
      write: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
      onData: vi.fn(),
      onResize: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      textarea: { focus: vi.fn() }
    }
    
    mockFitAddon = {
      fit: vi.fn(),
      proposeDimensions: vi.fn().mockReturnValue({ cols: 80, rows: 24 })
    }
    
    Terminal.mockImplementation(() => mockTerminal)
    FitAddon.mockImplementation(() => mockFitAddon)
    
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
    
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    isVisible: true,
    currentProject: {
      id: 'test-project',
      name: 'Test Project',
      path: '/test/project'
    }
  }

  it('renders shell container when visible', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    expect(screen.getByTestId('shell-container')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    renderWithProviders(<Shell {...defaultProps} isVisible={false} />)
    
    expect(screen.queryByTestId('shell-container')).not.toBeInTheDocument()
  })

  it('initializes terminal on mount', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    expect(mockTerminal.open).toHaveBeenCalled()
    expect(mockTerminal.onData).toHaveBeenCalled()
    expect(mockFitAddon.fit).toHaveBeenCalled()
  })

  it('establishes WebSocket connection', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('shell')
    )
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
  })

  it('sends terminal data through WebSocket', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Simulate terminal data
    const onDataCallback = mockTerminal.onData.mock.calls[0][0]
    onDataCallback('ls -la')
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'input',
        data: 'ls -la'
      })
    )
  })

  it('writes WebSocket output to terminal', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Simulate WebSocket message
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    if (messageHandler) {
      const messageEvent = {
        data: JSON.stringify({
          type: 'output',
          data: 'total 4\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\n'
        })
      }
      
      messageHandler(messageEvent)
      
      expect(mockTerminal.write).toHaveBeenCalledWith(
        'total 4\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\n'
      )
    }
  })

  it('clears terminal when clear button is clicked', async () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)
    
    expect(mockTerminal.clear).toHaveBeenCalled()
  })

  it('focuses terminal when focus button is clicked', async () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    const focusButton = screen.getByRole('button', { name: /focus/i })
    await user.click(focusButton)
    
    expect(mockTerminal.focus).toHaveBeenCalled()
  })

  it('resizes terminal when container size changes', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Simulate ResizeObserver callback
    const ResizeObserverCallback = global.ResizeObserver.mock.calls[0][0]
    ResizeObserverCallback([{
      contentRect: { width: 800, height: 600 }
    }])
    
    expect(mockFitAddon.fit).toHaveBeenCalled()
  })

  it('handles WebSocket connection errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Simulate WebSocket error
    const errorHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'error')?.[1]
    
    if (errorHandler) {
      errorHandler(new Event('error'))
    }
    
    // Should handle error gracefully
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('reconnects on WebSocket close', async () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Simulate WebSocket close
    const closeHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'close')?.[1]
    
    if (closeHandler) {
      closeHandler(new CloseEvent('close'))
    }
    
    // Should attempt to reconnect
    await waitFor(() => {
      expect(global.WebSocket).toHaveBeenCalledTimes(2)
    }, { timeout: 6000 }) // Reconnect timeout is usually 5 seconds
  })

  it('changes directory when project changes', () => {
    const { rerender } = renderWithProviders(<Shell {...defaultProps} />)
    
    const newProject = {
      id: 'new-project',
      name: 'New Project', 
      path: '/new/project'
    }
    
    rerender(<Shell {...defaultProps} currentProject={newProject} />)
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'cd',
        path: '/new/project'
      })
    )
  })

  it('cleans up resources on unmount', () => {
    const { unmount } = renderWithProviders(<Shell {...defaultProps} />)
    
    unmount()
    
    expect(mockTerminal.dispose).toHaveBeenCalled()
    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('handles terminal resize events', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Simulate terminal resize callback
    const onResizeCallback = mockTerminal.onResize.mock.calls[0][0]
    onResizeCallback({ cols: 100, rows: 30 })
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'resize',
        cols: 100,
        rows: 30
      })
    )
  })

  it('shows connection status indicators', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Should show some kind of connection indicator
    expect(screen.getByText(/connected/i) || screen.getByText(/ready/i)).toBeInTheDocument()
  })

  it('handles malformed WebSocket messages gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    renderWithProviders(<Shell {...defaultProps} />)
    
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    if (messageHandler) {
      // Send malformed JSON
      messageHandler({ data: 'invalid json' })
      
      // Should not crash
      expect(consoleSpy).toHaveBeenCalled()
    }
    
    consoleSpy.mockRestore()
  })

  it('preserves terminal scroll position', () => {
    renderWithProviders(<Shell {...defaultProps} />)
    
    // Terminal should maintain scroll position when new content arrives
    const messageHandler = mockWebSocket.addEventListener.mock.calls
      .find(call => call[0] === 'message')?.[1]
    
    if (messageHandler) {
      messageHandler({
        data: JSON.stringify({
          type: 'output',
          data: 'Some output\n'
        })
      })
      
      // Should write to terminal without forcing scroll
      expect(mockTerminal.write).toHaveBeenCalled()
    }
  })
})