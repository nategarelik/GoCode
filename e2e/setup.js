import { test as base, expect } from '@playwright/test'
import path from 'path'

// Extend the base test with custom fixtures
export const test = base.extend({
  // Auto-authenticate user for tests that need authentication
  authenticatedPage: async ({ page }, use) => {
    // Setup admin user if needed
    await setupTestUser()
    
    // Navigate to login page
    await page.goto('/login')
    
    // Fill login form
    await page.fill('[data-testid="username-input"]', 'testuser')
    await page.fill('[data-testid="password-input"]', 'testpass')
    await page.click('[data-testid="login-button"]')
    
    // Wait for successful login
    await page.waitForURL('/')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    await use(page)
  },

  // Project with test files loaded
  projectPage: async ({ authenticatedPage }, use) => {
    // Create test project
    const testProject = await createTestProject()
    
    // Navigate to project
    await authenticatedPage.goto('/')
    await authenticatedPage.click('[data-testid="load-project-button"]')
    await authenticatedPage.fill('[data-testid="project-path-input"]', testProject.path)
    await authenticatedPage.click('[data-testid="load-project-confirm"]')
    
    // Wait for project to load
    await expect(authenticatedPage.locator('[data-testid="file-tree"]')).toBeVisible()
    
    await use(authenticatedPage)
    
    // Cleanup
    await cleanupTestProject(testProject)
  }
})

export { expect }

// Helper functions
async function setupTestUser() {
  // This would typically make an API call to create a test user
  // For now, we assume the user exists in the test database
  console.log('Setting up test user...')
}

async function createTestProject() {
  const testProjectPath = path.join(process.cwd(), 'test-fixtures', 'sample-project')
  
  // Create minimal test project structure
  const project = {
    id: 'test-project-' + Date.now(),
    name: 'Test Project',
    path: testProjectPath
  }
  
  // This would create actual test files
  console.log('Creating test project:', project.path)
  
  return project
}

async function cleanupTestProject(project) {
  // Cleanup test project files
  console.log('Cleaning up test project:', project.path)
}