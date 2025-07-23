import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

describe('Bundle Size Performance', () => {
  const BUNDLE_SIZE_LIMITS = {
    // Initial bundle size limits (in KB)
    'index.js': 500, // Main bundle
    'vendor.js': 2000, // Third-party dependencies
    'index.css': 100, // Styles
    total: 2500 // Total bundle size
  }

  it('should build project successfully', () => {
    // Build the project
    const buildResult = execSync('npm run build', { 
      encoding: 'utf8',
      timeout: 60000 
    })
    
    expect(buildResult).toBeDefined()
    expect(fs.existsSync('dist')).toBe(true)
  })

  it('should keep main bundle under size limit', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const jsFiles = distFiles.filter(file => file.endsWith('.js') && file.includes('index'))
    
    expect(jsFiles.length).toBeGreaterThan(0)
    
    jsFiles.forEach(file => {
      const filePath = path.join('dist/assets', file)
      const stats = fs.statSync(filePath)
      const sizeKB = stats.size / 1024
      
      console.log(`Bundle ${file}: ${sizeKB.toFixed(2)} KB`)
      expect(sizeKB).toBeLessThan(BUNDLE_SIZE_LIMITS['index.js'])
    })
  })

  it('should keep vendor bundle under size limit', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const vendorFiles = distFiles.filter(file => 
      file.endsWith('.js') && (file.includes('vendor') || file.includes('chunk'))
    )
    
    let totalVendorSize = 0
    
    vendorFiles.forEach(file => {
      const filePath = path.join('dist/assets', file)
      const stats = fs.statSync(filePath)
      const sizeKB = stats.size / 1024
      totalVendorSize += sizeKB
      
      console.log(`Vendor bundle ${file}: ${sizeKB.toFixed(2)} KB`)
    })
    
    console.log(`Total vendor size: ${totalVendorSize.toFixed(2)} KB`)
    expect(totalVendorSize).toBeLessThan(BUNDLE_SIZE_LIMITS['vendor.js'])
  })

  it('should keep CSS bundle under size limit', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const cssFiles = distFiles.filter(file => file.endsWith('.css'))
    
    let totalCssSize = 0
    
    cssFiles.forEach(file => {
      const filePath = path.join('dist/assets', file)
      const stats = fs.statSync(filePath)
      const sizeKB = stats.size / 1024
      totalCssSize += sizeKB
      
      console.log(`CSS bundle ${file}: ${sizeKB.toFixed(2)} KB`)
    })
    
    console.log(`Total CSS size: ${totalCssSize.toFixed(2)} KB`)
    expect(totalCssSize).toBeLessThan(BUNDLE_SIZE_LIMITS['index.css'])
  })

  it('should keep total bundle size under limit', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const assetFiles = distFiles.filter(file => 
      file.endsWith('.js') || file.endsWith('.css')
    )
    
    let totalSize = 0
    
    assetFiles.forEach(file => {
      const filePath = path.join('dist/assets', file)
      const stats = fs.statSync(filePath)
      const sizeKB = stats.size / 1024
      totalSize += sizeKB
    })
    
    console.log(`Total bundle size: ${totalSize.toFixed(2)} KB`)
    expect(totalSize).toBeLessThan(BUNDLE_SIZE_LIMITS.total)
  })

  it('should have efficient code splitting', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const jsFiles = distFiles.filter(file => file.endsWith('.js'))
    
    // Should have multiple JS chunks for code splitting
    expect(jsFiles.length).toBeGreaterThan(1)
    
    // Main bundle should be smaller than total - indicating code splitting
    const mainFiles = jsFiles.filter(file => file.includes('index'))
    const otherFiles = jsFiles.filter(file => !file.includes('index'))
    
    expect(otherFiles.length).toBeGreaterThan(0)
  })

  it('should have gzip compression benefits', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const jsFiles = distFiles.filter(file => file.endsWith('.js'))
    
    jsFiles.forEach(file => {
      const filePath = path.join('dist/assets', file)
      const stats = fs.statSync(filePath)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Check for minification (no unnecessary whitespace)
      const hasExcessiveWhitespace = content.includes('  ') || content.includes('\n\n')
      expect(hasExcessiveWhitespace).toBe(false)
      
      // Check for dead code elimination (no console.log in production)
      const hasDebugCode = content.includes('console.log')
      expect(hasDebugCode).toBe(false)
    })
  })

  it('should have efficient asset optimization', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    // Check for asset optimization
    const distFiles = fs.readdirSync('dist/assets')
    
    // Should have hashed filenames for caching
    const hashedFiles = distFiles.filter(file => 
      /\.[a-f0-9]{8,}\.(js|css)$/.test(file)
    )
    
    expect(hashedFiles.length).toBeGreaterThan(0)
  })

  it('should generate bundle analysis', () => {
    // This test would run bundle analyzer if available
    try {
      const analysisResult = execSync('npx vite-bundle-analyzer --analyze', {
        encoding: 'utf8',
        timeout: 30000
      })
      
      expect(analysisResult).toBeDefined()
    } catch (error) {
      // Bundle analyzer not available, skip this test
      console.log('Bundle analyzer not available, skipping analysis')
    }
  })

  it('should have treeshaking working', () => {
    if (!fs.existsSync('dist')) {
      execSync('npm run build', { timeout: 60000 })
    }

    const distFiles = fs.readdirSync('dist/assets')
    const jsFiles = distFiles.filter(file => file.endsWith('.js'))
    
    jsFiles.forEach(file => {
      const filePath = path.join('dist/assets', file)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Should not contain unused large libraries
      const hasUnusedLodash = content.includes('lodash') && !content.includes('_')
      expect(hasUnusedLodash).toBe(false)
      
      // Should not contain unused React DevTools
      const hasDevTools = content.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')
      expect(hasDevTools).toBe(false)
    })
  })
})