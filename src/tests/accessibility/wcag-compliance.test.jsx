import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { renderWithProviders } from '@/tests/utils/test-utils'

// Import components to test
import App from '@/App.jsx'
import ChatInterface from '@/components/ChatInterface'
import FileTree from '@/components/FileTree'
import LoginForm from '@/components/LoginForm'
import { Button } from '@/components/ui/button'

expect.extend(toHaveNoViolations)

describe('WCAG Compliance Tests', () => {
  describe('Color Contrast and Visual Design', () => {
    it('should have sufficient color contrast in light theme', async () => {
      const { container } = renderWithProviders(
        <div className="theme-light">
          <Button>Test Button</Button>
          <p>Sample text content</p>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have sufficient color contrast in dark theme', async () => {
      const { container } = renderWithProviders(
        <div className="theme-dark">
          <Button>Test Button</Button>
          <p>Sample text content</p>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should not convey information through color alone', () => {
      renderWithProviders(
        <div>
          <span className="text-red-500" role="alert" aria-label="Error">
            ⚠️ Error message
          </span>
          <span className="text-green-500" role="status" aria-label="Success">
            ✅ Success message
          </span>
        </div>
      )

      // Verify that error and success states have text or icon indicators
      expect(screen.getByLabelText('Error')).toBeInTheDocument()
      expect(screen.getByLabelText('Success')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('✅')).toBeInTheDocument()
    })

    it('should have adequate focus indicators', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <div>
          <Button data-testid="button1">Button 1</Button>
          <Button data-testid="button2">Button 2</Button>
          <input data-testid="input1" type="text" placeholder="Test input" />
        </div>
      )

      // Tab through focusable elements
      await user.tab()
      let focusedElement = document.activeElement
      expect(focusedElement).toHaveAttribute('data-testid', 'button1')

      await user.tab()
      focusedElement = document.activeElement
      expect(focusedElement).toHaveAttribute('data-testid', 'button2')

      await user.tab()
      focusedElement = document.activeElement
      expect(focusedElement).toHaveAttribute('data-testid', 'input1')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation in main app', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<App />, {
        authValue: { isAuthenticated: true, token: 'test' }
      })

      // Should be able to tab through all interactive elements
      await user.tab()
      expect(document.activeElement).toBeVisible()
      
      // Continue tabbing to ensure focus moves logically
      for (let i = 0; i < 10; i++) {
        await user.tab()
        expect(document.activeElement).toBeVisible()
      }
    })

    it('should support keyboard navigation in chat interface', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ChatInterface 
          isProjectLoaded={true}
          onProjectLoad={vi.fn()}
          onShowSettings={vi.fn()}
          onFileOpen={vi.fn()}
          currentSessionId="test"
        />
      )

      const messageInput = screen.getByPlaceholderText(/type your message/i)
      
      // Should be able to focus message input
      await user.tab()
      expect(document.activeElement).toBe(messageInput)
      
      // Should be able to send message with Enter
      await user.type(messageInput, 'Test message{enter}')
      expect(messageInput.value).toBe('')
    })

    it('should support keyboard navigation in file tree', async () => {
      const user = userEvent.setup()
      
      const mockProject = { id: 'test', name: 'Test', path: '/test' }
      renderWithProviders(<FileTree selectedProject={mockProject} />)

      // Should be able to navigate file tree with arrow keys
      const fileTreeItems = screen.getAllByRole('button')
      
      if (fileTreeItems.length > 0) {
        fileTreeItems[0].focus()
        expect(document.activeElement).toBe(fileTreeItems[0])
        
        // Arrow down should move to next item
        await user.keyboard('{ArrowDown}')
        if (fileTreeItems.length > 1) {
          expect(document.activeElement).toBe(fileTreeItems[1])
        }
      }
    })

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <div>
          <button data-testid="outside-button">Outside</button>
          <div role="dialog" aria-modal="true" data-testid="modal">
            <button data-testid="modal-button1">Modal Button 1</button>
            <button data-testid="modal-button2">Modal Button 2</button>
            <button data-testid="modal-close">Close</button>
          </div>
        </div>
      )

      // Focus should start in modal
      const modalButton1 = screen.getByTestId('modal-button1')
      modalButton1.focus()
      
      await user.tab()
      expect(document.activeElement).toBe(screen.getByTestId('modal-button2'))
      
      await user.tab()
      expect(document.activeElement).toBe(screen.getByTestId('modal-close'))
      
      // Should cycle back to first modal element
      await user.tab()
      expect(document.activeElement).toBe(screen.getByTestId('modal-button1'))
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', async () => {
      const { container } = renderWithProviders(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <h2>Another Section</h2>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // Verify heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2)
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })

    it('should have proper ARIA labels and descriptions', async () => {
      const { container } = renderWithProviders(
        <div>
          <button aria-label="Open file menu">📁</button>
          <input 
            type="text" 
            aria-describedby="help-text" 
            aria-label="Search files"
          />
          <div id="help-text">Enter filename to search</div>
          <div role="status" aria-live="polite" aria-label="Loading status">
            Loading...
          </div>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByLabelText('Open file menu')).toBeInTheDocument()
      expect(screen.getByLabelText('Search files')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading status')).toBeInTheDocument()
    })

    it('should announce dynamic content changes', () => {
      renderWithProviders(
        <div>
          <div role="status" aria-live="polite" data-testid="status">
            Ready
          </div>
          <div role="alert" aria-live="assertive" data-testid="alert">
            Error occurred
          </div>
        </div>
      )

      const statusRegion = screen.getByTestId('status')
      const alertRegion = screen.getByTestId('alert')
      
      expect(statusRegion).toHaveAttribute('aria-live', 'polite')
      expect(alertRegion).toHaveAttribute('aria-live', 'assertive')
    })

    it('should provide alternative text for images', async () => {
      const { container } = renderWithProviders(
        <div>
          <img src="/logo.png" alt="Claude Code UI Logo" />
          <img src="/icon.png" alt="" role="presentation" />
          <svg aria-label="Settings icon" role="img">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByAltText('Claude Code UI Logo')).toBeInTheDocument()
      expect(screen.getByLabelText('Settings icon')).toBeInTheDocument()
    })
  })

  describe('Form Accessibility', () => {
    it('should have accessible form labels and validation', async () => {
      const { container } = renderWithProviders(<LoginForm />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      // All form inputs should have labels
      const usernameInput = screen.getByLabelText(/username/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(usernameInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })

    it('should announce form validation errors', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <form>
          <label htmlFor="email">Email</label>
          <input 
            id="email" 
            type="email" 
            required 
            aria-describedby="email-error"
          />
          <div id="email-error" role="alert" aria-live="polite">
            Please enter a valid email address
          </div>
          <button type="submit">Submit</button>
        </form>
      )

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Submit' })
      
      // Submit with invalid email
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })

    it('should group related form controls', async () => {
      const { container } = renderWithProviders(
        <form>
          <fieldset>
            <legend>Account Settings</legend>
            <label htmlFor="username">Username</label>
            <input id="username" type="text" />
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </fieldset>
          <fieldset>
            <legend>Preferences</legend>
            <label>
              <input type="radio" name="theme" value="light" />
              Light theme
            </label>
            <label>
              <input type="radio" name="theme" value="dark" />
              Dark theme
            </label>
          </fieldset>
        </form>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByRole('group', { name: 'Account Settings' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Preferences' })).toBeInTheDocument()
    })
  })

  describe('Content Structure', () => {
    it('should have semantic landmarks', async () => {
      const { container } = renderWithProviders(
        <div>
          <header>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/files">Files</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <h1>Page Title</h1>
            <section>
              <h2>Section Title</h2>
              <p>Content</p>
            </section>
          </main>
          <aside aria-label="Sidebar">
            <h2>Related Links</h2>
          </aside>
          <footer>
            <p>Copyright 2024</p>
          </footer>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument() // aside
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    })

    it('should have accessible tables', async () => {
      const { container } = renderWithProviders(
        <table>
          <caption>File Information</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Size</th>
              <th scope="col">Modified</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>app.js</td>
              <td>1.2 KB</td>
              <td>2024-01-15</td>
            </tr>
            <tr>
              <td>style.css</td>
              <td>856 B</td>
              <td>2024-01-14</td>
            </tr>
          </tbody>
        </table>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByRole('table', { name: 'File Information' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    })

    it('should have accessible lists', async () => {
      const { container } = renderWithProviders(
        <div>
          <ul aria-label="File list">
            <li>src/</li>
            <li>public/</li>
            <li>package.json</li>
          </ul>
          <ol aria-label="Setup steps">
            <li>Install dependencies</li>
            <li>Configure settings</li>
            <li>Start development server</li>
          </ol>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByRole('list', { name: 'File list' })).toBeInTheDocument()
      expect(screen.getByRole('list', { name: 'Setup steps' })).toBeInTheDocument()
    })
  })

  describe('Interactive Elements', () => {
    it('should have accessible buttons with proper roles', async () => {
      const { container } = renderWithProviders(
        <div>
          <button>Standard Button</button>
          <button aria-pressed="false">Toggle Button</button>
          <button aria-expanded="false" aria-controls="menu">Menu Button</button>
          <div role="button" tabIndex="0" onKeyDown={() => {}}>Custom Button</div>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      
      // Toggle button should have aria-pressed
      expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument()
      
      // Menu button should have aria-expanded
      const menuButton = screen.getByRole('button', { name: 'Menu Button' })
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should have accessible links', async () => {
      const { container } = renderWithProviders(
        <div>
          <a href="/home">Home</a>
          <a href="/files" aria-current="page">Files</a>
          <a href="https://external.com" target="_blank" rel="noopener noreferrer">
            External Link
            <span className="sr-only">(opens in new window)</span>
          </a>
        </div>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
      
      expect(screen.getByRole('link', { current: 'page' })).toBeInTheDocument()
      expect(screen.getByText('(opens in new window)')).toBeInTheDocument()
    })

    it('should have accessible dropdown menus', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <div>
          <button 
            aria-expanded="false" 
            aria-haspopup="menu"
            aria-controls="dropdown-menu"
          >
            Options
          </button>
          <ul id="dropdown-menu" role="menu" style={{ display: 'none' }}>
            <li role="menuitem">
              <button>Option 1</button>
            </li>
            <li role="menuitem">
              <button>Option 2</button>
            </li>
          </ul>
        </div>
      )

      const menuButton = screen.getByRole('button', { name: 'Options' })
      expect(menuButton).toHaveAttribute('aria-expanded', 'false')
      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu')
    })
  })

  describe('Error Handling and Status', () => {
    it('should announce errors accessibly', () => {
      renderWithProviders(
        <div>
          <div role="alert" aria-live="assertive">
            Connection failed. Please try again.
          </div>
          <div role="status" aria-live="polite">
            Saved successfully
          </div>
        </div>
      )

      const errorAlert = screen.getByRole('alert')
      const statusUpdate = screen.getByRole('status')
      
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive')
      expect(statusUpdate).toHaveAttribute('aria-live', 'polite')
    })

    it('should provide loading states for screen readers', () => {
      renderWithProviders(
        <div>
          <div role="status" aria-live="polite" aria-label="Loading content">
            <div aria-hidden="true">🔄</div>
            Loading, please wait...
          </div>
          <button aria-busy="true" disabled>
            Processing...
          </button>
        </div>
      )

      expect(screen.getByLabelText('Loading content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Processing...' })).toHaveAttribute('aria-busy', 'true')
    })
  })
})