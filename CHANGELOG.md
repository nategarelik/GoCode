# Changelog

All notable changes to Claude Code UI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-07-24

### Added
- **UnoCSS Integration**: Migrated from Tailwind CSS to UnoCSS for superior performance
  - 200x faster CSS generation in development
  - 38% faster build times
  - Full Tailwind compatibility maintained
- **Production Docker Configuration**: Complete production-ready Docker setup
  - Multi-stage builds for optimized images
  - nginx reverse proxy with SSL support
  - Redis integration for session management
  - Health checks and monitoring
- **Enhanced Security**: Production-grade security improvements
  - Rate limiting on API endpoints
  - Helmet.js security headers
  - JWT authentication enhancements
  - CORS configuration
- **Performance Monitoring**: Built-in performance tracking
  - Core Web Vitals monitoring
  - Resource usage tracking
  - Alert system for performance degradation
- **Database Migrations**: SQLite database with migration system
  - User management tables
  - Session persistence
  - Activity logging

### Changed
- **CSS Framework**: Migrated from Tailwind CSS to UnoCSS
  - All existing utilities remain compatible
  - Added custom shortcuts for common patterns
  - Improved bundle size optimization
- **Build System**: Enhanced Vite configuration
  - UnoCSS plugin integration
  - Optimized chunk splitting
  - Better caching strategies
- **Docker Architecture**: Simplified from dual-serving to single proxy
  - nginx acts as pure reverse proxy
  - Express serves all static assets
  - Improved WebSocket handling

### Fixed
- **Docker CSS Loading**: Resolved CSS files not loading in Docker environments
- **WebSocket Connections**: Fixed "Invalid frame header" errors in nginx proxy
- **Build Warnings**: Eliminated Tailwind PostCSS warnings
- **Production Deployment**: Various production environment fixes

### Security
- Added comprehensive security middleware
- Implemented rate limiting for API endpoints
- Enhanced JWT token validation
- Added security headers via Helmet.js

### Documentation
- Added comprehensive PRD for styling system overhaul
- Created UnoCSS migration guide
- Added Docker troubleshooting documentation
- Updated production deployment guides

## [1.5.0] - 2025-07-23

### Added
- Mobile access setup with Tailscale optimization
- GitHub Pages deployment support
- Quick access guide for deployment

### Fixed
- GitHub Pages deployment paths and resource loading
- Workflow issues in CI/CD
- Updated deprecated GitHub Actions to v4

### Documentation
- Added quick access guide for easy deployment
- Improved mobile setup documentation

## Previous Versions

See git history for changes before v1.5.0