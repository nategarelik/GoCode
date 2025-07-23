import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = command === 'serve'
  const isProd = command === 'build'
  
  // Determine base URL for GitHub Pages or local development
  const base = process.env.GITHUB_PAGES ? '/GoCode/' : '/'
  
  return {
    base,
    plugins: [
      react({
        // Enable Fast Refresh for better development experience
        fastRefresh: isDev,
        // Optimize JSX runtime for production
        jsxRuntime: 'automatic'
      })
    ],
    
    // Development server configuration
    server: {
      port: parseInt(env.VITE_PORT) || 3001,
      host: env.VITE_HOST || 'localhost',
      open: false, // Don't auto-open browser
      cors: true,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 3002}`,
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: `ws://localhost:${env.PORT || 3002}`,
          ws: true,
          changeOrigin: true
        }
      }
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: isProd ? false : true, // Source maps only in dev
      minify: isProd ? 'terser' : false,
      
      // Terser options for production optimization
      terserOptions: isProd ? {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        },
        mangle: {
          safari10: true // Fix Safari 10+ issues
        },
        format: {
          comments: false // Remove comments
        }
      } : undefined,
      
      // Target modern browsers for smaller bundles
      target: 'es2020',
      
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      
      // Rollup options for advanced bundling
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        
        // Manual chunk splitting for better caching
        output: {
          // Chunk naming strategy
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId) {
              if (facadeModuleId.includes('node_modules')) {
                return 'vendor/[name]-[hash].js';
              }
              if (facadeModuleId.includes('components')) {
                return 'components/[name]-[hash].js';
              }
              if (facadeModuleId.includes('utils')) {
                return 'utils/[name]-[hash].js';
              }
            }
            return 'chunks/[name]-[hash].js';
          },
          
          // Asset naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${ext}`;
            }
            if (/\.css$/i.test(assetInfo.name)) {
              return `css/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          },
          
          // Manual chunks for vendor dependencies
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // Code editing
            'editor-vendor': [
              '@codemirror/lang-javascript',
              '@codemirror/lang-python', 
              '@codemirror/lang-css',
              '@codemirror/lang-html',
              '@codemirror/lang-json',
              '@codemirror/lang-markdown',
              '@codemirror/theme-one-dark',
              '@uiw/react-codemirror'
            ],
            
            // Terminal
            'terminal-vendor': [
              'xterm',
              'xterm-addon-fit',
              '@xterm/addon-clipboard',
              '@xterm/addon-webgl'
            ],
            
            // UI components
            'ui-vendor': [
              'lucide-react',
              'clsx',
              'tailwind-merge',
              'class-variance-authority'
            ],
            
            // Charts and visualization
            'charts-vendor': ['recharts'],
            
            // Utilities
            'utils-vendor': [
              'react-markdown',
              'react-dropzone', 
              'web-vitals'
            ],
            
            // Note: Node.js dependencies like jsonwebtoken and bcrypt are excluded from client bundle
          }
        },
        
        // External dependencies (Node.js only dependencies excluded from client bundle)
        external: ['jsonwebtoken', 'bcrypt', 'better-sqlite3', 'node-pty', 'chokidar']
      },
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Generate PWA manifest
      manifest: isProd
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'clsx',
        'tailwind-merge'
      ],
      exclude: [
        // Exclude large dependencies that should be lazy loaded
      ]
    },

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@contexts': resolve(__dirname, 'src/contexts')
      }
    },

    // CSS configuration
    css: {
      devSourcemap: isDev,
      postcss: {
        plugins: []
      }
    },

    // Define global constants
    define: {
      __DEV__: isDev,
      __PROD__: isProd,
      __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
    },

    // Preview configuration (for production preview)
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
      host: env.VITE_HOST || 'localhost',
      open: false
    },

    // ESBuild options
    esbuild: {
      // Remove console logs in production
      drop: isProd ? ['console', 'debugger'] : [],
      // Target for better compatibility
      target: 'es2020'
    }
  }
})