# 🍌 Matoshree Fruits — matoshreefruits.com

Wholesale banana trading website: fresh arrivals, live stock, photo/video gallery,
WhatsApp enquiries and a trilingual experience (मराठी / हिन्दी / English).

> "Fresh arrivals. Trusted quality. Direct connection."

## Tech stack

| Component | Technology |
| --- | --- |
| Frontend + backend | Next.js 16 (App Router, JavaScript/JSX) |
| Styling | Tailwind CSS v4 |
| Database | MongoDB (local dev → Atlas in production) + Mongoose |
| Media storage | Cloudinary (Phase 3) |
| Hosting | Vercel (Phase 5) |

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your values
npm run create-admin               # seed the admin account
npm run dev
```

- Site: http://localhost:3000 (redirects to /mr)
- Health check: http://localhost:3000/api/health

### Local MongoDB (current default)

`.env.local` points at a local MongoDB:

```
MONGODB_URI=mongodb://127.0.0.1:27017/matoshreefruits
```

Start it manually (installed service is currently unstable):

```powershell
Start-Process "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" `
  -ArgumentList '--dbpath', "$env:LOCALAPPDATA\mongodb-data", '--port', '27017', '--bind_ip', '127.0.0.1' `
  -WindowStyle Hidden
```

To switch to Atlas later, just replace `MONGODB_URI` with the `mongodb+srv://` string.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run create-admin` | Create/update the admin account from `.env.local` |
| `npm run test:models` | CRUD smoke test for all Mongoose models |

## Project structure

```
src/
  app/[locale]/        Public site — mr (default), hi, en
  app/api/             API route handlers (health, admin, cron…)
  app/admin/           Admin dashboard (Phase 3)
  lib/                 db.js (cached Mongoose), cloudinary.js, i18n.js
  messages/            mr.json, hi.json, en.json translation dictionaries
  models/              Admin, Post, Stock, Feedback
  proxy.js             Locale redirect ("/" → "/mr")
scripts/
  create-admin.js      Secure admin bootstrap (bcrypt)
  test-models.js       Model CRUD smoke test
```

## Roadmap

- [x] **Phase 1** — Project setup, MongoDB models, admin bootstrap, i18n foundation
- [ ] **Phase 2** — Public website & UI (homepage, stock, gallery, contact, feedback, language switcher)
- [ ] **Phase 3** — Admin dashboard & Cloudinary media uploads
- [ ] **Phase 4** — Automatic media expiry (7-day temporary posts) & business features
- [ ] **Phase 5** — Testing, Vercel deployment, matoshreefruits.com domain

## Security notes

- `.env.local` is git-ignored — never commit secrets.
- Admin passwords are stored as bcrypt hashes only.
- No public pricing anywhere: all enquiries go through WhatsApp buttons.
