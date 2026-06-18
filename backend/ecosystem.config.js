module.exports = {
  apps: [{
    name: 'inventario-api',
    script: 'src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/pm2/inventario-error.log',
    out_file:   '/var/log/pm2/inventario-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '512M',
  }],
};
