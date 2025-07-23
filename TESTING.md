# ClaudeCodeUI Testing Guide

This document provides comprehensive information about the testing framework implemented for ClaudeCodeUI.

## Overview

The testing suite includes:
- **Unit Tests**: Component and utility function testing using Vitest and React Testing Library
- **Integration Tests**: API endpoints and WebSocket connection testing  
- **E2E Tests**: End-to-end user workflow testing with Playwright
- **Performance Tests**: Bundle size and load time validation
- **Accessibility Tests**: WCAG compliance and a11y validation
- **CI/CD Integration**: Automated testing in GitHub Actions

## Test Structure

```
src/tests/
├── setup.js                 # Test environment setup
├── utils/
│   └── test-utils.jsx       # Custom testing utilities
├── mocks/
│   ├── server.js            # MSW server setup  
│   └── handlers.js          # API mock handlers
├── integration/
│   ├── api.test.js          # API integration tests
│   └── websocket.test.js    # WebSocket integration tests
├── performance/
│   ├── bundle-size.test.js  # Bundle analysis tests
│   └── load-time.test.js    # Performance benchmarks
└── accessibility/
    ├── setup.js             # A11y test setup
    └── wcag-compliance.test.jsx # WCAG validation tests

src/components/__tests__/
├── ChatInterface.test.jsx   # Chat component tests
├── FileTree.test.jsx        # File tree component tests
├── Shell.test.jsx           # Terminal component tests  
└── GitPanel.test.jsx        # Git panel component tests

e2e/
├── setup.js                 # E2E test utilities
├── auth.spec.js             # Authentication flow tests
├── chat.spec.js             # Chat interface E2E tests
├── file-management.spec.js  # File operations E2E tests
└── accessibility.spec.js    # E2E accessibility tests

test-fixtures/
└── sample-project/          # Sample project for testing
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Unit tests with coverage
npm test
npm run test:coverage

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
npm run test:e2e:ui    # With Playwright UI

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:accessibility

# CI mode (non-interactive)
npm run test:ci
```

### Test Setup
```bash
# Initialize test environment
npm run test:setup
```

## Unit Testing

### Framework
- **Vitest**: Fast test runner with native ES modules support
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for integration-like testing
- **jsdom**: Browser environment simulation

### Example Test
```javascript
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/tests/utils/test-utils'
import ChatInterface from '../ChatInterface'

describe('ChatInterface', () => {
  it('sends message when form is submitted', async () => {
    renderWithProviders(<ChatInterface {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(input, 'Hello Claude')
    await user.click(sendButton)
    
    expect(mockApi.sendClaudeMessage).toHaveBeenCalledWith(
      'Hello Claude',
      undefined, 
      'test-session-id'
    )
  })
})
```

### Custom Testing Utilities

The `renderWithProviders` utility wraps components with necessary providers:
- React Router
- Authentication context
- Theme context  
- Custom prop overrides

## Integration Testing

### API Testing
Tests actual API endpoints using mock servers:

```javascript
describe('API Integration Tests', () => {
  it('logs in with valid credentials', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'valid-jwt-token' })
    })

    const result = await api.login('testuser', 'password')
    expect(result.token).toBe('valid-jwt-token')
  })
})
```

### WebSocket Testing
Tests real-time communication:

```javascript
describe('WebSocket Integration', () => {
  it('establishes connection successfully', async () => {
    mockWS = connectWebSocket('ws://localhost:3001/ws', handlers)
    await waitFor(() => expect(handlers.onOpen).toHaveBeenCalled())
  })
})
```

## E2E Testing

### Framework
- **Playwright**: Cross-browser automation
- **Custom fixtures**: Authenticated sessions, test projects
- **Page Object Model**: Reusable page interactions

### Example E2E Test
```javascript
test('should send message to Claude', async ({ projectPage }) => {
  const messageInput = projectPage.locator('[data-testid="message-input"]')
  
  await messageInput.fill('Hello Claude, can you help me?')
  await messageInput.press('Enter')
  
  await expect(projectPage.locator('[data-testid="user-message"]').last())
    .toContainText('Hello Claude, can you help me?')
})
```

### Browser Coverage
- Chromium (Chrome/Edge)
- Firefox  
- WebKit (Safari)
- Mobile viewports

## Performance Testing

### Bundle Size Analysis
- Tracks bundle size limits
- Monitors code splitting efficiency
- Validates asset optimization

### Load Time Benchmarks
- Component render performance
- Memory usage monitoring
- Event handler efficiency

### Thresholds
```javascript
const PERFORMANCE_THRESHOLDS = {
  componentRender: 100,     // ms
  largeListRender: 500,     // ms  
  appInitialization: 1000,  // ms
  memoryUsage: 50 * 1024 * 1024  // 50MB
}
```

## Accessibility Testing

### WCAG Compliance
- Color contrast validation
- Keyboard navigation testing
- Screen reader compatibility
- Semantic HTML structure

### Tools
- **axe-core**: Automated accessibility testing
- **jest-axe**: Jest integration for axe
- **@axe-core/playwright**: E2E accessibility testing

### Example A11y Test
```javascript
it('should have sufficient color contrast', async () => {
  const { container } = renderWithProviders(<Button>Test</Button>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## CI/CD Integration

### GitHub Actions Workflow
- Multi-node version testing (Node 18, 20)
- Parallel test execution
- Coverage reporting to Codecov
- Artifact storage for reports

### Quality Gates
- 80% code coverage requirement
- All accessibility tests must pass
- Bundle size limits enforced
- Security vulnerability scanning

## Test Data Management

### Mock Data
- Realistic file tree structures
- Sample git status data
- Mock API responses
- Test user credentials

### Test Fixtures
- Sample project structure
- Known file contents
- Reproducible test scenarios

## Performance Monitoring

### Lighthouse CI
- Performance score tracking
- Accessibility audit automation  
- Best practices validation
- SEO compliance checking

### Bundle Analysis
- Webpack Bundle Analyzer integration
- Tree-shaking validation
- Dead code detection
- Dependency size tracking

## Coverage Reporting

### Thresholds
- **Branches**: 80%
- **Functions**: 80%  
- **Lines**: 80%
- **Statements**: 80%

### Exclusions
- Test files themselves
- Configuration files
- Main entry point
- Type definitions

## Debugging Tests

### Local Development
```bash
# Run tests in watch mode
npm test

# Run specific test file
npm test ChatInterface

# Debug with browser
npm run test:e2e:ui

# View coverage report
npm run test:coverage
open coverage/index.html
```

### CI Debugging
- Playwright traces on failure
- Screenshot capture
- Video recordings
- Detailed error reporting

## Best Practices

### Unit Tests
1. Test behavior, not implementation
2. Use descriptive test names
3. Keep tests focused and isolated
4. Mock external dependencies
5. Test edge cases and error conditions

### E2E Tests  
1. Test critical user journeys
2. Use data-testid for reliable selectors
3. Wait for elements properly
4. Keep tests independent
5. Use page object model for reusability

### Performance Tests
1. Set realistic thresholds
2. Monitor trends over time
3. Test on realistic data sizes
4. Consider different device capabilities
5. Validate both development and production builds

### Accessibility Tests
1. Test with actual assistive technologies
2. Include keyboard-only navigation
3. Validate color contrast in all themes
4. Test screen reader announcements
5. Verify semantic HTML structure

## Troubleshooting

### Common Issues

#### Tests timing out
- Increase timeout values in config
- Check for infinite loops or promises
- Verify mock responses are configured

#### Flaky E2E tests  
- Add proper wait conditions
- Use retry mechanisms
- Check for race conditions
- Ensure test independence

#### Coverage not meeting thresholds
- Add tests for uncovered branches
- Remove unnecessary exclusions
- Test error handling paths
- Verify test execution

#### Accessibility failures
- Check color contrast ratios
- Verify ARIA labels and roles
- Test keyboard navigation
- Validate heading hierarchy

### Getting Help

1. Check test logs and error messages
2. Review CI pipeline outputs
3. Use debugging tools (Playwright UI, VS Code debugger)
4. Consult framework documentation
5. Check for known issues in project repository

## Continuous Improvement

### Metrics to Track
- Test execution time
- Coverage trends  
- Flakiness rates
- Performance regression detection
- Accessibility compliance scores

### Regular Maintenance
- Update test dependencies
- Review and refactor test code
- Add tests for new features
- Remove obsolete tests
- Optimize test performance

This testing framework ensures ClaudeCodeUI maintains high quality, performance, and accessibility standards throughout development.