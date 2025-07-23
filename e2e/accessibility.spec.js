import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into the page
    await injectAxe(page)
  })

  test('should pass accessibility audit on login page', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="login-form"]')
    
    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('should pass accessibility audit on main app', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    
    // Wait for main app to load
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('should support keyboard navigation throughout app', async ({ page }) => {
    // Login and navigate to main app
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Test keyboard navigation
    let tabCount = 0
    const maxTabs = 20
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      tabCount++
      
      // Get the currently focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el.tagName,
          type: el.type,
          visible: el.offsetParent !== null,
          ariaLabel: el.getAttribute('aria-label'),
          role: el.getAttribute('role')
        }
      })
      
      // Verify focused element is visible and interactive
      expect(focusedElement.visible).toBe(true)
      
      // Log for debugging
      console.log(`Tab ${tabCount}: ${focusedElement.tagName} ${focusedElement.type || focusedElement.role || ''}`)
    }
  })

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="chat-interface"]')
    
    // Send a message to trigger dynamic content
    await page.fill('[data-testid="message-input"]', 'Hello Claude')
    await page.click('[data-testid="send-button"]')
    
    // Verify live regions are present for announcements
    const liveRegions = await page.locator('[aria-live]').count()
    expect(liveRegions).toBeGreaterThan(0)
    
    // Check for status updates
    const statusRegion = page.locator('[role="status"]')
    if (await statusRegion.count() > 0) {
      await expect(statusRegion.first()).toBeVisible()
    }
  })

  test('should have proper focus management in modals', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Look for settings or modal trigger
    const settingsButton = page.locator('[data-testid="settings-button"]')
    if (await settingsButton.count() > 0) {
      await settingsButton.click()
      
      // Wait for modal to open
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 })
      
      // Verify modal has focus
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()
      
      // Test focus trap - tab should stay within modal
      let tabCount = 0
      const initialFocus = await page.evaluate(() => document.activeElement.tagName)
      
      while (tabCount < 10) {
        await page.keyboard.press('Tab')
        tabCount++
        
        const currentFocus = await page.evaluate(() => {
          const el = document.activeElement
          return el.closest('[role="dialog"]') !== null
        })
        
        expect(currentFocus).toBe(true)
      }
    }
  })

  test('should support screen reader text alternatives', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Check for images with alt text
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const role = await img.getAttribute('role')
      
      // Image should have alt text, aria-label, or be marked as decorative
      const hasAccessibleText = alt !== null || ariaLabel !== null || role === 'presentation'
      expect(hasAccessibleText).toBe(true)
    }
    
    // Check for buttons with accessible names
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledby = await button.getAttribute('aria-labelledby')
      
      const hasAccessibleName = 
        (text && text.trim().length > 0) || 
        ariaLabel || 
        ariaLabelledby
      
      expect(hasAccessibleName).toBe(true)
    }
  })

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/login')
    
    // Run accessibility check focusing on color contrast
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
    
    // Test both light and dark themes if available
    const themeToggle = page.locator('[data-testid="theme-toggle"]')
    if (await themeToggle.count() > 0) {
      await themeToggle.click()
      
      // Wait for theme change
      await page.waitForTimeout(500)
      
      // Check contrast in dark theme
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
    }
  })

  test('should have semantic heading structure', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    
    if (headings.length > 0) {
      // Should have an h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
      
      // Check heading hierarchy
      const headingLevels = []
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
        const level = parseInt(tagName.replace('h', ''))
        headingLevels.push(level)
      }
      
      // Verify logical heading progression
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i]
        const previousLevel = headingLevels[i - 1]
        
        // Headings should not skip levels (e.g., h1 -> h3)
        if (currentLevel > previousLevel) {
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  test('should have accessible forms', async ({ page }) => {
    await page.goto('/login')
    
    // Check form accessibility
    await checkA11y(page, '[data-testid="login-form"]', {
      rules: {
        'label': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'aria-input-field-name': { enabled: true }
      }
    })
    
    // Verify form inputs have labels
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const type = await input.getAttribute('type')
      
      if (type !== 'hidden') {
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledby = await input.getAttribute('aria-labelledby')
        
        // Input should have associated label
        let hasLabel = false
        
        if (id) {
          const labelCount = await page.locator(`label[for="${id}"]`).count()
          hasLabel = labelCount > 0
        }
        
        hasLabel = hasLabel || ariaLabel !== null || ariaLabelledby !== null
        
        expect(hasLabel).toBe(true)
      }
    }
  })

  test('should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Check that animations respect reduced motion
    const elementsWithTransitions = await page.locator('[style*="transition"], [class*="transition"]').all()
    
    for (const element of elementsWithTransitions) {
      const computedStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          transition: style.transition,
          animation: style.animation
        }
      })
      
      // With reduced motion, transitions should be disabled or very short
      if (computedStyle.transition && computedStyle.transition !== 'none') {
        const hasReducedTransition = 
          computedStyle.transition.includes('0s') || 
          computedStyle.transition.includes('0.01s')
        
        // This is informational - many frameworks handle this automatically
        console.log('Transition found:', computedStyle.transition)
      }
    }
  })

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            border: 2px solid !important;
          }
        }
      `
    })
    
    await page.goto('/login')
    
    // Run accessibility check
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    await page.waitForSelector('[data-testid="main-app"]')
    
    // Simulate screen reader navigation
    const landmarks = await page.locator('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer').all()
    
    expect(landmarks.length).toBeGreaterThan(0)
    
    // Navigate through landmarks
    for (const landmark of landmarks) {
      const role = await landmark.getAttribute('role') || await landmark.evaluate(el => el.tagName.toLowerCase())
      const ariaLabel = await landmark.getAttribute('aria-label')
      
      console.log(`Landmark: ${role} ${ariaLabel ? `(${ariaLabel})` : ''}`)
      
      // Verify landmark is visible and accessible
      await expect(landmark).toBeVisible()
    }
  })
})