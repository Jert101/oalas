// PM2 Ecosystem Configuration for OALASS
module.exports = {
  apps: [
    {
      name: 'oalass-app',
      script: 'server.js',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      
      // Environment variables
      env_file: './config/production.env'
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/oalass.git',
      path: '/var/www/oalass',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
}
