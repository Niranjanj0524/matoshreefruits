/**
 * Expiry-cron verification (Phase 4): sitemap/robots, cron auth, and the
 * full expiry round-trip (real upload → backdate → cron destroys asset).
 *
 * Usage: npm run verify:expiry  (server must be running; default :3005)
 *        node scripts/verify-expiry.mjs http://127.0.0.1:3005
 *
 * Run from the project root (imports mongoose to backdate expiresAt).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const ROOT = process.cwd();
const BASE = process.argv[2] || "http://127.0.0.1:3005";

const env = {};
for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`PASS  ${name}${detail ? `  [${detail}]` : ""}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? `  [${detail}]` : ""}`);
  }
}

let cookie = "";
async function req(pathname, { method = "GET", body, headers = {} } = {}) {
  const h = { ...headers };
  if (cookie) h.Cookie = cookie;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(BASE + pathname, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, data };
}

const ts = Date.now();

// The login throttle is per-IP and in-memory; verify:site deliberately trips
// it at the end of its run. Use a per-run sentinel IP here so the two suites
// can be executed back-to-back without waiting out the 10-minute window.
const TEST_IP = `198.51.100.${ts % 250}`;

// ── 1. sitemap + robots ────────────────────────────────────────────────────
{
  const sm = await fetch(`${BASE}/sitemap.xml`);
  const body = await sm.text();
  check("sitemap renders", sm.status === 200, `status=${sm.status}`);
  check("sitemap has all locale roots",
    ["/mr", "/hi", "/en"].every((l) => body.includes(l)),
    "");
  check("sitemap has hreflang alternates", body.includes("hreflang"), "");
  check("sitemap lists subpages", body.includes("/stock") && body.includes("/gallery"), "");

  const rb = await fetch(`${BASE}/robots.txt`);
  const rbody = await rb.text();
  check("robots renders", rb.status === 200, `status=${rb.status}`);
  check("robots disallows /admin", rbody.includes("Disallow: /admin"), "");
  check("robots disallows /api", rbody.includes("Disallow: /api"), "");
  check("robots references sitemap", rbody.includes("Sitemap:"), "");
}

// ── 2. cron auth ───────────────────────────────────────────────────────────
{
  const noAuth = await req("/api/cron/expire-posts");
  check("cron rejects missing secret", noAuth.status === 401, `status=${noAuth.status}`);

  const wrong = await fetch(`${BASE}/api/cron/expire-posts`, {
    headers: { Authorization: "Bearer definitely-wrong" },
  });
  check("cron rejects wrong secret", wrong.status === 401, `status=${wrong.status}`);
}

// ── 3. login ───────────────────────────────────────────────────────────────
{
  const login = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": TEST_IP },
    body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
  });
  cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  check("admin login", login.status === 200 && Boolean(cookie), `status=${login.status}`);
}

// ── 4. real upload + temporary post + permanent post ───────────────────────
const sig = await req("/api/admin/upload-signature", { method: "POST" });
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
let uploaded = null;
if (sig.status === 200) {
  const fd = new FormData();
  fd.append("file", new Blob([png], { type: "image/png" }), "phase4-test.png");
  fd.append("api_key", sig.data.apiKey);
  fd.append("timestamp", String(sig.data.timestamp));
  fd.append("folder", sig.data.folder);
  fd.append("signature", sig.data.signature);
  const up = await fetch(sig.data.uploadUrl, { method: "POST", body: fd });
  const upData = await up.json().catch(() => ({}));
  uploaded = up.ok && upData.public_id ? upData : null;
  check("real Cloudinary upload works", Boolean(uploaded),
    `status=${up.status} ${upData?.error?.message || uploaded?.secure_url || ""}`);
}

function mediaOf(u) {
  return u
    ? [{
        provider: "cloudinary",
        publicId: u.public_id,
        url: u.url,
        secureUrl: u.secure_url,
        resourceType: u.resource_type === "video" ? "video" : "image",
        format: u.format || "png",
        bytes: u.bytes || 0,
        width: u.width || 0,
        height: u.height || 0,
        duration: u.duration || 0,
      }]
    : [];
}

const expiringTitle = `Phase4 expiring ${ts}`;
const liveTitle = `Phase4 live ${ts}`;
const permanentTitle = `Phase4 permanent ${ts}`;

const expiring = await req("/api/admin/posts", {
  method: "POST",
  body: {
    title: expiringTitle, titleMr: "", titleHi: "", body: "", bodyMr: "", bodyHi: "",
    media: mediaOf(uploaded), type: "temporary", status: "published",
  },
});
check("temporary post created", expiring.status === 201, `status=${expiring.status}`);
const expiringId = expiring.data?.post?._id;

const live = await req("/api/admin/posts", {
  method: "POST",
  body: {
    title: liveTitle, titleMr: "", titleHi: "", body: "", bodyMr: "", bodyHi: "",
    media: [], type: "temporary", status: "published",
  },
});
check("live temporary post created", live.status === 201, `status=${live.status}`);
const liveId = live.data?.post?._id;

const permanent = await req("/api/admin/posts", {
  method: "POST",
  body: {
    title: permanentTitle, titleMr: "", titleHi: "", body: "", bodyMr: "", bodyHi: "",
    media: [], type: "permanent", status: "published",
  },
});
check("permanent post created", permanent.status === 201, `status=${permanent.status}`);
const permanentId = permanent.data?.post?._id;

// expiring post visible on gallery before backdating
{
  const gal = await fetch(`${BASE}/mr/gallery`).then((r) => r.text());
  check("expiring post visible on gallery (pre-expiry)", gal.includes(expiringTitle), "");
}

// ── 5. backdate expiresAt → post is now "expired" ──────────────────────────
await mongoose.connect("mongodb://127.0.0.1:27017/matoshreefruits");
const Post = mongoose.model("Post", new mongoose.Schema({}, { strict: false }), "posts");
await Post.updateOne(
  { _id: new mongoose.Types.ObjectId(expiringId) },
  { $set: { expiresAt: new Date(Date.now() - 60 * 1000) } }
);
console.log("      (backdated expiresAt by 1 minute)");

// ── 6. run the cron ────────────────────────────────────────────────────────
{
  const run = await fetch(`${BASE}/api/cron/expire-posts`, {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const data = await run.json().catch(() => ({}));
  check("cron accepts valid secret", run.status === 200 && data.ok === true,
    `status=${run.status} ${JSON.stringify(data)}`);
  check("cron removed exactly the expired post",
    data.removed === 1, `removed=${data.removed}`);
  check("cron destroyed its Cloudinary asset",
    uploaded ? data.destroyed === 1 : data.destroyed === 0, `destroyed=${data.destroyed}`);
}

// ── 7. post-expiry assertions ──────────────────────────────────────────────
{
  const posts = await Post.find({ title: { $regex: `^Phase4 ` } }).lean();
  const titles = posts.map((p) => p.title);
  check("expired post deleted from DB", !titles.includes(expiringTitle), "");
  check("live temporary post survives cron", titles.includes(liveTitle), "");
  check("permanent post survives cron", titles.includes(permanentTitle), "");

  // cron revalidated the `posts` tag, so the gallery re-rendered without it
  const gal = await fetch(`${BASE}/mr/gallery`).then((r) => r.text());
  check("expired post gone from gallery after cron", !gal.includes(expiringTitle), "");

  if (uploaded) {
    const gone = await fetch(uploaded.secure_url, { method: "HEAD" });
    check("cloudinary asset destroyed by cron", gone.status === 404, `status=${gone.status}`);
  }
}

// second cron run: nothing left to do, must not double-count
{
  const run = await fetch(`${BASE}/api/cron/expire-posts`, {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  const data = await run.json().catch(() => ({}));
  check("second cron run is a no-op", data.ok && data.removed === 0 && data.destroyed === 0,
    JSON.stringify(data));
}

// ── 8. cleanup ─────────────────────────────────────────────────────────────
for (const [id, label] of [[liveId, "live"], [permanentId, "permanent"]]) {
  if (id) {
    const del = await req(`/api/admin/posts/${id}`, { method: "DELETE" });
    check(`cleanup: delete ${label} post`, del.status === 200, `status=${del.status}`);
  }
}
await mongoose.disconnect();

console.log(`\n${passed}/${passed + failed} checks passed`);
process.exit(failed === 0 ? 0 : 1);
