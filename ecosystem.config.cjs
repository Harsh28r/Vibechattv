// PM2 Configuration for Production
module.exports = {
  apps: [{
    name: 'vibechat-backend',
    script: './server.js',
    instances: 1, // Use all CPU cores
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};

