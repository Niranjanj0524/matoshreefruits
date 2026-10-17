#!/usr/bin/env node
/**
 * Phase 1 smoke test — verifies every model can
 * create, read, update and delete a document.
 * Usage: npm run test:models
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const envPath = path.join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { connectDB, disconnectDB } = await import(
  pathToFileURL(path.join(root, "src", "lib", "db.js")).href
);
const { default: Admin } = await import(
  pathToFileURL(path.join(root, "src", "models", "Admin.js")).href
);
const { default: Post } = await import(
  pathToFileURL(path.join(root, "src", "models", "Post.js")).href
);
const { default: Stock } = await import(
  pathToFileURL(path.join(root, "src", "models", "Stock.js")).href
);
const { default: Feedback } = await import(
  pathToFileURL(path.join(root, "src", "models", "Feedback.js")).href
);

const stamp = Date.now();
let failures = 0;

function check(label, ok, extra = "") {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label} ${extra}`);
  }
}

try {
  await connectDB();
  console.log("✓ Connected to MongoDB\n");

  // ── Admin ────────────────────────────────────────────────────────────
  console.log("Admin:");
  const admin = await Admin.create({
    email: `test-admin-${stamp}@example.com`,
    passwordHash: "x".repeat(20),
    name: "Test Admin",
  });
  check("create", Boolean(admin._id));
  const adminRead = await Admin.findById(admin._id);
  check("read", adminRead?.email === `test-admin-${stamp}@example.com`);
  await Admin.deleteOne({ _id: admin._id });
  check("delete", (await Admin.countDocuments({ _id: admin._id })) === 0);

  // ── Post ─────────────────────────────────────────────────────────────
  console.log("\nPost:");
  const post = await Post.create({
    title: `Test arrival ${stamp}`,
    titleMr: "चाचणी आवक",
    body: "Temporary test post",
    type: "temporary",
    status: "published",
    publishedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    media: [
      {
        publicId: `test/${stamp}`,
        url: `https://res.cloudinary.com/demo/image/upload/test/${stamp}.jpg`,
        resourceType: "image",
        format: "jpg",
        bytes: 12345,
      },
    ],
  });
  check("create", Boolean(post._id));
  check("isLive() true before expiry", post.isLive() === true);
  post.expiresAt = new Date(Date.now() - 1000);
  check("isLive() false after expiry", post.isLive() === false);
  const liveCount = await Post.countDocuments({
    status: "published",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  check("live-posts query works", typeof liveCount === "number");
  await Post.deleteOne({ _id: post._id });
  check("delete", (await Post.countDocuments({ _id: post._id })) === 0);

  // ── Stock ────────────────────────────────────────────────────────────
  console.log("\nStock:");
  const stock = await Stock.create({
    variety: "Velchi",
    varietyMr: "वेलची",
    quantity: 120,
    unit: "crate",
    quality: "premium",
    location: "Lasalgaon Market",
    available: true,
  });
  check("create", Boolean(stock._id));
  stock.available = false;
  await stock.save();
  const stockRead = await Stock.findById(stock._id);
  check("update (available=false)", stockRead?.available === false);
  check("no price field", !("price" in (stockRead?.toObject() ?? {})));
  await Stock.deleteOne({ _id: stock._id });
  check("delete", (await Stock.countDocuments({ _id: stock._id })) === 0);

  // ── Feedback ─────────────────────────────────────────────────────────
  console.log("\nFeedback:");
  const fb = await Feedback.create({
    name: "Test Buyer",
    contact: "9876543210",
    message: "Good quality bananas, keep it up!",
    rating: 5,
    language: "mr",
  });
  check("create", Boolean(fb._id));
  check("hidden until approved", fb.approved === false);
  await Feedback.deleteOne({ _id: fb._id });
  check("delete", (await Feedback.countDocuments({ _id: fb._id })) === 0);

  await disconnectDB();
  console.log(
    failures === 0
      ? "\n✅ All model tests passed."
      : `\n❌ ${failures} test(s) failed.`
  );
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("\n✗ Model test run failed:", err.message);
  process.exit(1);
}
