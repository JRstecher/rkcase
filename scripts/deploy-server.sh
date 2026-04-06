#!/usr/bin/env bash
# À exécuter SUR le serveur Linux (SSH), depuis le clone Git du projet.
#   chmod +x scripts/deploy-server.sh
#   ./scripts/deploy-server.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ">>> Dossier : $ROOT"
test -f package.json

echo ">>> git pull"
git pull origin main

echo ">>> npm ci"
npm ci

echo ">>> prisma"
npx prisma generate
npx prisma migrate deploy

echo ">>> build"
npm run build

echo ">>> pm2"
if pm2 describe casebs >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo ">>> Test local (doit afficher 200 ou 307)"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/ || true

echo ">>> Terminé. Vérifie Nginx : proxy_pass http://127.0.0.1:3000; (pas localhost)"
