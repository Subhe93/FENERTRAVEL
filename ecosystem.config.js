module.exports = {
  apps: [
    {
      name: "fenertravel",
      script: "dist/server/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5030,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5030,
      },
      error_file: "/var/log/pm2/fenertravel-error.log",
      out_file: "/var/log/pm2/fenertravel-out.log",
      log_file: "/var/log/pm2/fenertravel.log",
      max_memory_restart: "1G",
      restart_delay: 4000,
      watch: false,
      ignore_watch: ["node_modules", "logs", "*.log"],
      // Auto restart if app crashes
      autorestart: true,
      // Max number of restarts in case of instability
      max_restarts: 10,
      // Time to wait before restarting
      min_uptime: "10s",
    },
  ],

  // deploy: {
  //   production: {
  //     user: "ubuntu",
  //     host: "your-server-ip",
  //     ref: "origin/main",
  //     repo: "https://github.com/your-username/fenertravel-app.git",
  //     path: "/var/www/fenertravel",
  //     "pre-deploy-local": "",
  //     "post-deploy":
  //       "yarn install && yarn build && npx prisma generate && npx prisma db push && pm2 reload ecosystem.config.js --env production",
  //     "pre-setup": "",
  //   },
  // },
};
