import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'
import { presetWind } from '@unocss/preset-wind'

export default defineConfig({
  // Use Wind preset for Tailwind compatibility
  presets: [
    presetWind({
      // Enable all Tailwind features
      important: false,
    }),
    presetAttributify({
      // Enable attribute mode for cleaner JSX
      prefix: 'un-',
      prefixOnly: false,
    }),
    // Disable icons preset to avoid warnings
    // presetIcons(),
    presetTypography({
      // Typography support to replace @tailwindcss/typography
      cssExtend: {
        'code::before': {
          content: '""',
        },
        'code::after': {
          content: '""',
        },
      },
    }),
    // Remove web fonts preset as we're using system fonts
  ],

  // Transformers for enhanced DX
  transformers: [
    transformerDirectives(), // @apply, @screen, @layer support
    transformerVariantGroup(), // Variant group support
  ],

  // Migrate existing theme from Tailwind
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    colors: {
      // Preserve CSS variables for dynamic theming
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    extend: {
      spacing: {
        'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },

  // Custom shortcuts for common patterns
  shortcuts: [
    // Button variants
    ['btn', 'px-4 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'],
    ['btn-primary', 'btn bg-primary text-primary-foreground hover:bg-primary/90'],
    ['btn-secondary', 'btn bg-secondary text-secondary-foreground hover:bg-secondary/80'],
    ['btn-destructive', 'btn bg-destructive text-destructive-foreground hover:bg-destructive/90'],
    ['btn-outline', 'btn border border-input bg-background hover:bg-accent hover:text-accent-foreground'],
    ['btn-ghost', 'btn hover:bg-accent hover:text-accent-foreground'],
    
    // Input styles
    ['input-base', 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'],
    
    // Card styles
    ['card', 'rounded-lg border bg-card text-card-foreground shadow-sm'],
    
    // Container utilities
    ['container-center', 'container mx-auto px-4 sm:px-6 lg:px-8'],
    
    // Scrollbar utilities
    ['scrollbar-thin', 'scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent'],
    
    // Mobile utilities
    ['mobile-touch-target', 'min-h-[44px] min-w-[44px]'],
    
    // Dark mode utilities
    ['dark-mode-transition', 'transition-colors duration-200'],
  ],

  // Rules for custom utilities
  rules: [
    // Loading spinner animation
    ['animate-spin', { animation: 'spin 1s linear infinite' }],
    ['animate-spin-slow', { animation: 'spin 2s linear infinite' }],
    ['animate-spin-fast', { animation: 'spin 0.5s linear infinite' }],
    
    // Custom focus styles
    ['focus-ring', { 
      'outline': '2px solid transparent',
      'outline-offset': '2px',
      'box-shadow': '0 0 0 2px hsl(var(--ring))',
    }],
  ],

  // Safelist to ensure critical classes aren't purged
  safelist: [
    'dark',
    'light',
    // Animation classes
    'animate-spin',
    'animate-pulse',
    'animate-bounce',
    // Common responsive patterns
    ...'sm md lg xl 2xl'.split(' ').map(i => `${i}:hidden`),
    ...'sm md lg xl 2xl'.split(' ').map(i => `${i}:block`),
  ],

  // Layer configuration
  layers: {
    // Define custom layers to match Tailwind structure
    'base': 0,
    'components': 1,
    'default': 2,
    'utilities': 3,
  },

  // Performance optimizations
  details: true,
  
  // Content configuration (handled by Vite plugin)
  content: {
    pipeline: {
      include: [
        /\.(jsx?|tsx?|vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'src/**/*.{js,jsx,ts,tsx}',
      ],
    },
  },
})