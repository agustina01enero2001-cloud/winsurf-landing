# Winsurf Landing

Landing page para Winsurf con rotación de números WhatsApp, 30 variantes de mensaje y tracking de X (Twitter).

## Stack

- Next.js 16 (App Router)
- Tailwind CSS 4
- Sin base de datos — números y mensajes en código (`lib/site-config.ts`)

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

- Landing: http://localhost:3005

## Configuración (código)

Editá estos archivos antes de deployar:

| Archivo | Qué configurar |
|---------|----------------|
| `lib/site-config.ts` | Números de WhatsApp (`WA_PHONES`) |
| `lib/default-wa-messages.ts` | 30 variantes de mensaje |
| `.env` | Pixel de X (`NEXT_PUBLIC_X_PIXEL_ID`, opcional) |

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_X_PIXEL_ID` | Pixel X — solo **PageView** (visitas desde el anuncio) |

La conversión real (primera carga) se reporta desde **chat-web** cuando se acredita el depósito, usando el `twclid` del mensaje (`codigo: …`).

## WhatsApp: rotación y twclid

Los botones llaman a `GET /api/wa-link`. El backend:

1. Selecciona un número activo (round-robin via cookie `wa-idx`)
2. Elige un mensaje al azar de las 30 variantes
3. Reemplaza variables (`{{marca}}`, `{{beneficio}}`, `{{twclid}}`)
4. Devuelve URL `wa.me`

**Variables en mensajes:**

- `{{beneficio}}` — default: "200% en primer ingreso"
- `{{marca}}` — default: "Winsurf"
- `{{twclid}}` — click ID de X desde `?twclid=...` en la URL

Todos los mensajes terminan en `codigo: {{twclid}}`.

Ejemplo: `https://tudominio.com/?twclid=abc123` → `...con mi codigo: abc123`

## X (Twitter) — qué mide cada capa

| Evento | Dónde | Qué es para ustedes |
|--------|-------|---------------------|
| **PageView** | Landing (pixel) | Tráfico — cuántos entraron desde el anuncio |
| **Purchase** | chat-web (Conversions API) | **Conversión real** — primera carga acreditada |

El botón de WhatsApp **no** dispara conversión a X. Solo pasa el `twclid` en el mensaje para que chat-web lo use al acreditar.

## Deploy en Netlify

1. Push a GitHub
2. Conectar repo en Netlify (usa `netlify.toml`)
3. Variable de entorno: `NEXT_PUBLIC_X_PIXEL_ID` (opcional, solo PageView)
4. Deploy — sin base de datos ni seed

## Scripts

```bash
npm run dev    # Desarrollo (puerto 3005)
npm run build  # Build producción
```
