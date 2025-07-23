import { test, expect } from './setup.js'

test.describe('File Management', () => {
  test('should display file tree when project is loaded', async ({ projectPage }) => {
    await expect(projectPage.locator('[data-testid="file-tree"]')).toBeVisible()
    await expect(projectPage.locator('[data-testid="file-tree-item"]').first()).toBeVisible()
  })

  test('should expand and collapse directories', async ({ projectPage }) => {
    const srcFolder = projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'src' })
    
    // Initially, nested files might not be visible
    const nestedFilesBefore = await projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'App.jsx' }).count()
    
    // Click to expand
    await srcFolder.click()
    
    // Nested files should now be visible
    await expect(projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'App.jsx' })).toBeVisible()
    
    // Click again to collapse
    await srcFolder.click()
    
    // Nested files should be hidden again
    await expect(projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'App.jsx' })).not.toBeVisible()
  })

  test('should open file in editor when clicked', async ({ projectPage }) => {
    // Expand src folder if needed
    const srcFolder = projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'src' })
    await srcFolder.click()
    
    // Click on a file
    const appFile = projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'App.jsx' })
    await appFile.click()
    
    // Code editor should open
    await expect(projectPage.locator('[data-testid="code-editor"]')).toBeVisible()
    
    // File content should be displayed
    await expect(projectPage.locator('[data-testid="editor-content"]')).toBeVisible()
    
    // File name should be shown in tab or header
    await expect(projectPage.locator('[data-testid="file-tab"]', { hasText: 'App.jsx' })).toBeVisible()
  })

  test('should switch between view modes', async ({ projectPage }) => {
    // Find view mode toggle buttons
    const detailedViewButton = projectPage.locator('[data-testid="view-mode-detailed"]')
    const compactViewButton = projectPage.locator('[data-testid="view-mode-compact"]')
    
    // Start with detailed view
    await detailedViewButton.click()
    
    // Should show file sizes
    await expect(projectPage.locator('[data-testid="file-size"]').first()).toBeVisible()
    
    // Switch to compact view
    await compactViewButton.click()
    
    // File sizes should be hidden or less prominent
    const fileSizeCount = await projectPage.locator('[data-testid="file-size"]').count()
    expect(fileSizeCount).toBeLessThan(3) // Assuming we have more than 3 files
  })

  test('should show file icons based on file type', async ({ projectPage }) => {
    // Should show different icons for different file types
    const jsIcon = projectPage.locator('[data-testid="file-icon-js"]')
    const cssIcon = projectPage.locator('[data-testid="file-icon-css"]')
    const mdIcon = projectPage.locator('[data-testid="file-icon-md"]')
    const folderIcon = projectPage.locator('[data-testid="folder-icon"]')
    
    // At least folder icons should be visible
    await expect(folderIcon.first()).toBeVisible()
    
    // If we have JS files, their icons should be visible
    const jsFileCount = await projectPage.locator('[data-testid="file-tree-item"]', { hasText: '.js' }).count()
    if (jsFileCount > 0) {
      await expect(jsIcon.first()).toBeVisible()
    }
  })

  test('should handle large directory structures', async ({ projectPage }) => {
    // Should handle virtualization or pagination for large file trees
    const fileItems = projectPage.locator('[data-testid="file-tree-item"]')
    
    // Should render efficiently even with many files
    const fileCount = await fileItems.count()
    expect(fileCount).toBeGreaterThan(0)
    
    // Should be scrollable if needed
    const fileTree = projectPage.locator('[data-testid="file-tree"]')
    await expect(fileTree).toBeVisible()
  })

  test('should save file changes', async ({ projectPage }) => {
    // Open a file
    const srcFolder = projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'src' })
    await srcFolder.click()
    
    const appFile = projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'App.jsx' })
    await appFile.click()
    
    // Wait for editor to load
    await expect(projectPage.locator('[data-testid="code-editor"]')).toBeVisible()
    
    // Modify file content
    const editor = projectPage.locator('[data-testid="editor-content"]')
    await editor.click()
    await projectPage.keyboard.press('Control+A')
    await projectPage.keyboard.type('// Modified content\nexport default function App() {\n  return <div>Modified</div>\n}')
    
    // Save file
    await projectPage.keyboard.press('Control+S')
    
    // Should show saved indicator
    await expect(projectPage.locator('[data-testid="save-indicator"]')).toBeVisible()
    
    // File should be marked as modified in file tree (if applicable)
    await expect(projectPage.locator('[data-testid="file-modified-indicator"]')).toBeVisible()
  })

  test('should show file search and filtering', async ({ projectPage }) => {
    // Look for search input
    const searchInput = projectPage.locator('[data-testid="file-search"]')
    
    if (await searchInput.isVisible()) {
      // Type search term
      await searchInput.fill('package')
      
      // Should filter files
      await expect(projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'package.json' })).toBeVisible()
      
      // Other files should be hidden or marked as filtered
      const visibleFiles = await projectPage.locator('[data-testid="file-tree-item"]:visible').count()
      expect(visibleFiles).toBeLessThan(5) // Assuming we have more than 5 total files
      
      // Clear search
      await searchInput.fill('')
      
      // All files should be visible again
      await expect(projectPage.locator('[data-testid="file-tree-item"]').first()).toBeVisible()
    }
  })

  test('should handle image files', async ({ projectPage }) => {
    // If we have image files, test image viewer
    const imageFile = projectPage.locator('[data-testid="file-tree-item"]', { hasText: /\.(png|jpg|gif|svg)$/ })
    
    if (await imageFile.count() > 0) {
      await imageFile.first().click()
      
      // Should open image viewer instead of code editor
      await expect(projectPage.locator('[data-testid="image-viewer"]')).toBeVisible()
      
      // Should show image
      await expect(projectPage.locator('[data-testid="image-preview"]')).toBeVisible()
    }
  })

  test('should show file context menu', async ({ projectPage }) => {
    // Right-click on a file
    const file = projectPage.locator('[data-testid="file-tree-item"]').first()
    await file.click({ button: 'right' })
    
    // Should show context menu
    await expect(projectPage.locator('[data-testid="context-menu"]')).toBeVisible()
    
    // Should have options like copy path, rename, delete, etc.
    await expect(projectPage.locator('[data-testid="context-menu-copy-path"]')).toBeVisible()
  })

  test('should handle file operations errors gracefully', async ({ projectPage }) => {
    // Try to open a non-existent file (simulate error)
    const nonExistentFile = projectPage.locator('[data-testid="file-tree-item"]', { hasText: 'non-existent.js' })
    
    if (await nonExistentFile.count() > 0) {
      await nonExistentFile.click()
      
      // Should show error message
      await expect(projectPage.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(projectPage.locator('[data-testid="error-message"]')).toContainText('Error')
    }
  })

  test('should show file loading states', async ({ projectPage }) => {
    // Click on a large file that might take time to load
    const largeFile = projectPage.locator('[data-testid="file-tree-item"]').first()
    await largeFile.click()
    
    // Should show loading indicator
    await expect(projectPage.locator('[data-testid="file-loading"]')).toBeVisible()
    
    // Loading should disappear when file loads
    await expect(projectPage.locator('[data-testid="code-editor"]')).toBeVisible({ timeout: 10000 })
    await expect(projectPage.locator('[data-testid="file-loading"]')).not.toBeVisible()
  })

  test('should handle file watching and updates', async ({ projectPage }) => {
    // This would test real-time file updates via WebSocket
    // For now, we'll just verify that the file tree refreshes
    
    // Get initial file count
    const initialFileCount = await projectPage.locator('[data-testid="file-tree-item"]').count()
    
    // Simulate file system change (this would be done externally)
    // For testing, we can just refresh the file tree
    const refreshButton = projectPage.locator('[data-testid="refresh-files"]')
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click()
      
      // File tree should update
      await expect(projectPage.locator('[data-testid="file-tree"]')).toBeVisible()
    }
  })
})