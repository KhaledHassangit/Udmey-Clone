# Lumina Learn — Deployment Guide

Production deployment for the Mini Udemy clone monorepo.

## Architecture

| Service | Stack | Port |
|---------|-------|------|
| **web** | Next.js 16 (student + instructor + API) | 3000 |
| **admin** | React + Vite (admin only) | 5173 / 80 |
| **postgres** | PostgreSQL 16 | 5432 |
| **redis** | Redis 7 | 6379 |

Video pipeline: Upload → Cloudflare R2 → FFmpeg HLS (360p/720p/1080p) → Signed manifest URLs → HLS.js player.

---

## Prerequisites

- Node.js 22+
- Docker & Docker Compose (optional)
- [Neon](https://neon.tech) PostgreSQL database
- [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket
- [Resend](https://resend.com) API key (email OTP)
- Google & GitHub OAuth apps
- FFmpeg installed on the host running video processing

---

## Environment Variables

### Next.js (`udemy/.env`)

Copy `udemy/.env.example` and fill all values:

```bash
cp udemy/.env.example udemy/.env
```

Critical secrets (generate with `openssl rand -base64 32`):

- `BETTER_AUTH_SECRET`
- `VIDEO_TOKEN_SECRET`
- `ADMIN_API_SECRET`

### Admin dashboard (`dashbaord-react.js/admin/.env`)

```env
VITE_API_BASE_URL=https://your-next-app.vercel.app
VITE_ADMIN_API_SECRET=same-as-ADMIN_API_SECRET
```

---

## Local Development

### 1. Start infrastructure

```bash
docker compose up postgres redis -d
```

### 2. Main platform

```bash
cd udemy
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

### 3. Admin dashboard

```bash
cd dashbaord-react.js/admin
npm install
npm run dev
```

Open http://localhost:5173

---

## Database (Neon)

1. Create a Neon project and copy the connection string.
2. Set `DATABASE_URL` in production.
3. Run migrations:

```bash
cd udemy
npx prisma migrate deploy
```

---

## Cloudflare R2

1. Create an R2 bucket (e.g. `lumina-videos`).
2. Create API tokens with read/write access.
3. Set `R2_*` env vars in Next.js.
4. CORS: allow your app origin for PUT from presigned uploads.

Video processing requires FFmpeg on the server. On Vercel, use a separate worker (Railway, Fly.io, or AWS Lambda with FFmpeg layer) and call `/api/video/process` after upload.

---

## OAuth Setup

### Google

- Console: https://console.cloud.google.com/
- Redirect URI: `https://your-domain.com/api/auth/callback/google`

### GitHub

- Settings → Developer settings → OAuth Apps
- Callback: `https://your-domain.com/api/auth/callback/github`

---

## Docker Production

```bash
docker compose up --build -d
```

- Web: http://localhost:3000
- Admin: http://localhost:5173

Run migrations inside the web container:

```bash
docker compose exec web npx prisma migrate deploy
```

---

## Vercel (Next.js)

1. Import `udemy` as the root directory (or deploy from monorepo with root dir `udemy`).
2. Add all environment variables.
3. Build command: `prisma generate && next build`
4. Install FFmpeg is **not** available on Vercel — run video processing on a separate service.

---

## Admin Dashboard Hosting

Deploy `dashbaord-react.js/admin` to Netlify, Cloudflare Pages, or S3+CloudFront:

```bash
cd dashbaord-react.js/admin
npm run build
```

Set `VITE_API_BASE_URL` to your production Next.js URL.

**Security:** Admin UI never shares cookies with the main app. All admin API calls use `X-Admin-Secret` header verified server-side.

---

## PWA

Configured via `@ducanh2912/next-pwa` in `next.config.ts`. Add icons:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

Run Lighthouse after deploy; target 90+ PWA score.

---

## Role Promotion

After first user registers:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Or use the admin dashboard once `ADMIN_API_SECRET` is configured.

---

## Health Checks

- `GET /api/courses` — public catalog
- `GET /api/auth/session` — Better Auth session
- Admin: `GET /api/admin/analytics` with `X-Admin-Secret` header

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Video won't play | Check R2 keys, FFmpeg processing status, enrollment |
| OTP not sent | Verify `RESEND_API_KEY` and `EMAIL_FROM` |
| Admin 401 | Match `ADMIN_API_SECRET` and `VITE_ADMIN_API_SECRET` |
| Rate limits | Ensure `REDIS_URL` is set in production |
