#!/usr/bin/env node
/**
 * Add 1 AI-generated photo + 1 AI-generated video to the gallery.
 * - Photo: AI image from Pollinations (free, no key) -> uploaded to Cloudinary.
 * - Video: the AI photo turned into a real MP4 via Cloudinary Ken Burns effect.
 * Creates one permanent published post with both. Idempotent on title.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { connectDB, disconnectDB } = await import(pathToFileURL(path.join(root, "src", "lib", "db.js")).href);
const { default: Post } = await import(pathToFileURL(path.join(root, "src", "models", "Post.js")).href);
const { getCloudinaryConfig, cloudinarySignature } = await import(
  pathToFileURL(path.join(root, "src", "lib", "cloudinary.js")).href
);

const FOLDER = "matoshree/posts";
const ASSETS = "C:\\Users\\user\\AppData\\Local\\Temp\\opencode\\demo-assets";
const cloud = getCloudinaryConfig();

async function signUpload() {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDER, timestamp };
  return { timestamp, signature: cloudinarySignature(params, cloud.apiSecret) };
}

async function uploadLocal(filePath, resourceType) {
  const { timestamp, signature } = await signUpload();
  const bytes = readFileSync(filePath);
  const mime = resourceType === "video" ? "video/mp4" : "image/jpeg";
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: mime }), path.basename(filePath));
  fd.append("api_key", cloud.apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", FOLDER);
  fd.append("signature", signature);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud.cloudName}/${resourceType}/upload`,
    { method: "POST", body: fd }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.public_id) throw new Error(`upload ${resourceType} failed: ${data?.error?.message || res.status}`);
  return data;
}

function mediaOf(u, resourceType) {
  return {
    provider: "cloudinary",
    publicId: u.public_id,
    url: u.url,
    secureUrl: u.secure_url || "",
    resourceType,
    format: u.format || (resourceType === "video" ? "mp4" : "jpg"),
    bytes: u.bytes || 0,
    width: u.width || 0,
    height: u.height || 0,
    duration: u.duration || 0,
  };
}

const TITLE = "AI spotlight — farm fresh bananas";

await connectDB();

const existing = await Post.findOne({ title: TITLE }).lean();

const hasPhoto = existing?.media?.some((m) => m.resourceType === "image");
const hasVideo = existing?.media?.some((m) => m.resourceType === "video");
if (existing && hasPhoto && hasVideo) {
  console.log(`Post already complete (photo + video) — nothing to do.`);
  await disconnectDB();
  process.exit(0);
}

const photoPath = path.join(ASSETS, "ai-photo-1.jpg");
if (!existsSync(photoPath)) throw new Error(`missing AI photo at ${photoPath}`);

// Reuse an already-uploaded photo; only upload what is missing.
let photoMedia = existing?.media?.find((m) => m.resourceType === "image");
if (!photoMedia) {
  console.log("Uploading AI photo to Cloudinary...");
  const photo = await uploadLocal(photoPath, "image");
  console.log(`  photo -> ${photo.public_id} (${photo.secure_url})`);
  photoMedia = mediaOf(photo, "image");
} else {
  console.log(`Reusing existing AI photo (${photoMedia.publicId}).`);
}

let videoMedia = existing?.media?.find((m) => m.resourceType === "video");
if (!videoMedia) {
  try {
    const videoPath = path.join(ASSETS, "ai-video-1.mp4");
    if (existsSync(videoPath)) {
      console.log("Uploading AI video (Ken Burns MP4) to Cloudinary...");
      const video = await uploadLocal(videoPath, "video");
      console.log(`  video -> ${video.public_id} dur=${video.duration} (${video.secure_url})`);
      videoMedia = mediaOf(video, "video");
    } else {
      console.log(`  (!) missing ${videoPath} — skipping video`);
    }
  } catch (e) {
    console.log(`  (!) video upload failed: ${e.message}`);
  }
}

const media = [photoMedia];
if (videoMedia) media.push(videoMedia);

const now = new Date();
await Post.findOneAndUpdate(
  { title: TITLE },
  {
    $set: {
      title: TITLE,
      titleMr: "एआय स्पॉटलाइट — शेतातील ताजी केळी",
      titleHi: "एआई स्पॉटलाइट — खेत की ताज़े केले",
      body: "An AI-generated showcase of farm-fresh bananas — photo and a short motion clip.",
      bodyMr: "शेतातील ताज्या केळ्यांचे एआय-निर्मित प्रदर्शन — फोटो आणि छोटा व्हिडिओ.",
      bodyHi: "खेत के ताज़े केले का एआई-निर्मित प्रदर्शन — फ़ोटो और छोटा वीडियो।",
      media,
      type: "permanent",
      status: "published",
      publishedAt: existing?.publishedAt || now,
      expiresAt: null,
    },
  },
  { upsert: true, runValidators: true }
);

console.log(`\nDone — post "${TITLE}" published with ${media.length} media (photo${videoMedia ? " + video" : ""}).`);
await disconnectDB();
process.exit(0);
