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
| `npm run seed` | Insert sample stock + announcement posts (Phase 2 content) |

## Project structure

```
src/
  app/[locale]/        Public site — mr (default), hi, en
    components/        Header, Footer, LanguageSwitcher, StockCard, PostCard,
                       GalleryClient, FeedbackForm, WhatsAppButton, Icons…
    stock/ gallery/ contact/ feedback/   Public pages
    loading.js error.js not-found.js     Route states
  app/api/             API route handlers (health, feedback, admin, cron…)
  app/admin/           Admin dashboard — login + guarded panel
    login/             Sign-in page (public)
    (panel)/           Session-gated: dashboard, posts, stock, feedback
    components/        AdminShell, AdminNav, PostEditor, MediaUploader,
                       StockManager, FeedbackManager, LoginForm, ui helpers
  lib/                 db.js, content.js (cached queries), whatsapp.js,
                       media.js, site.js, localize.js, cloudinary.js (signing +
                       destroy), i18n.js, session.js (HMAC admin session),
                       admin.js (admin validation), admin-data.js (uncached
                       admin queries)
  messages/            mr.json, hi.json, en.json translation dictionaries
  models/              Admin, Post, Stock, Feedback
  proxy.js             Locale redirect ("/" → last used language, else /mr)
scripts/
  create-admin.js      Secure admin bootstrap (bcrypt)
  test-models.js       Model CRUD smoke test
  seed-sample.js       Sample stock + announcements (npm run seed)
```

## Roadmap

- [x] **Phase 1** — Project setup, MongoDB models, admin bootstrap, i18n foundation
- [x] **Phase 2** — Public website & UI (homepage, stock, gallery, contact, feedback, language switcher)
- [x] **Phase 3** — Admin dashboard & Cloudinary media uploads
- [x] **Phase 4** — Automatic media expiry (7-day temporary posts) & business features
- [ ] **Phase 5** — Testing, Vercel deployment, matoshreefruits.com domain

## About the business

One website, one admin. Matoshree Fruits is a small *vyapari*: it buys banana
lots **directly from farmers** at the mandi and supplies them onward in bulk to
bigger traders and wholesalers (B2B). The admin publishes photos/videos of the
lots; buyers enquire on WhatsApp.

**No price is ever displayed publicly** — the `Stock` model has no price field,
pages only show quantity, quality, location and availability, and every page
carries a "rates on request" note plus WhatsApp enquiry buttons.

## Admin (Phase 3)

- URL: `/admin/login` (unlisted — the public site never links to it).
- Every `/api/admin/*` route verifies an HMAC-signed `mf_session` cookie
  (`SESSION_SECRET`) and rejects cross-origin writes (Origin check).
- Login is bcrypt-checked with an 8-attempts/10-minutes per-IP rate limit and a
  generic error message.
- Uploads are signed server-side and go **browser → Cloudinary directly**, so
  the API secret never reaches the client and large videos bypass serverless
  body limits. Removing media confirms first, then destroys the cloud asset.
- Temporary posts stamp `expiresAt = published + 7d` when they go live;
  re-editing a live post never extends the window.

## Expiry cron (Phase 4)

- `GET/POST /api/cron/expire-posts` deletes temporary posts whose window has
  closed: it destroys the Cloudinary assets first, then removes the post
  documents, and revalidates the public pages. Runs are idempotent.
- Auth: `Authorization: Bearer $CRON_SECRET` (401 without it, 503 if the
  secret is not configured). `vercel.json` schedules it hourly.
- Public pages also hide expired posts immediately via the live-post filter,
  so the site stays correct even between cron runs.
- `/sitemap.xml` (per-locale hreflang alternates) and `/robots.txt`
  (disallows `/admin` and `/api`) ship with the site.

## Security notes

- `.env.local` is git-ignored — never commit secrets.
- Admin passwords are stored as bcrypt hashes only.
- No public pricing anywhere: all enquiries go through WhatsApp buttons.
- Admin session cookies are httpOnly + sameSite=lax (+ secure in production);
  session reads are server-side, and admin APIs re-check auth independently of
  the UI.
