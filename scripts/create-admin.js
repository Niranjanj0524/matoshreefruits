#!/usr/bin/env node
/**
 * Bootstrap the admin account.
 * Usage:
 *   1. Set ADMIN_EMAIL / ADMIN_PASSWORD in .env.local
 *   2. npm run create-admin   (or: node scripts/create-admin.js)
 *
 * Safe to re-run: updates the password of an existing admin email.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load .env.local manually (works even without the --env-file flag)
const envPath = path.join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { default: Admin } = await import(
  pathToFileURL(path.join(root, "src", "models", "Admin.js")).href
);
const { connectDB, disconnectDB } = await import(
  pathToFileURL(path.join(root, "src", "lib", "db.js")).href
);

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || "Administrator";

if (!email || !password) {
  console.error("✗ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
  process.exit(1);
}
if (password.length < 8) {
  console.error("✗ ADMIN_PASSWORD must be at least 8 characters long");
  process.exit(1);
}

try {
  await connectDB();
  console.log("✓ Connected to MongoDB");

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await Admin.findOneAndUpdate(
    { email },
    { $set: { passwordHash, name }, $setOnInsert: { email } },
    { returnDocument: "after", upsert: true, runValidators: true }
  );

  console.log(`✓ Admin ready: ${admin.email} (_id: ${admin._id})`);
  await disconnectDB();
  process.exit(0);
} catch (err) {
  console.error("✗ Failed to create admin:", err.message);
  process.exit(1);
}
