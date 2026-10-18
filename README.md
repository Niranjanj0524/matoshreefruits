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
| `npm run verify:site` | 61-check end-to-end suite against a running server (Phase 5) |
| `npm run verify:expiry` | 27-check expiry-cron suite (Phase 5) |

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
  verify-site.mjs      61-check live suite: i18n, admin, CRUD, wall, price scan
  verify-expiry.mjs    27-check cron suite: backdate → cron → asset destroyed
```

## Roadmap

- [x] **Phase 1** — Project setup, MongoDB models, admin bootstrap, i18n foundation
- [x] **Phase 2** — Public website & UI (homepage, stock, gallery, contact, feedback, language switcher)
- [x] **Phase 3** — Admin dashboard & Cloudinary media uploads
- [x] **Phase 4** — Automatic media expiry (7-day temporary posts) & business features
- [x] **Phase 5a** — Verification suites (`verify:site`, `verify:expiry`), production build green
- [ ] **Phase 5b** — Vercel deployment + matoshreefruits.com domain

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
- Login is bcrypt-checked with an 8-*failed*-attempts/10-minutes per-IP rate
  limit (a successful login clears the counter) and a generic error message.
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
  secret is not configured). `vercel.json` schedules it daily (Vercel Hobby allows one cron run per day).
- Public pages also hide expired posts immediately via the live-post filter,
  so the site stays correct even between cron runs.
- `/sitemap.xml` (per-locale hreflang alternates) and `/robots.txt`
  (disallows `/admin` and `/api`) ship with the site.

## Testing (Phase 5)

Two live end-to-end suites run against a **production build** (`npm run build`,
then `npm run start`), each cleaning up the data it creates:

```bash
npm run start -- -p 3005        # production server
npm run verify:site             # 61 checks: locales, admin auth, sessions,
                                # CSRF, rate limits, post/stock CRUD + public
                                # visibility, Cloudinary upload, feedback wall,
                                # no-price scan, sitemap/robots/health
npm run verify:expiry           # 27 checks: cron auth (401/503), real upload
                                # → backdate expiresAt → cron destroys asset +
                                # deletes post; live/permanent posts survive;
                                # second run is a no-op
```

Notes:

- The login rate limiter (8 *failed* attempts / 10 min / IP, in-memory) is
  shared by both suites, so `verify:site` deliberately exhausts it at the end
  of its run. The suites can still run back-to-back: a successful login
  clears the counter, and `verify:expiry` presents its own per-run sentinel
  `X-Forwarded-For` IP so it isn't blocked by the earlier lockout.
- The suites read `.env.local` for admin credentials and `CRON_SECRET`, and
  need MongoDB running. `verify:expiry` also needs valid Cloudinary keys.
- Test feedback is approved → wall-published → deleted inside the suite; the
  pre-approve wall fetch is followed by a short settle so Next's background
  revalidation can finish before `revalidateTag` fires (see comment in
  `scripts/verify-site.mjs`).

## Deployment (Phase 5) — checklist

Actual deployment needs the owner's accounts; the repo is prepared for it:

1. **Vercel project** — import the repo (Next.js is auto-detected).
2. **Environment variables** (Project → Settings → Environment Variables):
   `MONGODB_URI` (Atlas `mongodb+srv://…`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `ADMIN_NAME`, `SESSION_SECRET`, `NEXT_PUBLIC_WHATSAPP_NUMBER`,
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `CRON_SECRET` (all documented in `.env.local.example`).
3. **Cron** — `vercel.json` already schedules `expire-posts` daily (Vercel Hobby
   allows one cron run per day); no extra
   setup. Set `CRON_SECRET` to a long random hex and keep it only in Vercel.
4. **MongoDB Atlas** — free M0 cluster → database user → allow access from
   Vercel (or 0.0.0.0/0) → paste the connection string into `MONGODB_URI` →
   run `npm run create-admin` once with the production env values.
5. **Domain (matoshreefruits.com)** — buy it (any registrar), then in Vercel
   → Project → Settings → Domains add it; point the registrar's DNS at
   Vercel (A record `@` → `76.76.21.21`, CNAME `www` →
   `cname.vercel-dns.com`). Vercel provisions HTTPS automatically.
6. **Replace placeholders before launch**: WhatsApp number (all
   `919999999999`), contact phone/address/hours/email, and the admin password.

## Security notes

- `.env.local` is git-ignored — never commit secrets.
- Admin passwords are stored as bcrypt hashes only.
- No public pricing anywhere: all enquiries go through WhatsApp buttons.
- Admin session cookies are httpOnly + sameSite=lax (+ secure in production);
  session reads are server-side, and admin APIs re-check auth independently of
  the UI.
