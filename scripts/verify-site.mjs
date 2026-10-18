/**
 * Site verification (Phase 3): admin auth, admin APIs, CRUD round-trips,
 * Cloudinary upload signing, public-site regressions (expiry, no price).
 *
 * Usage: npm run verify:site   (server must be running; default :3005)
 *        node scripts/verify-site.mjs http://127.0.0.1:3005
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const BASE = process.argv[2] || "http://127.0.0.1:3005";

// Load .env.local for ADMIN_EMAIL / ADMIN_PASSWORD
const env = {};
for (const line of readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

let passed = 0;
let failed = 0;
const results = [];

// Unique per run — a fixed string let leftovers from interrupted runs poison
// the wall checks (an old approved copy made "unapproved hidden" fail).
const FB_MSG = `Phase3 feedback sentinel ${Date.now()}`;

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (ok) passed++;
  else failed++;
}

let cookie = "";

async function req(pathname, { method = "GET", body, headers = {}, raw = false, redirect = "manual" } = {}) {
  const h = { ...headers };
  if (cookie) h.Cookie = cookie;
  if (body !== undefined && !h["Content-Type"]) h["Content-Type"] = "application/json";
  const res = await fetch(BASE + pathname, {
    method,
    redirect,
    headers: h,
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  // capture set-cookie
  const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of sc) {
    if (c.startsWith("mf_session=")) {
      const value = c.split(";")[0];
      cookie = value; // keep full name=value
    }
    if (c.includes("mf_session=;") && c.includes("Max-Age=0")) cookie = "";
  }
  if (raw) return res;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, headers: res.headers, data };
}

async function text(pathname, headers = {}) {
  const res = await fetch(BASE + pathname, { headers: { Cookie: cookie, ...headers } });
  return { status: res.status, body: await res.text() };
}

/** Poll until `needle` appears (revalidation is request-triggered; give it a moment). */
async function pollText(pathname, needle, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    const r = await text(pathname);
    if (r.body.includes(needle)) return true;
    if (i < attempts - 1) await new Promise((res) => setTimeout(res, 1000));
  }
  return false;
}

async function main() {
  // ── 1. Public routes still work ────────────────────────────────────────
  const home = await text("/mr");
  check("public /mr renders", home.status === 200, `status=${home.status}`);

  // ── 2. Admin routes redirect when logged out (proxy-level gate) ────────
  cookie = "";
  for (const p of ["/admin", "/admin/posts", "/admin/stock", "/admin/feedback", "/admin/posts/new"]) {
    const r = await fetch(BASE + p, { redirect: "manual" });
    check(
      `unauthenticated ${p} redirects to login`,
      r.status >= 300 && r.status < 400 &&
        (r.headers.get("location") || "").includes("/admin/login"),
      `status=${r.status} loc=${r.headers.get("location")}`
    );
    // No admin data may leak into the response body of a blocked request.
    const body = await r.text();
    check(
      `no admin data leaked on blocked ${p}`,
      !body.includes("Feedback awaiting review") && !body.includes("Phase3 sentinel"),
      body.includes("Phase3 sentinel") ? "payload leak" : ""
    );
  }
  const loginPage = await text("/admin/login");
  check("/admin/login renders", loginPage.status === 200 && loginPage.body.includes("Sign in"),
    `status=${loginPage.status}`);

  // ── 3. Admin APIs reject unauthenticated calls ─────────────────────────
  for (const [method, p, b] of [
    ["GET", "/api/admin/posts", undefined],
    ["POST", "/api/admin/posts", { title: "x" }],
    ["GET", "/api/admin/session", undefined],
    ["POST", "/api/admin/upload-signature", undefined],
    ["GET", "/api/admin/feedback", undefined],
  ]) {
    const r = await req(p, { method, body: b, raw: true });
    check(`401 without cookie: ${method} ${p}`, r.status === 401, `status=${r.status}`);
  }

  // ── 4. Login: wrong password, then correct ─────────────────────────────
  const bad = await req("/api/admin/login", {
    method: "POST",
    body: { email: env.ADMIN_EMAIL, password: "definitely-wrong-password" },
  });
  check("login rejects wrong password", bad.status === 401, `status=${bad.status}`);

  const good = await req("/api/admin/login", {
    method: "POST",
    body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  });
  check("login accepts correct credentials", good.status === 200 && good.data?.ok,
    `status=${good.status} ${JSON.stringify(good.data)}`);
  check("session cookie set", cookie.includes("mf_session="), cookie.slice(0, 30));

  const session = await req("/api/admin/session");
  check("session returns admin identity",
    session.status === 200 && session.data?.admin?.email === env.ADMIN_EMAIL,
    JSON.stringify(session.data));

  // ── 5. Admin pages render when authenticated ───────────────────────────
  for (const p of ["/admin", "/admin/posts", "/admin/stock", "/admin/feedback", "/admin/posts/new"]) {
    const r = await text(p);
    check(`admin page renders: ${p}`, r.status === 200, `status=${r.status}`);
  }

  // ── 6. Cross-origin writes blocked (CSRF) ──────────────────────────────
  const csrf = await req("/api/admin/posts", {
    method: "POST",
    body: { title: "csrf probe", type: "temporary", status: "draft" },
    headers: { Origin: "https://evil.example.com" },
  });
  check("cross-origin write rejected (403)", csrf.status === 403, `status=${csrf.status}`);

  // ── 7. Upload signature correctness ────────────────────────────────────
  const sig = await req("/api/admin/upload-signature", { method: "POST" });
  check("upload signature issued", sig.status === 200 && sig.data?.ok && sig.data?.signature,
    JSON.stringify(sig.data).slice(0, 120));
  if (sig.status === 200) {
    const recomputed = crypto
      .createHash("sha1")
      .update(`folder=${sig.data.folder}&timestamp=${sig.data.timestamp}` + env.CLOUDINARY_API_SECRET)
      .digest("hex");
    check("signature matches Cloudinary algorithm", recomputed === sig.data.signature,
      `${recomputed.slice(0, 10)} vs ${String(sig.data.signature).slice(0, 10)}`);
  }

  // ── 8. Post CRUD round-trip (with a real Cloudinary upload) ────────────
  // 8a. Real upload: 1×1 PNG via signed params
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  let uploaded = null;
  if (sig.status === 200) {
    const fd = new FormData();
    fd.append("file", new Blob([png], { type: "image/png" }), "phase3-test.png");
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

  // 8b. Create post
  const media = uploaded
    ? [{
        provider: "cloudinary",
        publicId: uploaded.public_id,
        url: uploaded.url,
        secureUrl: uploaded.secure_url,
        resourceType: uploaded.resource_type === "video" ? "video" : "image",
        format: uploaded.format || "png",
        bytes: uploaded.bytes || 0,
        width: uploaded.width || 0,
        height: uploaded.height || 0,
        duration: uploaded.duration || 0,
      }]
    : [];

  const created = await req("/api/admin/posts", {
    method: "POST",
    body: {
      title: "Phase3 sentinel post",
      titleMr: "Phase3 sentinel",
      titleHi: "Phase3 sentinel",
      body: "temporary publish window",
      type: "temporary",
      status: "published",
      media,
    },
  });
  check("create post", created.status === 201 && created.data?.post?._id,
    `status=${created.status} ${JSON.stringify(created.data).slice(0, 200)}`);
  const postId = created.data?.post?._id;

  if (postId) {
    // 8c. Expiry = now + 7 days
    const expiresAt = created.data.post.expiresAt ? new Date(created.data.post.expiresAt) : null;
    const diff = expiresAt ? expiresAt.getTime() - Date.now() : 0;
    check("temporary published post expires in ~7 days",
      diff > 6.9 * 864e5 && diff < 7.1 * 864e5, `diff=${Math.round(diff / 3600000)}h`);

    // 8d. Appears on the public gallery after revalidation
    const gal = await text("/mr/gallery");
    check("published sentinel visible on public gallery",
      gal.status === 200 && gal.body.includes("Phase3 sentinel"), `status=${gal.status}`);

    // 8e. Unpublish → hidden from public
    const unpub = await req(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      body: { status: "unpublished" },
    });
    check("unpublish via PATCH", unpub.status === 200 && unpub.data?.post?.status === "unpublished",
      `status=${unpub.status}`);
    const gal2 = await text("/mr/gallery");
    check("unpublished sentinel hidden from gallery",
      !gal2.body.includes("Phase3 sentinel"), "");

    // 8f. Republish → visible again
    const repub = await req(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      body: { status: "published" },
    });
    check("republish resets a fresh 7-day window", repub.status === 200, `status=${repub.status}`);
    const gal3 = await text("/mr/gallery");
    check("republished sentinel visible again", gal3.body.includes("Phase3 sentinel"), "");

    // 8g. Edit title
    const edited = await req(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      body: { title: "Phase3 sentinel edited" },
    });
    check("edit post title", edited.status === 200 && edited.data?.post?.title === "Phase3 sentinel edited",
      `status=${edited.status}`);

    // 8h. Delete post (destroys cloud media)
    const del = await req(`/api/admin/posts/${postId}`, { method: "DELETE" });
    check("delete post", del.status === 200 && del.data?.ok, `status=${del.status} ${JSON.stringify(del.data)}`);
    if (uploaded) {
      check("cloudinary asset destroyed on delete", del.data?.destroyed >= 1,
        `destroyed=${del.data?.destroyed}`);
      // Verify asset is really gone
      const gone = await fetch(uploaded.secure_url, { method: "HEAD" });
      check("cloudinary asset URL now gone", gone.status !== 200, `status=${gone.status}`);
    }
    const gal4 = await text("/mr/gallery");
    check("deleted sentinel gone from gallery", !gal4.body.includes("Phase3 sentinel"), "");
  }

  // ── 9. Stock CRUD round-trip ───────────────────────────────────────────
  const stockCreated = await req("/api/admin/stock", {
    method: "POST",
    body: {
      variety: "Phase3 Sentinel Variety",
      quantity: 42,
      unit: "crate",
      quality: "premium",
      location: "Phase3 Test Yard",
      available: true,
    },
  });
  check("create stock lot", stockCreated.status === 201 && stockCreated.data?.item?._id,
    `status=${stockCreated.status} ${JSON.stringify(stockCreated.data).slice(0, 160)}`);
  const stockId = stockCreated.data?.item?._id;

  if (stockId) {
    const pubStock = await text("/mr/stock");
    check("new lot visible on public stock page",
      pubStock.body.includes("Phase3 Sentinel Variety"), "");

    const toggled = await req(`/api/admin/stock/${stockId}`, {
      method: "PATCH",
      body: { available: false },
    });
    check("toggle availability", toggled.status === 200 && toggled.data?.item?.available === false,
      `status=${toggled.status}`);

    const delStock = await req(`/api/admin/stock/${stockId}`, { method: "DELETE" });
    check("delete stock lot", delStock.status === 200, `status=${delStock.status}`);
    const pubStock2 = await text("/mr/stock");
    check("deleted lot gone from public stock page",
      !pubStock2.body.includes("Phase3 Sentinel Variety"), "");

    // Validation: reject a stock payload with a bogus field/type
    const invalid = await req("/api/admin/stock", {
      method: "POST",
      body: { variety: "x" },
    });
    check("invalid stock payload rejected", invalid.status === 400, `status=${invalid.status}`);
  }

  // ── 10. Feedback moderation round-trip ─────────────────────────────────
  const fb = await req("/api/feedback", {
    method: "POST",
    body: {
      name: "Phase3 Sentinel",
      message: FB_MSG,
      rating: 5,
      language: "en",
      hp: "", // honeypot must stay empty
    },
  });
  check("public feedback accepted", fb.status === 201 || fb.status === 200,
    `status=${fb.status}`);

  const fbList = await req("/api/admin/feedback");
  const fbItem = fbList.data?.items?.find(
    (i) => i.message === FB_MSG
  );
  check("new feedback listed for admin", Boolean(fbItem), "");

  if (fbItem) {
    // Unapproved → not on public wall
    const wall1 = await text("/mr/feedback");
    check("unapproved feedback hidden from public wall",
      !wall1.body.includes(FB_MSG), "");

    // Settle: wall1 hit an entry older than cacheLife, so Next served it
    // stale AND spawned a background regeneration (SWR). If that regen's
    // cache write lands after the approve's revalidateTag below, it
    // re-caches pre-approval HTML as "fresh" and the wall stays stale for
    // up to cacheLife("minutes") — a request-triggered revalidation cannot
    // cancel an in-flight regeneration (see how-revalidation-works.md).
    await new Promise((r) => setTimeout(r, 3000));

    const approve = await req("/api/admin/feedback", {
      method: "PATCH",
      body: { id: fbItem._id, approved: true },
    });
    check("approve feedback", approve.status === 200 && approve.data?.item?.approved === true,
      `status=${approve.status}`);

    const wall2 = await pollText("/mr/feedback", FB_MSG, 10);
    check("approved feedback visible on public wall", wall2, "");

    const spam = await req("/api/admin/feedback", {
      method: "PATCH",
      body: { id: fbItem._id, spam: true },
    });
    check("mark spam", spam.status === 200 && spam.data?.item?.spam === true,
      `status=${spam.status}`);

    const delFb = await req("/api/admin/feedback", {
      method: "DELETE",
      body: { id: fbItem._id },
    });
    check("delete feedback", delFb.status === 200, `status=${delFb.status}`);
    const wall3 = await text("/mr/feedback");
    check("deleted feedback gone from public wall",
      !wall3.body.includes(FB_MSG), "");
  }

  // ── 11. No price anywhere (public pages) ───────────────────────────────
  let priceFree = true;
  let priceWhere = "";
  for (const p of ["/mr", "/mr/stock", "/mr/gallery", "/en", "/en/stock", "/hi/stock"]) {
    const r = await text(p);
    // Strip scripts/templates so React streaming markers (<!--$-->) and RSC
    // payloads can't trigger false positives on currency symbols.
    const visible = r.body
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<template[\s\S]*?<\/template>/g, " ")
      .replace(/<!--[\s\S]*?-->/g, " ");
    if (/[₹€]|\$\d|USD\s*\d|price\s*[:=]/i.test(visible)) {
      priceFree = false;
      priceWhere += p + " ";
    }
  }
  check("no price symbols on public pages", priceFree, priceWhere);

  // Admin stock form has no price field either
  const stockAdminPage = await text("/admin/stock");
  check("admin stock UI has no price field", !/price/i.test(stockAdminPage.body),
    /price/i.test(stockAdminPage.body) ? "found 'price'" : "");

  // ── 12. Logout invalidates the session ─────────────────────────────────
  const out = await req("/api/admin/logout", { method: "POST" });
  check("logout succeeds", out.status === 200, `status=${out.status}`);
  const after = await req("/api/admin/session");
  check("session gone after logout", after.status === 401, `status=${after.status}`);
  cookie = "";

  // ── 13. Login rate limit (after everything else needs auth) ────────────
  let saw429 = false;
  for (let i = 0; i < 12 && !saw429; i++) {
    const r = await req("/api/admin/login", {
      method: "POST",
      body: { email: env.ADMIN_EMAIL, password: "wrong-" + i },
    });
    if (r.status === 429) saw429 = true;
  }
  check("login rate limiting engages (429)", saw429, "");

  // ── Report ─────────────────────────────────────────────────────────────
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  }
  console.log(`\n${passed}/${passed + failed} checks passed${failed ? `, ${failed} FAILED` : ""}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("verify script crashed:", err);
  process.exit(1);
});
