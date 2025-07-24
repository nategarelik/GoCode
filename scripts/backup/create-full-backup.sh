#!/bin/bash

# Full system backup script
# Creates a complete backup of application data, configs, and database

set -e

# Configuration
BACKUP_DIR="${BACKUP_PATH:-/app/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="full-backup-${TIMESTAMP}"
TEMP_DIR="/tmp/${BACKUP_NAME}"

echo "🔄 Starting full system backup..."

# Create temporary directory
mkdir -p "${TEMP_DIR}"

# Backup database
echo "📊 Backing up database..."
node scripts/backup/database-backup.js

# Backup application data
echo "📁 Backing up application data..."
mkdir -p "${TEMP_DIR}/data"
if [ -d "/app/data" ]; then
    cp -r /app/data/* "${TEMP_DIR}/data/" 2>/dev/null || true
fi

# Backup logs (last 7 days only)
echo "📝 Backing up recent logs..."
mkdir -p "${TEMP_DIR}/logs"
find /app/logs -name "*.log" -mtime -7 -exec cp {} "${TEMP_DIR}/logs/" \; 2>/dev/null || true

# Backup environment configuration (without secrets)
echo "⚙️  Backing up configuration..."
mkdir -p "${TEMP_DIR}/config"
if [ -f ".env.production" ]; then
    grep -v "SECRET\|PASSWORD\|KEY" .env.production > "${TEMP_DIR}/config/env.production" || true
fi

# Create backup info file
cat > "${TEMP_DIR}/backup-info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")",
  "type": "full",
  "hostname": "$(hostname)",
  "components": ["database", "data", "logs", "config"]
}
EOF

# Create tarball
echo "🗜️  Creating archive..."
cd /tmp
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"

# Cleanup
rm -rf "${TEMP_DIR}"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)

# Clean old backups (keep last 10)
echo "🧹 Cleaning old backups..."
cd "${BACKUP_DIR}"
ls -t full-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f

echo "✅ Full backup completed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"
echo "📍 Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"