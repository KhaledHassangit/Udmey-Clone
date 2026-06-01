# Lumina Learn

Production-ready Mini Udemy clone with Netflix-style HLS video streaming.

## Apps

| Directory | Description |
|-----------|-------------|
| `udemy/` | Next.js 16 — students, instructors, API, auth, video |
| `dashbaord-react.js/admin/` | React + Vite — admin control center (separate) |

## Quick start

```bash
# Infrastructure
docker compose up postgres redis -d

# Main app
cd udemy
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev

# Admin (separate terminal)
cd dashbaord-react.js/admin
cp .env.example .env
npm install
npm run dev
```

See [DEPLOYMENT.md](../DEPLOYMENT.md) for production setup.

## Features

- Better Auth (email, OAuth, OTP via Resend)
- RBAC: Student, Instructor, Admin
- Course → Section → Lesson structure
- HLS streaming (360p/720p/1080p) via FFmpeg + Cloudflare R2
- Signed URLs, enrollment checks, email watermark
- Progress tracking, comments, reviews
- next-intl (EN + AR), PWA, Docker

## Brand

**Lumina Learn** — premium dark UI inspired by Stripe, Linear, and Netflix.
