import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Custom render function with providers
export function renderWithProviders(ui, options = {}) {
  const {
    initialEntries = ['/'],
    authValue = { 
      isAuthenticated: true, 
      token: 'test-token', 
      login: vi.fn(), 
      logout: vi.fn() 
    },
    themeValue = { 
      theme: 'light', 
      toggleTheme: vi.fn() 
    },
    ...renderOptions
  } = options

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider value={authValue}>
          <ThemeProvider value={themeValue}>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock WebSocket for tests
export function createMockWebSocket() {
  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1,
    OPEN: 1,
    CLOSED: 3,
  }
  
  return mockWS
}

// Mock file tree data
export const mockFileTree = {
  name: 'test-project',
  type: 'directory',
  children: [
    {
      name: 'src',
      type: 'directory',
      children: [
        { name: 'App.jsx', type: 'file', size: 1024 },
        { name: 'main.jsx', type: 'file', size: 512 },
        {
          name: 'components',
          type: 'directory',
          children: [
            { name: 'Button.jsx', type: 'file', size: 256 }
          ]
        }
      ]
    },
    { name: 'package.json', type: 'file', size: 2048 },
    { name: 'README.md', type: 'file', size: 1536 }
  ]
}

// Mock git status data
export const mockGitStatus = {
  branch: 'main',
  staged: ['src/App.jsx'],
  unstaged: ['src/components/Button.jsx'],
  untracked: ['new-file.js']
}

// Mock analytics data
export const mockAnalyticsData = {
  totalCommands: 150,
  averageResponseTime: 1200,
  errorRate: 0.02,
  activeUsers: 5,
  recentActivity: [
    {
      id: 1,
      command: '/analyze',
      timestamp: Date.now() - 60000,
      duration: 1500,
      success: true
    },
    {
      id: 2,
      command: '/build',
      timestamp: Date.now() - 120000,
      duration: 3000,
      success: true
    }
  ]
}

// Wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Create mock API response
export function createMockResponse(data, options = {}) {
  return {
    ok: options.status !== 'error',
    status: options.status === 'error' ? 500 : 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  }
}

// Mock intersection observer entries
export function createMockIntersectionObserverEntry(isIntersecting = true) {
  return {
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: { top: 0, bottom: 100, left: 0, right: 100 },
    intersectionRect: isIntersecting ? { top: 0, bottom: 100, left: 0, right: 100 } : {},
    rootBounds: { top: 0, bottom: 1000, left: 0, right: 1000 },
    target: document.createElement('div'),
    time: Date.now()
  }
}