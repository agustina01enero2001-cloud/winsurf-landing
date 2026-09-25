# Winsurf landing — producción en el mismo VPS que RECASH (aislado)

Este sitio **no** comparte DB, puerto, PM2 ni paths con RECASH (`gestion-hg-billeteras`).

## Aislamiento (no tocar RECASH)

| RECASH (no modificar) | Winsurf landing |
|-----------------------|-----------------|
| `/opt/recash` | `/opt/winsurf-landing` |
| `/var/www/recash` | (no usa static SPA; Next en PM2) |
| PM2 `recash-api` | PM2 `winsurf-landing` |
| `127.0.0.1:3001` | `127.0.0.1:3005` |
| Postgres Docker `:5432` | SQLite en `shared/data.db` |
| `recash.cloud` | `landing.recash.cloud` |

ufw sigue solo 80/443; Nginx es el único edge público.

## Setup inicial (una vez)

```bash
sudo mkdir -p /opt/winsurf-landing/shared /opt/winsurf-landing/releases /var/log/winsurf-landing
sudo chown -R "$USER":"$USER" /opt/winsurf-landing /var/log/winsurf-landing

# Env (fuera del git tree)
cp deploy/.env.example /opt/winsurf-landing/shared/.env
nano /opt/winsurf-landing/shared/.env   # ADMIN_PASSWORD, SESSION_SECRET, etc.

# Código
git clone <repo-url> /opt/winsurf-landing/releases/$(date +%Y%m%d%H%M%S)
ln -sfn /opt/winsurf-landing/releases/<stamp> /opt/winsurf-landing/current

cd /opt/winsurf-landing/current
bash deploy/scripts/deploy_vps.sh
```

## DNS

| Tipo | Nombre | Valor | TTL |
|------|--------|--------|-----|
| A | `landing` | `187.127.53.50` (misma IP que `@`) | 300 |

## Nginx

```bash
sudo cp deploy/nginx/winsurf-landing.conf /etc/nginx/sites-available/winsurf-landing
sudo ln -sfn /etc/nginx/sites-available/winsurf-landing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Cuando el DNS A de landing.recash.cloud ya apunta al VPS:
sudo certbot --nginx -d landing.recash.cloud
```

## Redeploy

```bash
cd /opt/winsurf-landing/current
git pull   # o rsync un release nuevo + actualizar symlink current
bash deploy/scripts/deploy_vps.sh
```

El seed corre **solo la primera vez** (marca `shared/.seeded`). Después gestioná clientes en `/admin`.

## Admin

- URL: `https://landing.recash.cloud/admin/login`
- Superadmin: usuario `admin` + `ADMIN_PASSWORD` del `.env` en `shared/`
- Landing ejemplo: `https://landing.recash.cloud/?c=winsurf`

## Checklist de no interferencia

- [ ] No usás puerto `3001` ni `5432`
- [ ] PM2 app name es `winsurf-landing` (no `recash-api`)
- [ ] Nginx `server_name` es `landing.recash.cloud` (no apex `recash.cloud`)
- [ ] SQLite + uploads solo bajo `/opt/winsurf-landing/shared/`
- [ ] `pm2 list` muestra ambos apps vivos tras el deploy
