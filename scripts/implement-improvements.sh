#!/bin/bash

# ClaudeCodeUI Improvement Implementation Script
# This script helps implement the improvements in a structured way

set -e

echo "🚀 ClaudeCodeUI Improvement Implementation Script"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in ClaudeCodeUI root directory!"
    exit 1
fi

# Menu function
show_menu() {
    echo ""
    echo "Choose an improvement to implement:"
    echo "1) Phase 1 - Foundation & Quick Wins"
    echo "2) Phase 2 - Performance & Accessibility"
    echo "3) Phase 3 - Developer Experience"
    echo "4) Phase 4 - Advanced Features"
    echo "5) Phase 5 - Polish & Deploy"
    echo "6) Setup Development Environment"
    echo "7) Run Tests & Validation"
    echo "8) Exit"
    echo ""
}

# Setup development environment
setup_dev_env() {
    print_status "Setting up development environment..."
    
    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js 20 or higher is required!"
        print_warning "Please install Node.js 20+ and try again"
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Create directories
    print_status "Creating necessary directories..."
    mkdir -p docs scripts src/contexts src/hooks src/utils
    
    # Copy environment file
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cp .env.example .env 2>/dev/null || echo "PORT=3008
VITE_PORT=3009
VITE_HOST=localhost" > .env
    fi
    
    print_status "Development environment setup complete!"
}

# Implement Phase 1
implement_phase1() {
    print_status "Implementing Phase 1 - Foundation & Quick Wins"
    
    # Create theme context
    if [ ! -f "src/contexts/ThemeContext.jsx" ]; then
        print_status "Creating ThemeContext..."
        # Theme context would be created here
        touch src/contexts/ThemeContext.jsx
        print_warning "Please implement ThemeContext.jsx as per the guide"
    fi
    
    # Create dark mode toggle component
    if [ ! -f "src/components/DarkModeToggle.jsx" ]; then
        print_status "Creating DarkModeToggle component..."
        touch src/components/DarkModeToggle.jsx
        print_warning "Please implement DarkModeToggle.jsx as per the guide"
    fi
    
    # Docker setup
    if [ ! -f "Dockerfile" ]; then
        print_status "Creating Docker configuration..."
        touch Dockerfile
        touch docker-compose.yml
        touch .dockerignore
        print_warning "Please implement Docker files as per the guide"
    fi
    
    # Performance utilities
    if [ ! -f "src/utils/performance.js" ]; then
        print_status "Creating performance utilities..."
        touch src/utils/performance.js
        print_warning "Please implement performance.js as per the guide"
    fi
    
    print_status "Phase 1 structure created! Please implement the files according to the guide."
}

# Run tests and validation
run_tests() {
    print_status "Running tests and validation..."
    
    # Lint check
    print_status "Running linter..."
    npm run lint 2>/dev/null || print_warning "No lint script found"
    
    # Build test
    print_status "Testing build process..."
    npm run build
    
    # Bundle size check
    print_status "Checking bundle size..."
    du -sh dist/ 2>/dev/null || print_warning "Build directory not found"
    
    # Docker build test
    if [ -f "Dockerfile" ]; then
        print_status "Testing Docker build..."
        docker build -t claudeui-test . || print_warning "Docker build failed"
    fi
    
    print_status "Tests complete!"
}

# Create improvement branches
create_branches() {
    print_status "Creating Git branches for improvements..."
    
    git checkout -b feature/dark-mode 2>/dev/null || print_warning "Dark mode branch exists"
    git checkout -b feature/performance 2>/dev/null || print_warning "Performance branch exists"
    git checkout -b feature/accessibility 2>/dev/null || print_warning "Accessibility branch exists"
    git checkout -b feature/docker 2>/dev/null || print_warning "Docker branch exists"
    
    git checkout main 2>/dev/null || git checkout master
    print_status "Branches created!"
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter choice [1-8]: " choice
    
    case $choice in
        1)
            implement_phase1
            ;;
        2)
            print_warning "Phase 2 implementation coming soon..."
            ;;
        3)
            print_warning "Phase 3 implementation coming soon..."
            ;;
        4)
            print_warning "Phase 4 implementation coming soon..."
            ;;
        5)
            print_warning "Phase 5 implementation coming soon..."
            ;;
        6)
            setup_dev_env
            ;;
        7)
            run_tests
            ;;
        8)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice!"
            ;;
    esac
done