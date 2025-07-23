#!/bin/bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node v20
nvm use 20

# Verify version
echo "Using Node $(node -v)"

# Run the dev server
npm run dev