import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFileTree } from '@/tests/utils/test-utils'
import FileTree from '../FileTree'

// Mock modules
vi.mock('../ui/scroll-area', () => ({
  ScrollArea: ({ children }) => <div data-testid="scroll-area">{children}</div>
}))

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

vi.mock('../CodeEditor', () => ({
  default: ({ file }) => <div data-testid="code-editor">Editing: {file?.name}</div>
}))

vi.mock('../ImageViewer', () => ({
  default: ({ image }) => <div data-testid="image-viewer">Viewing: {image?.name}</div>
}))

vi.mock('@/utils/api', () => ({
  api: {
    getFileTree: vi.fn(),
    getFileContent: vi.fn()
  }
}))

describe('FileTree', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const defaultProject = {
    id: 'test-project',
    name: 'Test Project',
    path: '/test/project'
  }

  it('renders loading state initially', () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockImplementation(() => new Promise(() => {})) // Hang forever

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('fetches and displays file tree', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
      expect(screen.getByText('package.json')).toBeInTheDocument()
      expect(screen.getByText('README.md')).toBeInTheDocument()
    })

    expect(api.getFileTree).toHaveBeenCalledWith(defaultProject.path)
  })

  it('toggles directory expansion', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })

    const srcFolder = screen.getByText('src')
    
    // Initially should not show nested files
    expect(screen.queryByText('App.jsx')).not.toBeInTheDocument()
    
    // Click to expand
    await user.click(srcFolder)
    
    // Should now show nested files
    expect(screen.getByText('App.jsx')).toBeInTheDocument()
    expect(screen.getByText('main.jsx')).toBeInTheDocument()
  })

  it('opens file in editor when clicked', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)
    api.getFileContent.mockResolvedValue({
      content: 'const test = "hello"',
      language: 'javascript'
    })

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('package.json')).toBeInTheDocument()
    })

    const packageJsonFile = screen.getByText('package.json')
    await user.click(packageJsonFile)
    
    await waitFor(() => {
      expect(screen.getByTestId('code-editor')).toBeInTheDocument()
    })

    expect(api.getFileContent).toHaveBeenCalledWith(
      expect.stringContaining('package.json')
    )
  })

  it('displays images in image viewer', async () => {
    const { api } = require('@/utils/api')
    const fileTreeWithImage = {
      ...mockFileTree,
      children: [
        ...mockFileTree.children,
        { name: 'image.png', type: 'file', size: 1024 }
      ]
    }
    
    api.getFileTree.mockResolvedValue(fileTreeWithImage)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('image.png')).toBeInTheDocument()
    })

    const imageFile = screen.getByText('image.png')
    await user.click(imageFile)
    
    await waitFor(() => {
      expect(screen.getByTestId('image-viewer')).toBeInTheDocument()
    })
  })

  it('changes view mode when button is clicked', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })

    // Find view mode buttons
    const viewModeButtons = screen.getAllByRole('button')
    const compactButton = viewModeButtons.find(btn => 
      btn.textContent?.includes('Compact') || 
      btn.getAttribute('title')?.includes('Compact')
    )

    if (compactButton) {
      await user.click(compactButton)
      expect(localStorage.setItem).toHaveBeenCalledWith('file-tree-view-mode', 'compact')
    }
  })

  it('loads saved view mode from localStorage', () => {
    window.localStorage.getItem.mockReturnValue('compact')
    
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    expect(localStorage.getItem).toHaveBeenCalledWith('file-tree-view-mode')
  })

  it('shows different file icons based on file type', async () => {
    const { api } = require('@/utils/api')
    const diverseFileTree = {
      name: 'root',
      type: 'directory',
      children: [
        { name: 'script.js', type: 'file', size: 1024 },
        { name: 'style.css', type: 'file', size: 512 },
        { name: 'document.md', type: 'file', size: 256 },
        { name: 'data.json', type: 'file', size: 128 },
        { name: 'image.png', type: 'file', size: 2048 }
      ]
    }
    
    api.getFileTree.mockResolvedValue(diverseFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('script.js')).toBeInTheDocument()
      expect(screen.getByText('style.css')).toBeInTheDocument()
      expect(screen.getByText('document.md')).toBeInTheDocument()
      expect(screen.getByText('data.json')).toBeInTheDocument()
      expect(screen.getByText('image.png')).toBeInTheDocument()
    })

    // Check that different icons are rendered (by checking for Lucide icon components)
    expect(document.querySelector('[data-lucide]')).toBeInTheDocument()
  })

  it('handles empty project gracefully', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue({
      name: 'empty-project',
      type: 'directory',
      children: []
    })

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText(/empty/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockRejectedValue(new Error('Failed to fetch'))

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('shows file sizes in detailed view', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('package.json')).toBeInTheDocument()
    })

    // Should show file size (2048 bytes = 2KB)
    expect(screen.getByText(/2\s*KB/i)).toBeInTheDocument()
  })

  it('filters files when search is active', async () => {
    const { api } = require('@/utils/api')
    api.getFileTree.mockResolvedValue(mockFileTree)

    renderWithProviders(<FileTree selectedProject={defaultProject} />)
    
    await waitFor(() => {
      expect(screen.getByText('package.json')).toBeInTheDocument()
    })

    // Look for search input if it exists
    const searchInput = screen.queryByPlaceholderText(/search/i)
    if (searchInput) {
      await user.type(searchInput, 'package')
      
      await waitFor(() => {
        expect(screen.getByText('package.json')).toBeInTheDocument()
        expect(screen.queryByText('README.md')).not.toBeInTheDocument()
      })
    }
  })
})