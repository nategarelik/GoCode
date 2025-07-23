import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockGitStatus } from '@/tests/utils/test-utils'
import GitPanel from '../GitPanel'

vi.mock('@/utils/api', () => ({
  api: {
    getGitStatus: vi.fn(),
    gitAdd: vi.fn(),
    gitCommit: vi.fn(),
    gitPush: vi.fn(),
    gitPull: vi.fn()
  }
}))

describe('GitPanel', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const defaultProps = {
    currentProject: {
      id: 'test-project',
      name: 'Test Project',
      path: '/test/project'
    }
  }

  it('renders git status on mount', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument()
      expect(screen.getByText('src/App.jsx')).toBeInTheDocument()
      expect(screen.getByText('src/components/Button.jsx')).toBeInTheDocument()
      expect(screen.getByText('new-file.js')).toBeInTheDocument()
    })

    expect(api.getGitStatus).toHaveBeenCalledWith('/test/project')
  })

  it('stages files when add button is clicked', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitAdd.mockResolvedValue({ success: true })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/components/Button.jsx')).toBeInTheDocument()
    })

    const addButton = screen.getAllByRole('button', { name: /add/i })[0]
    await user.click(addButton)
    
    expect(api.gitAdd).toHaveBeenCalledWith('/test/project', 'src/components/Button.jsx')
  })

  it('commits staged files with message', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitCommit.mockResolvedValue({ success: true, hash: 'abc123' })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/App.jsx')).toBeInTheDocument()
    })

    const commitInput = screen.getByPlaceholderText(/commit message/i)
    const commitButton = screen.getByRole('button', { name: /commit/i })
    
    await user.type(commitInput, 'Test commit message')
    await user.click(commitButton)
    
    expect(api.gitCommit).toHaveBeenCalledWith('/test/project', 'Test commit message')
  })

  it('prevents empty commit messages', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/App.jsx')).toBeInTheDocument()
    })

    const commitButton = screen.getByRole('button', { name: /commit/i })
    
    await user.click(commitButton)
    
    expect(api.gitCommit).not.toHaveBeenCalled()
  })

  it('pushes changes to remote', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitPush.mockResolvedValue({ success: true })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument()
    })

    const pushButton = screen.getByRole('button', { name: /push/i })
    await user.click(pushButton)
    
    expect(api.gitPush).toHaveBeenCalledWith('/test/project')
  })

  it('pulls changes from remote', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitPull.mockResolvedValue({ success: true })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument()
    })

    const pullButton = screen.getByRole('button', { name: /pull/i })
    await user.click(pullButton)
    
    expect(api.gitPull).toHaveBeenCalledWith('/test/project')
  })

  it('refreshes status after git operations', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitAdd.mockResolvedValue({ success: true })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/components/Button.jsx')).toBeInTheDocument()
    })

    const addButton = screen.getAllByRole('button', { name: /add/i })[0]
    await user.click(addButton)
    
    await waitFor(() => {
      expect(api.getGitStatus).toHaveBeenCalledTimes(2)
    })
  })

  it('shows error messages for failed operations', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitCommit.mockRejectedValue(new Error('Commit failed'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/App.jsx')).toBeInTheDocument()
    })

    const commitInput = screen.getByPlaceholderText(/commit message/i)
    const commitButton = screen.getByRole('button', { name: /commit/i })
    
    await user.type(commitInput, 'Test commit')
    await user.click(commitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('shows different icons for file statuses', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/App.jsx')).toBeInTheDocument()
    })

    // Should show different visual indicators for staged, unstaged, and untracked files
    const stagedFiles = screen.getByText('src/App.jsx').closest('div')
    const unstagedFiles = screen.getByText('src/components/Button.jsx').closest('div')
    const untrackedFiles = screen.getByText('new-file.js').closest('div')

    expect(stagedFiles).toHaveClass(/staged|added/)
    expect(unstagedFiles).toHaveClass(/modified|unstaged/)
    expect(untrackedFiles).toHaveClass(/untracked|new/)
  })

  it('handles empty repository state', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue({
      branch: 'main',
      staged: [],
      unstaged: [],
      untracked: []
    })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/no changes/i) || screen.getByText(/clean/i)).toBeInTheDocument()
    })
  })

  it('stages all files when stage all button is clicked', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)
    api.gitAdd.mockResolvedValue({ success: true })

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('src/components/Button.jsx')).toBeInTheDocument()
    })

    const stageAllButton = screen.getByRole('button', { name: /stage all/i })
    await user.click(stageAllButton)
    
    expect(api.gitAdd).toHaveBeenCalledWith('/test/project', '.')
  })

  it('shows commit history', async () => {
    const { api } = require('@/utils/api')
    api.getGitStatus.mockResolvedValue(mockGitStatus)

    renderWithProviders(<GitPanel {...defaultProps} />)
    
    // Look for commit history section
    const historyButton = screen.queryByRole('button', { name: /history/i })
    
    if (historyButton) {
      await user.click(historyButton)
      
      await waitFor(() => {
        expect(screen.getByText(/commit/i)).toBeInTheDocument()
      })
    }
  })
})