import { test, expect } from './setup.js'

test.describe('Chat Interface', () => {
  test('should display chat interface when project is loaded', async ({ projectPage }) => {
    await expect(projectPage.locator('[data-testid="chat-interface"]')).toBeVisible()
    await expect(projectPage.locator('[data-testid="message-input"]')).toBeVisible()
    await expect(projectPage.locator('[data-testid="send-button"]')).toBeVisible()
    await expect(projectPage.locator('[data-testid="claude-logo"]')).toBeVisible()
  })

  test('should send message to Claude', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    const sendButton = projectPage.locator('[data-testid="send-button"]')
    
    // Type message
    await messageInput.fill('Hello Claude, can you help me?')
    
    // Send message
    await sendButton.click()
    
    // Message should appear in chat
    await expect(projectPage.locator('[data-testid="user-message"]').last()).toContainText('Hello Claude, can you help me?')
    
    // Should show loading indicator
    await expect(projectPage.locator('[data-testid="claude-thinking"]')).toBeVisible()
    
    // Wait for Claude response
    await expect(projectPage.locator('[data-testid="assistant-message"]').last()).toBeVisible({ timeout: 30000 })
  })

  test('should send message with Enter key', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    // Type message and press Enter
    await messageInput.fill('Test message with Enter key')
    await messageInput.press('Enter')
    
    // Message should appear in chat
    await expect(projectPage.locator('[data-testid="user-message"]').last()).toContainText('Test message with Enter key')
  })

  test('should prevent sending empty messages', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    const sendButton = projectPage.locator('[data-testid="send-button"]')
    
    // Try to send empty message
    await sendButton.click()
    
    // No new message should appear
    const messageCountBefore = await projectPage.locator('[data-testid="chat-message"]').count()
    await sendButton.click()
    const messageCountAfter = await projectPage.locator('[data-testid="chat-message"]').count()
    
    expect(messageCountAfter).toBe(messageCountBefore)
  })

  test('should upload and send file', async ({ projectPage }) => {
    // Create test file
    const fileContent = 'This is a test file for upload'
    const fileName = 'test-upload.txt'
    
    // Get file input (might be hidden)
    const fileInput = projectPage.locator('[data-testid="file-input"]')
    
    // Upload file
    await fileInput.setInputFiles({
      name: fileName,
      mimeType: 'text/plain',
      buffer: Buffer.from(fileContent)
    })
    
    // File should appear in chat or upload area
    await expect(projectPage.locator('[data-testid="uploaded-file"]')).toBeVisible()
    await expect(projectPage.locator('[data-testid="uploaded-file"]')).toContainText(fileName)
  })

  test('should display tool use indicators', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    // Send message that would trigger tool use
    await messageInput.fill('Can you read the package.json file?')
    await messageInput.press('Enter')
    
    // Wait for tool use indicator
    await expect(projectPage.locator('[data-testid="tool-use-indicator"]')).toBeVisible({ timeout: 30000 })
    
    // Should show specific tool being used
    await expect(projectPage.locator('[data-testid="tool-name"]')).toContainText('Read')
  })

  test('should show file preview when mentioned', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    // Send message mentioning a file
    await messageInput.fill('Please analyze the package.json file')
    await messageInput.press('Enter')
    
    // Wait for response with file content
    await expect(projectPage.locator('[data-testid="assistant-message"]').last()).toBeVisible({ timeout: 30000 })
    
    // Should show file content or preview
    await expect(projectPage.locator('[data-testid="file-preview"]')).toBeVisible()
  })

  test('should handle long conversations', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    // Send multiple messages
    for (let i = 1; i <= 5; i++) {
      await messageInput.fill(`Message ${i}`)
      await messageInput.press('Enter')
      
      // Wait for each response
      await expect(projectPage.locator('[data-testid="assistant-message"]').nth(i - 1)).toBeVisible({ timeout: 30000 })
    }
    
    // All messages should be visible
    const messageCount = await projectPage.locator('[data-testid="chat-message"]').count()
    expect(messageCount).toBeGreaterThanOrEqual(10) // 5 user + 5 assistant messages
    
    // Should auto-scroll to bottom
    const lastMessage = projectPage.locator('[data-testid="chat-message"]').last()
    await expect(lastMessage).toBeInViewport()
  })

  test('should maintain chat history on page refresh', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    // Send a message
    await messageInput.fill('This message should persist')
    await messageInput.press('Enter')
    
    // Wait for response
    await expect(projectPage.locator('[data-testid="assistant-message"]').last()).toBeVisible({ timeout: 30000 })
    
    // Refresh page
    await projectPage.reload()
    
    // Wait for page to load
    await expect(projectPage.locator('[data-testid="chat-interface"]')).toBeVisible()
    
    // Message should still be there
    await expect(projectPage.locator('[data-testid="user-message"]')).toContainText('This message should persist')
  })

  test('should handle voice input', async ({ projectPage }) => {
    // Mock microphone permission
    await projectPage.context().grantPermissions(['microphone'])
    
    const micButton = projectPage.locator('[data-testid="mic-button"]')
    
    // Click microphone button
    await micButton.click()
    
    // Should show recording indicator
    await expect(projectPage.locator('[data-testid="recording-indicator"]')).toBeVisible()
    
    // Click to stop recording
    await micButton.click()
    
    // Should process audio and add to input
    await expect(projectPage.locator('[data-testid="message-input"]')).not.toBeEmpty()
  })

  test('should show typing indicator during response', async ({ projectPage }) => {
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    // Send message
    await messageInput.fill('Tell me about this project')
    await messageInput.press('Enter')
    
    // Should show typing indicator while Claude is responding
    await expect(projectPage.locator('[data-testid="typing-indicator"]')).toBeVisible()
    
    // Typing indicator should disappear when response is complete
    await expect(projectPage.locator('[data-testid="assistant-message"]').last()).toBeVisible({ timeout: 30000 })
    await expect(projectPage.locator('[data-testid="typing-indicator"]')).not.toBeVisible()
  })

  test('should handle Claude API errors gracefully', async ({ projectPage }) => {
    // Mock API error by sending a message that might fail
    const messageInput = projectPage.locator('[data-testid="message-input"]')
    
    await messageInput.fill('This is a test message that might cause an error')
    await messageInput.press('Enter')
    
    // If an error occurs, should show error message
    const errorMessage = projectPage.locator('[data-testid="error-message"]')
    
    // Wait for either success or error
    await Promise.race([
      expect(projectPage.locator('[data-testid="assistant-message"]').last()).toBeVisible({ timeout: 30000 }),
      expect(errorMessage).toBeVisible({ timeout: 30000 })
    ])
    
    // If error is shown, verify it's handled gracefully
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('Error')
      
      // Should be able to send another message
      await messageInput.fill('This should work after error')
      await messageInput.press('Enter')
    }
  })

  test('should show project context in chat', async ({ projectPage }) => {
    // Should show project name or path
    await expect(projectPage.locator('[data-testid="project-context"]')).toBeVisible()
    await expect(projectPage.locator('[data-testid="project-context"]')).toContainText('Test Project')
  })
})