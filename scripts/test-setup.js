#!/usr/bin/env node

/**
 * Test setup script for ClaudeCodeUI
 * Sets up test database, creates test fixtures, and prepares environment
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const TEST_DB_PATH = './test.db'
const TEST_FIXTURES_PATH = './test-fixtures'

async function setupTestDatabase() {
  console.log('Setting up test database...')
  
  // Remove existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
  
  // Create test database schema
  try {
    execSync('node server/database/setup.js', { 
      env: { ...process.env, NODE_ENV: 'test', DATABASE_PATH: TEST_DB_PATH },
      stdio: 'inherit'
    })
    console.log('✅ Test database created successfully')
  } catch (error) {
    console.error('❌ Failed to create test database:', error.message)
    process.exit(1)
  }
}

async function createTestFixtures() {
  console.log('Creating test fixtures...')
  
  // Ensure test fixtures directory exists
  if (!fs.existsSync(TEST_FIXTURES_PATH)) {
    fs.mkdirSync(TEST_FIXTURES_PATH, { recursive: true })
  }
  
  // Create sample project structure (already created by file writes above)
  const sampleProjectPath = path.join(TEST_FIXTURES_PATH, 'sample-project')
  
  if (fs.existsSync(sampleProjectPath)) {
    console.log('✅ Test fixtures already exist')
  } else {
    console.log('❌ Test fixtures not found - they should have been created')
    process.exit(1)
  }
}

async function setupTestUser() {
  console.log('Setting up test user...')
  
  try {
    // Create test user in database
    const setupScript = `
      const { Database } = require('./server/database/db.js');
      const bcrypt = require('bcrypt');
      
      async function createTestUser() {
        const db = new Database('${TEST_DB_PATH}');
        
        const hashedPassword = await bcrypt.hash('testpass', 10);
        
        const stmt = db.prepare(\`
          INSERT OR REPLACE INTO users (username, password_hash, created_at)
          VALUES (?, ?, datetime('now'))
        \`);
        
        stmt.run('testuser', hashedPassword);
        
        console.log('Test user created: testuser/testpass');
        db.close();
      }
      
      createTestUser().catch(console.error);
    `
    
    fs.writeFileSync('./temp-setup-user.js', setupScript)
    execSync('node temp-setup-user.js', { stdio: 'inherit' })
    fs.unlinkSync('./temp-setup-user.js')
    
    console.log('✅ Test user created successfully')
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message)
    process.exit(1)
  }
}

async function validateTestEnvironment() {
  console.log('Validating test environment...')
  
  // Check required dependencies
  const requiredPackages = [
    'vitest',
    '@playwright/test',
    '@testing-library/react',
    'msw'
  ]
  
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const installedPackages = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  }
  
  for (const pkg of requiredPackages) {
    if (!installedPackages[pkg]) {
      console.error(`❌ Missing required package: ${pkg}`)
      process.exit(1)
    }
  }
  
  console.log('✅ All required packages are installed')
}

async function main() {
  console.log('🧪 Setting up ClaudeCodeUI test environment...\n')
  
  try {
    await validateTestEnvironment()
    await createTestFixtures()
    await setupTestDatabase()
    await setupTestUser()
    
    console.log('\n✅ Test environment setup complete!')
    console.log('\nYou can now run tests with:')
    console.log('  npm test              # Unit tests')
    console.log('  npm run test:e2e      # E2E tests')
    console.log('  npm run test:all      # All tests')
    
  } catch (error) {
    console.error('\n❌ Test setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  setupTestDatabase,
  createTestFixtures,
  setupTestUser,
  validateTestEnvironment
}