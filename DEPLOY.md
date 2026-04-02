# Mettre RKCase en ligne (grand public)

L’app est prête pour un **serveur Linux** (VPS, machine dédiée, cloud avec VM) via **Docker**. La base **SQLite** doit rester sur un **disque persistant** (volume Docker ou dossier monté).

## Prérequis sur le serveur

- Docker et Docker Compose plugin installés
- Port **3000** ouvert (ou **80**/**443** derrière un reverse proxy)

## Déploiement rapide (Docker Compose)

Sur le serveur, dans le dossier du projet :

```bash
docker compose up -d --build
```

Puis ouvre dans le navigateur : `http://ADRESSE_IP_DU_SERVEUR:3000`

- Les migrations Prisma s’appliquent au démarrage.
- Les données SQLite sont stockées dans le volume nommé `rkcase-data` (`/data/dev.db` dans le conteneur).

## Pare-feu (ex. Ubuntu `ufw`)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

## HTTPS et nom de domaine (recommandé)

1. Crée un enregistrement **DNS A** : `tondomaine.tld` → IP publique du serveur.
2. Place un reverse proxy (ex. **Caddy** ou **Nginx**) qui écoute en **443** et renvoie vers `http://127.0.0.1:3000`.

Exemple minimal Caddy (`Caddyfile`) :

```text
tondomaine.tld {
  reverse_proxy 127.0.0.1:3000
}
```

Puis ouvre les ports **80** et **443** (`ufw allow 80,443/tcp`).

## Variables d’environnement

- En **Docker Compose**, `DATABASE_URL=file:/data/dev.db` est déjà défini.
- En **hors Docker** sur le VPS : dans `.env`, garde par exemple `DATABASE_URL="file:./dev.db"` et lance `npx prisma migrate deploy` puis `npm run start` (après `npm run build`).

## Limites à connaître

- **SQLite** : adapté à un seul serveur / un seul conteneur avec volume persistant. Pas adapté aux plateformes **serverless** type Vercel (fichier effacé à chaque déploiement). Pour du multi-instance ou du serverless, il faudrait migrer vers **PostgreSQL** (ou Turso, Neon, etc.).
- **Sécurité** : pour un vrai site public, prévois HTTPS, sauvegardes du fichier `dev.db`, et durcissement habituel (pare-feu, mises à jour OS).

## Vérification

Endpoint de santé : `GET /api/health` → `{ "ok": true, ... }`.
