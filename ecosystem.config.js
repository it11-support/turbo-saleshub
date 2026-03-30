module.exports = {
  apps: [
    {
      name: "saleshub-backend",
      cwd: "/home/sysdevrco1/staging/turbo-saleshub/apps/backend", 
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "saleshub-frontend",
      cwd: "/home/sysdevrco1/staging/turbo-saleshub/apps/frontend",
      script: "pnpm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
