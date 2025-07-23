import { test, expect } from './setup.js'

test.describe('Authentication Flow', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to main app
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="main-app"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form with invalid credentials
    await page.fill('[data-testid="username-input"]', 'wronguser')
    await page.fill('[data-testid="password-input"]', 'wrongpass')
    
    // Submit form
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should logout successfully', async ({ authenticatedPage }) => {
    // Should be on main page
    await expect(authenticatedPage).toHaveURL('/')
    await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Click user menu
    await authenticatedPage.click('[data-testid="user-menu"]')
    
    // Click logout
    await authenticatedPage.click('[data-testid="logout-button"]')
    
    // Should redirect to login page
    await expect(authenticatedPage).toHaveURL('/login')
    await expect(authenticatedPage.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should persist login across page refresh', async ({ authenticatedPage }) => {
    // Should be logged in
    await expect(authenticatedPage).toHaveURL('/')
    await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Refresh page
    await authenticatedPage.reload()
    
    // Should still be logged in
    await expect(authenticatedPage).toHaveURL('/')
    await expect(authenticatedPage.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show setup form for first-time users', async ({ page }) => {
    // Navigate to setup endpoint (simulating first-time user)
    await page.goto('/setup')
    
    await expect(page.locator('[data-testid="setup-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible()
  })

  test('should complete first-time setup', async ({ page }) => {
    await page.goto('/setup')
    
    // Fill setup form
    await page.fill('[data-testid="username-input"]', 'newuser')
    await page.fill('[data-testid="password-input"]', 'newpass123')
    await page.fill('[data-testid="confirm-password-input"]', 'newpass123')
    
    // Submit setup
    await page.click('[data-testid="setup-button"]')
    
    // Should redirect to main app or login
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should validate password requirements in setup', async ({ page }) => {
    await page.goto('/setup')
    
    // Try weak password
    await page.fill('[data-testid="username-input"]', 'newuser')
    await page.fill('[data-testid="password-input"]', '123')
    await page.fill('[data-testid="confirm-password-input"]', '123')
    
    await page.click('[data-testid="setup-button"]')
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Password must be')
  })

  test('should validate password confirmation in setup', async ({ page }) => {
    await page.goto('/setup')
    
    // Mismatched passwords
    await page.fill('[data-testid="username-input"]', 'newuser')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="confirm-password-input"]', 'different123')
    
    await page.click('[data-testid="setup-button"]')
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Passwords do not match')
  })
})