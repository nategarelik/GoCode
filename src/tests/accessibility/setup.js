import { vi } from 'vitest'
import 'jest-axe/extend-expect'

// Mock axe-core for accessibility testing
vi.mock('axe-core', () => ({
  default: {
    run: vi.fn().mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: []
    }),
    configure: vi.fn(),
    getRules: vi.fn().mockReturnValue([])
  }
}))

// Mock intersection observer for accessibility testing
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}))

// Mock screen reader announcements
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
  onvoiceschanged: null,
  paused: false,
  pending: false,
  speaking: false
}

// Mock focus management
const originalFocus = HTMLElement.prototype.focus
HTMLElement.prototype.focus = vi.fn(function(...args) {
  this.setAttribute('data-focused', 'true')
  originalFocus.apply(this, args)
})

const originalBlur = HTMLElement.prototype.blur
HTMLElement.prototype.blur = vi.fn(function(...args) {
  this.removeAttribute('data-focused')
  originalBlur.apply(this, args)
})

// Mock getBoundingClientRect for visibility tests
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 0,
  toJSON: vi.fn()
}))