#!/usr/bin/env bash
set -euo pipefail

# Deploy Winsurf landing on the same VPS as RECASH — isolated paths/ports.
# Usage (on VPS, from a checked-out release under /opt/winsurf-landing/current):
#   bash deploy/scripts/deploy_vps.sh
#
# DO NOT touch:
#   /opt/recash, /var/www/recash, PM2 recash-api, ports 3001 / 5432

DEPLOY_DIR="${DEPLOY_DIR:-/opt/winsurf-landing/current}"
SHARED_DIR="${SHARED_DIR:-/opt/winsurf-landing/shared}"
SHARED_ENV="${SHARED_ENV:-${SHARED_DIR}/.env}"

echo "[winsurf-landing] deploy → ${DEPLOY_DIR}"
cd "${DEPLOY_DIR}"

if [[ ! -f "${SHARED_ENV}" ]]; then
  echo "[winsurf-landing] falta ${SHARED_ENV}" >&2
  echo "  Copiá deploy/.env.example → ${SHARED_ENV} y completá secretos." >&2
  exit 1
fi

mkdir -p "${SHARED_DIR}/uploads" /var/log/winsurf-landing

ln -sfn "${SHARED_ENV}" "${DEPLOY_DIR}/.env"

set -a
# shellcheck disable=SC1091
source "${SHARED_ENV}"
set +a

echo "[winsurf-landing] npm install"
# Keep tailwind/etc available even if .env sets NODE_ENV=production
npm ci --include=dev

echo "[winsurf-landing] prisma"
npx prisma generate
npx prisma db push

if [[ ! -f "${SHARED_DIR}/.seeded" ]]; then
  echo "[winsurf-landing] seed inicial de números"
  npm run db:seed
  touch "${SHARED_DIR}/.seeded"
fi

echo "[winsurf-landing] build"
# Empty local uploads/ during build — Turbopack panics on symlink to shared/
rm -rf "${DEPLOY_DIR}/uploads"
mkdir -p "${DEPLOY_DIR}/uploads"
NODE_ENV=production npm run build

# Persist tenant videos across releases
rm -rf "${DEPLOY_DIR}/uploads"
ln -sfn "${SHARED_DIR}/uploads" "${DEPLOY_DIR}/uploads"

echo "[winsurf-landing] pm2"
NODE_ENV=production pm2 startOrReload deploy/pm2/ecosystem.config.cjs
pm2 save

echo "[winsurf-landing] listo — http://127.0.0.1:3005 (vía Nginx)"
echo "  Public: https://landing.titanes.site/?c=winsurf"
echo "  Admin:  https://landing.titanes.site/admin/login"
echo "  RECASH no fue modificado."
