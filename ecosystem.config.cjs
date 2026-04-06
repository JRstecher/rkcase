/**
 * PM2 : le dossier de travail est toujours la racine du dépôt (là où est ce fichier),
 * même si tu lances pm2 depuis un autre répertoire — évite l’erreur package.json sur /home/ubuntu.
 *
 * Sur le serveur : depuis la racine du projet
 *   pm2 start ecosystem.config.cjs
 * ou après mise à jour :
 *   pm2 reload ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "casebs",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
