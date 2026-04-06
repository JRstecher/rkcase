/**
 * PM2 : cwd = racine du dépôt. Next est lancé avec `node` (pas `npm`) pour éviter
 * les plantages si `npm` n’est pas dans le PATH du process PM2.
 *
 * Serveur : pm2 start /var/www/rkcase/ecosystem.config.cjs
 */
const path = require("path");

const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

module.exports = {
  apps: [
    {
      name: "casebs",
      cwd: __dirname,
      script: nextBin,
      args: "start -p 3000",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      max_restarts: 25,
      min_uptime: "8s",
      restart_delay: 5000,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
