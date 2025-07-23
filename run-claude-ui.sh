#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
echo "Using Node $(node -v)"

# Check if rebuild is needed
NODE_VERSION_FILE=".node-version"
CURRENT_NODE_VERSION=$(node -v)

if [ ! -f "$NODE_VERSION_FILE" ] || [ "$(cat $NODE_VERSION_FILE)" != "$CURRENT_NODE_VERSION" ]; then
    echo "Node version changed, rebuilding native modules..."
    npm rebuild
    echo "$CURRENT_NODE_VERSION" > "$NODE_VERSION_FILE"
fi

# Install if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
npm run dev
