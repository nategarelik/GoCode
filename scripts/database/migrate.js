#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');
const DB_PATH = process.env.DATABASE_URL?.replace('sqlite://', '') || 
                path.join(__dirname, '../../server/database/app.db');

// Ensure database directory exists
async function ensureDbDirectory() {
    const dbDir = path.dirname(DB_PATH);
    await fs.mkdir(dbDir, { recursive: true });
}

// Create migrations table if it doesn't exist
function createMigrationsTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Get applied migrations
function getAppliedMigrations(db) {
    const rows = db.prepare('SELECT filename FROM migrations ORDER BY filename').all();
    return new Set(rows.map(row => row.filename));
}

// Apply a migration
function applyMigration(db, filename, sql) {
    console.log(`📝 Applying migration: ${filename}`);
    
    const transaction = db.transaction(() => {
        // Execute the migration SQL
        db.exec(sql);
        
        // Record the migration
        db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename);
    });
    
    try {
        transaction();
        console.log(`✅ Applied: ${filename}`);
    } catch (error) {
        console.error(`❌ Failed to apply ${filename}:`, error.message);
        throw error;
    }
}

// Main migration function
async function migrate() {
    console.log('🚀 Starting database migration...\n');
    
    try {
        // Ensure database directory exists
        await ensureDbDirectory();
        
        // Connect to database
        const db = new Database(DB_PATH);
        console.log(`📁 Database: ${DB_PATH}`);
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        // Create migrations table
        createMigrationsTable(db);
        
        // Get list of applied migrations
        const appliedMigrations = getAppliedMigrations(db);
        console.log(`📊 Already applied: ${appliedMigrations.size} migrations\n`);
        
        // Get all migration files
        const files = await fs.readdir(MIGRATIONS_DIR);
        const migrationFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure migrations run in order
        
        // Apply pending migrations
        let appliedCount = 0;
        for (const filename of migrationFiles) {
            if (!appliedMigrations.has(filename)) {
                const filepath = path.join(MIGRATIONS_DIR, filename);
                const sql = await fs.readFile(filepath, 'utf8');
                applyMigration(db, filename, sql);
                appliedCount++;
            }
        }
        
        if (appliedCount === 0) {
            console.log('✨ Database is up to date!');
        } else {
            console.log(`\n✅ Successfully applied ${appliedCount} migrations!`);
        }
        
        // Close database
        db.close();
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migrations if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrate();
}

export default migrate;