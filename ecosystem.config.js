module.exports = {
  apps: [{
    name: 'gocode',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    },
    // Auto-restart on crash
    autorestart: true,
    // Wait before restarting
    restart_delay: 4000,
    // Max memory before restart
    max_memory_restart: '1G',
    // Log configuration
    error_file: 'logs/error.log',
    out_file: 'logs/output.log',
    log_file: 'logs/combined.log',
    time: true,
    // Load balancing (if using multiple cores)
    instances: 1,
    exec_mode: 'fork'
  }]
};
