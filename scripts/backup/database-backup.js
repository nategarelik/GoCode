#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { gzip } from 'zlib';

const gzipAsync = promisify(gzip);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, '../../backups');
const DB_PATH = process.env.DATABASE_URL?.replace('sqlite://', '') || 
                path.join(__dirname, '../../server/database/app.db');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 30;

// Create backup directory if it doesn't exist
async function ensureBackupDirectory() {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
}

// Generate backup filename
function generateBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup-${timestamp}.db.gz`;
}

// Execute SQLite backup command
async function createSQLiteBackup(sourcePath, destPath) {
    // For SQLite, we can simply copy the file when no active connections
    // In production, use sqlite3 .backup command or proper backup tools
    try {
        await fs.copyFile(sourcePath, destPath);
    } catch (error) {
        throw new Error(`Backup failed: ${error.message}`);
    }
}

// Compress backup file
async function compressBackup(filepath) {
    const data = await fs.readFile(filepath);
    const compressed = await gzipAsync(data);
    const gzPath = `${filepath}.gz`;
    await fs.writeFile(gzPath, compressed);
    await fs.unlink(filepath); // Remove uncompressed file
    return gzPath;
}

// Clean old backups
async function cleanOldBackups() {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
        .filter(f => f.startsWith('backup-') && f.endsWith('.db.gz'))
        .map(f => ({
            name: f,
            path: path.join(BACKUP_DIR, f)
        }));
    
    // Sort by creation time (newest first)
    const fileStats = await Promise.all(
        backupFiles.map(async (file) => ({
            ...file,
            stats: await fs.stat(file.path)
        }))
    );
    
    fileStats.sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    // Remove old backups
    const toRemove = fileStats.slice(MAX_BACKUPS);
    for (const file of toRemove) {
        console.log(`🗑️  Removing old backup: ${file.name}`);
        await fs.unlink(file.path);
    }
}

// Create metadata file
async function createMetadata(backupFile) {
    const stats = await fs.stat(DB_PATH);
    const metadata = {
        timestamp: new Date().toISOString(),
        source: DB_PATH,
        backup: backupFile,
        size: stats.size,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || 'unknown'
    };
    
    const metadataPath = backupFile.replace('.db.gz', '.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

// Main backup function
async function backup() {
    console.log('🔄 Starting database backup...\n');
    
    try {
        // Ensure backup directory exists
        await ensureBackupDirectory();
        console.log(`📁 Backup directory: ${BACKUP_DIR}`);
        
        // Check if database exists
        try {
            await fs.access(DB_PATH);
        } catch {
            console.log('⚠️  No database found to backup');
            return;
        }
        
        // Generate backup filename
        const backupFilename = generateBackupFilename();
        const tempBackupPath = path.join(BACKUP_DIR, backupFilename.replace('.gz', ''));
        
        // Create backup
        console.log('📝 Creating database backup...');
        await createSQLiteBackup(DB_PATH, tempBackupPath);
        
        // Compress backup
        console.log('🗜️  Compressing backup...');
        const compressedPath = await compressBackup(tempBackupPath);
        
        // Create metadata
        await createMetadata(compressedPath);
        
        // Get file size
        const stats = await fs.stat(compressedPath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log(`✅ Backup created: ${path.basename(compressedPath)} (${sizeMB} MB)`);
        
        // Clean old backups
        console.log('\n🧹 Cleaning old backups...');
        await cleanOldBackups();
        
        console.log('\n✅ Backup completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Backup failed:', error.message);
        process.exit(1);
    }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    backup();
}

export default backup;