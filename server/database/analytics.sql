-- Analytics Database Schema for Claude Code UI

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    project_id TEXT,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost REAL NOT NULL,
    response_time INTEGER, -- milliseconds
    status TEXT CHECK(status IN ('success', 'error', 'timeout')),
    error_message TEXT,
    user_id INTEGER,
    session_id TEXT
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metric_type TEXT CHECK(metric_type IN ('api_latency', 'processing_time', 'queue_time', 'total_time')),
    value INTEGER NOT NULL, -- milliseconds
    model TEXT NOT NULL,
    project_id TEXT,
    percentile INTEGER CHECK(percentile IN (50, 75, 90, 95, 99))
);

-- Daily aggregated metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    project_id TEXT,
    model TEXT NOT NULL,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    avg_response_time INTEGER,
    error_rate REAL,
    UNIQUE(date, project_id, model)
);

-- Cost alerts configuration
CREATE TABLE IF NOT EXISTS cost_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT CHECK(alert_type IN ('daily', 'weekly', 'monthly', 'total')),
    threshold REAL NOT NULL,
    project_id TEXT,
    enabled BOOLEAN DEFAULT 1,
    last_triggered DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance alerts configuration
CREATE TABLE IF NOT EXISTS performance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_type TEXT CHECK(metric_type IN ('response_time', 'error_rate', 'token_usage')),
    threshold REAL NOT NULL,
    comparison TEXT CHECK(comparison IN ('greater_than', 'less_than')),
    enabled BOOLEAN DEFAULT 1,
    last_triggered DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Model pricing configuration
CREATE TABLE IF NOT EXISTS model_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL UNIQUE,
    input_token_price REAL NOT NULL, -- price per 1M tokens
    output_token_price REAL NOT NULL, -- price per 1M tokens
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default model pricing (as of 2024)
INSERT OR REPLACE INTO model_pricing (model, input_token_price, output_token_price) VALUES
('claude-3-opus-20240229', 15.0, 75.0),
('claude-3-sonnet-20240229', 3.0, 15.0),
('claude-3-haiku-20240307', 0.25, 1.25),
('claude-3-5-sonnet-20241022', 3.0, 15.0),
('claude-3-5-haiku-20241022', 1.0, 5.0);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_project ON usage_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_model ON usage_metrics(model);
CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_project ON daily_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);