# Winsurf / multi-landing

Landing multicliente: cada caja tiene slug, marca, destinos (WhatsApp o URL) y video propio.

## Setup local

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

- Landing ejemplo: http://localhost:3005/?c=winsurf
- Admin: http://localhost:3005/admin/login

### Credenciales seed

| Rol | Cómo entrar |
|-----|-------------|
| Superadmin | Usuario `admin` + `ADMIN_PASSWORD` (default `admin123`) |
| Cliente winsurf | Usuario `winsurf` + password `winsurf123` |

## URLs

- Pública: `/?c={slug}`
- Con origen: `/?c={slug}&o={origen}`
- Con suborigen: `/?c={slug}&o={origen}&so={suborigen}`
- Sin `c` o slug inválido → “Landing no encontrada”

El CTA reenvía `o` y `so` al destino (URL o mensaje de WhatsApp). No se envía ID de visitante.

## Admin

- **Superadmin** `/admin/super` — crear clientes, activar, reset password, copiar URL
- **Cliente** `/admin/settings` — marca + video; `/admin/destinations` — WA o URL

## Variables

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | SQLite |
| `ADMIN_PASSWORD` | Superadmin |
| `SESSION_SECRET` | Cookie JWT |
| `SEED_TENANT_PASSWORD` | Password inicial del tenant seed |
| `NEXT_PUBLIC_X_PIXEL_ID` | Pixel X (opcional) |

## Deploy VPS

Ver [deploy/README.production.md](deploy/README.production.md) — aislado de RECASH.
