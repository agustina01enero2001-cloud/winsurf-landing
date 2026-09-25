module.exports = {
  apps: [
    {
      name: "winsurf-landing",
      cwd: "/opt/winsurf-landing/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3005",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
      env: {
        NODE_ENV: "production",
        PORT: "3005",
        HOSTNAME: "127.0.0.1",
      },
      env_file: "/opt/winsurf-landing/shared/.env",
      out_file: "/var/log/winsurf-landing/out.log",
      error_file: "/var/log/winsurf-landing/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
