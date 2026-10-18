#!/usr/bin/env node
/**
 * Demo content seed — realistic photos + videos (uploaded to Cloudinary) and
 * approved feedback, so the public gallery and feedback wall look alive.
 *
 * Usage: npm run seed:demo
 * Safe to re-run: posts upsert on title (existing media is kept, not re-uploaded),
 * stock upserts on variety+location, feedback upserts on name+message. The verify
 * suites only delete their own "Phase3"/"Phase4" sentinels, never this content.
 *
 * Requires CLOUDINARY_* in .env.local for media; without it, text-only posts are
 * still created. Image/video files are read from the DEMO_ASSETS dir.
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

const ASSETS =
  process.env.DEMO_ASSETS ||
  "C:\\Users\\user\\AppData\\Local\\Temp\\opencode\\demo-assets";

const { connectDB, disconnectDB } = await import(
  pathToFileURL(path.join(root, "src", "lib", "db.js")).href
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
const {
  getCloudinaryConfig,
  cloudinarySignature,
  isCloudinaryConfigured,
} = await import(pathToFileURL(path.join(root, "src", "lib", "cloudinary.js")).href);

const FOLDER = "matoshree/posts";

/** Signed direct upload of local bytes. Returns the Cloudinary response. */
async function uploadBytes(filePath, resourceType) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDER, timestamp };
  const signature = cloudinarySignature(params, apiSecret);
  const bytes = readFileSync(filePath);
  const type = resourceType === "video" ? "video" : "image";
  const mime = resourceType === "video" ? "video/mp4" : "image/png";
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: mime }), path.basename(filePath));
  fd.append("api_key", apiKey);
  fd.append("timestamp", String(timestamp));
  fd.append("folder", FOLDER);
  fd.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.public_id) {
    throw new Error(`upload failed (${res.status}): ${data?.error?.message || "unknown"}`);
  }
  return data;
}

function mediaOf(u, resourceType) {
  return {
    provider: "cloudinary",
    publicId: u.public_id,
    url: u.url,
    secureUrl: u.secure_url || "",
    resourceType,
    format: u.format || (resourceType === "video" ? "mp4" : "png"),
    bytes: u.bytes || 0,
    width: u.width || 0,
    height: u.height || 0,
    duration: u.duration || 0,
  };
}

// ── Demo posts (trilingual). `file` + `kind` describe the media to upload. ──
const POSTS = [
  {
    title: "Rajapuri fresh arrivals at the mandi",
    titleMr: "मंडीत राजापुरीची नवीन आवक",
    titleHi: "मंडी में राजापुरी की नई आवक",
    body: "Large Rajapuri lots landed this morning — graded, sorted and box packed. Ask on WhatsApp for today's rate.",
    bodyMr: "आज सकाळी मोठ्या राजापुरीचा माल आला — वर्गीकृत, निवडलेला व पेटीत पॅक केलेला. आजच्या दरासाठी व्हॉट्सअ‍ॅपवर विचार करा.",
    bodyHi: "आज सुबह बड़े राजापुरी लॉट आए — ग्रेडेड, छाँटे और बॉक्स पैक। आज के दाम के लिए व्हाट्सएप पर पूछें।",
    file: "demo-rajapuri.png",
    kind: "image",
    type: "temporary",
    status: "published",
  },
  {
    title: "Export-grade packing",
    titleMr: "एक्सपोर्ट ग्रेड पॅकिंग",
    titleHi: "एक्सपोर्ट ग्रेड पैकिंग",
    body: "Uniform size, box packed and ready for dispatch. No middlemen — packed at the market, shipped the same day.",
    bodyMr: "एकसमान आकार, पेटीत पॅक केलेला आणि पुरवठ्यासाठी तयार. दलाल नाही — मंडीत पॅक करून त्याच दिवशी पाठवला जातो.",
    bodyHi: "एकसमान साइज़, बॉक्स में पैक और सप्लाई के लिए तैयार। बिचौलिया नहीं — मंडी में पैक होकर उसी दिन भेजा जाता है।",
    file: "demo-crates.png",
    kind: "image",
    type: "permanent",
    status: "published",
  },
  {
    title: "Premium red banana — limited lot",
    titleMr: "प्रीमियम लाल केळी — मर्यादित माल",
    titleHi: "प्रीमियम लाल केला — सीमित लॉट",
    body: "Fresh red banana bunches, premium retail grade. Limited stock — enquire early on WhatsApp.",
    bodyMr: "ताज्या लाल केळ्याच्या गुच्छ, प्रीमियम रिटेल ग्रेड. मर्यादित माल — व्हॉट्सअ‍ॅपवर लवकर चौकशी करा.",
    bodyHi: "ताज़े लाल केले के गुच्छ, प्रीमियम रिटेल ग्रेड। सीमित स्टॉक — व्हाट्सएप पर जल्दी पूछताछ करें।",
    file: "demo-red.png",
    kind: "image",
    type: "permanent",
    status: "published",
  },
  {
    title: "Ripening lots — dispatch in 2 days",
    titleMr: "पिरणारा माल — २ दिवसांत पुरवठा",
    titleHi: "पक रहे लॉट — 2 दिन में सप्लाई",
    body: "Poovan and Velchi lots currently ripening. firm texture, long shelf life once ripe.",
    bodyMr: "पूवन व वेलचीचा माल सध्या पिरणत आहे. पिकल्यावर ठोस बांधणी व लांब शेल्फ आयुष्य.",
    bodyHi: "पूवन और वेलची लॉट अभी पक रहे हैं। पकने पर मज़बूत बनावट और लंबी शेल्फ़ लाइफ़।",
    file: "demo-ripening.png",
    kind: "image",
    type: "temporary",
    status: "published",
  },
  {
    title: "Daily mandi activity",
    titleMr: "दररोज मंडीतील कामकाज",
    titleHi: "रोज़ मंडी का कामकाज",
    body: "Fresh lots are landing every morning. Stock is graded, sorted and listed with quantity and location.",
    bodyMr: "प्रत्येक सकाळी नवीन माल येतो. माल वर्गीकृत व निवडलेला असून प्रमाण आणि स्थानासह यादीत आहे.",
    bodyHi: "हर सुबह नया माल आता है। माल ग्रेडेड और छाँटा हुआ है तथा मात्रा और स्थान के साथ सूचीबद्ध है।",
    file: "demo-mandi.png",
    kind: "image",
    type: "permanent",
    status: "published",
  },
  {
    title: "Velchi — aroma heavy, premium grade",
    titleMr: "वेलची — सुगंधायुक्त, प्रीमियम ग्रेड",
    titleHi: "वेलची — खुशबूदार, प्रीमियम ग्रेड",
    body: "Aroma-heavy Velchi, quick ripening and premium grade. A favourite for retail and gifting.",
    bodyMr: "सुगंधायुक्त वेलची, लवकर पिरणे व प्रीमियम ग्रेड. रिटेल व भेटीसाठी आवडती.",
    bodyHi: "खुशबूदार वेलची, तेज़ पकने वाली और प्रीमियम ग्रेड। रिटेल और तोहफ़े के लिए पसंदीदा।",
    file: "demo-velchi.png",
    kind: "image",
    type: "permanent",
    status: "published",
  },
  {
    title: "Sorting & grading — behind the scenes",
    titleMr: "निवड व वर्गीकरण — कथन",
    titleHi: "छँटाई और ग्रेडिंग — पर्दे के पीछे",
    body: "A quick look at how lots are sorted and graded before dispatch.",
    bodyMr: "पुरवठ्यापूर्वी माल कसा निवडला व वर्गीकृत केला जातो याचा थोडक्यात दृश्य.",
    bodyHi: "सप्लाई से पहले लॉट कैसे छाँटे और ग्रेड किए जाते हैं, इसकी एक झलक।",
    file: "demo-video-1.mp4",
    kind: "video",
    type: "permanent",
    status: "published",
  },
  {
    title: "Packing line in action",
    titleMr: "पॅकिंग लाईन चालू",
    titleHi: "पैकिंग लाइन चालू",
    body: "Boxes are packed, weighed and labelled the same day they are dispatched.",
    bodyMr: "पेट्या त्याच दिवशी पॅक, तोंडणी व लेबल केल्या जातात.",
    bodyHi: "बॉक्स उसी दिन पैक, तौल और लेबल किए जाते हैं जिस दिन सप्लाई होते हैं।",
    file: "demo-video-2.mp4",
    kind: "video",
    type: "permanent",
    status: "published",
  },
];

const STOCK = [
  {
    variety: "Grand Naine",
    varietyMr: "ग्रँड नेने",
    varietyHi: "ग्रैंड नेने",
    quantity: 520,
    unit: "crate",
    quality: "premium",
    location: "Lasalgaon APMC Market",
    available: true,
    notes: "Export variety, long shelf life — steady supply.",
    notesMr: "एक्सपोर्ट जात, लांब शेल्फ आयुष्य — स्थिर पुरवठा.",
    notesHi: "एक्सपोर्ट किस्म, लंबी शेल्फ़ लाइफ़ — स्थिर सप्लाई।",
  },
  {
    variety: "Basrai",
    varietyMr: "बसराई",
    varietyHi: "बसराई",
    quantity: 180,
    unit: "box",
    quality: "grade-a",
    location: "Pimpalgaon Baswant Market",
    available: true,
    notes: "Compact bunches, uniform size — good for retail boxes.",
    notesMr: "छोट्या गुच्छ, एकसमान आकार — रिटेल पेटीसाठी चांगला.",
    notesHi: "छोटे गुच्छ, एकसमान साइज़ — रिटेल बॉक्स के लिए अच्छा।",
  },
  {
    variety: "Chakrakeli",
    varietyMr: "चक्रकेळी",
    varietyHi: "चक्रकेली",
    quantity: 95,
    unit: "bunch",
    quality: "premium",
    location: "Nashik Fruit Market",
    available: false,
    notes: "Sold out — next lot arriving next week.",
    notesMr: "माल संपला — पुढचा माल पुढच्या आठवड्यात.",
    notesHi: "माल खत्म — अगला लॉट अगले हफ़्ते।",
  },
];

const FEEDBACK = [
  {
    name: "Sunita Deshmukh",
    contact: "Nashik",
    message:
      "Fresh and consistent quality every week. The grading is honest — what is listed is what arrives.",
    rating: 5,
    language: "en",
  },
  {
    name: "रामेश पाटील",
    contact: "लासलगाव",
    message:
      "दरवर्षी याच मंडीतून केळी घेतो. वर्गीकरण नीट असते आणि वेळेवर पुरवठा मिळतो.",
    rating: 5,
    language: "mr",
  },
  {
    name: "अनिल शर्मा",
    contact: "दिल्ली",
    message:
      "अच्छी गुणवत्ता और सही समय पर सप्लाई। दाम व्हाट्सएप पर मिल जाता है, कोई झंझट नहीं।",
    rating: 4,
    language: "hi",
  },
  {
    name: "Mohan Agarwal",
    contact: "Kolhapur",
    message:
      "Red banana lot was premium grade and packed neatly. Will order again.",
    rating: 4,
    language: "en",
  },
];

try {
  await connectDB();
  console.log("Connected to MongoDB\n");

  const cloudReady = isCloudinaryConfigured();
  if (!cloudReady) {
    console.log("(!) Cloudinary not configured — creating text-only posts (no media).\n");
  }

  // ── Posts ────────────────────────────────────────────────────────────────
  console.log("Posts:");
  let uploadedCount = 0;
  let keptMedia = 0;
  for (const p of POSTS) {
    const existing = await Post.findOne({ title: p.title }).lean();

    let media = [];
    if (existing && Array.isArray(existing.media) && existing.media.length > 0) {
      media = existing.media; // keep already-uploaded media (idempotent re-run)
      keptMedia += 1;
    } else if (cloudReady && p.file) {
      const filePath = path.join(ASSETS, p.file);
      if (existsSync(filePath)) {
        const up = await uploadBytes(filePath, p.kind);
        media = [mediaOf(up, p.kind)];
        uploadedCount += 1;
        console.log(`  uploaded ${p.file} -> ${up.public_id}`);
      } else {
        console.log(`  (!) missing asset ${p.file} — creating text-only post`);
      }
    }

    const { title, file, kind, ...fields } = p;
    const now = new Date();
    const set = { ...fields, media };
    // temporary posts get a fresh 7-day window; permanent never expire
    if (fields.type === "temporary") {
      set.publishedAt = now;
      set.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      set.publishedAt = existing?.publishedAt || now;
      set.expiresAt = null;
    }
    await Post.findOneAndUpdate({ title }, { $set: set }, { upsert: true, runValidators: true });
    console.log(`  ${p.title}`);
  }

  // ── Stock ────────────────────────────────────────────────────────────────
  console.log("\nStock:");
  let stockCount = 0;
  for (const item of STOCK) {
    const { variety, location, ...fields } = item;
    await Stock.findOneAndUpdate(
      { variety, location },
      { $set: fields },
      { upsert: true, runValidators: true }
    );
    stockCount += 1;
    console.log(`  ${item.variety} — ${item.location}`);
  }

  // ── Feedback (approved so it shows on the public wall) ───────────────────
  console.log("\nFeedback:");
  let fbCount = 0;
  for (const f of FEEDBACK) {
    const { name, message, ...rest } = f;
    await Feedback.findOneAndUpdate(
      { name, message },
      { $set: { ...rest, approved: true, spam: false } },
      { upsert: true, runValidators: true }
    );
    fbCount += 1;
    console.log(`  ${f.name} (${f.language}, ${f.rating}★)`);
  }

  const totals = {
    posts: await Post.countDocuments(),
    stock: await Stock.countDocuments(),
    feedback: await Feedback.countDocuments(),
  };

  await disconnectDB();
  console.log(
    `\nDemo seed complete — ${POSTS.length} posts (${uploadedCount} new media uploaded, ${keptMedia} kept), ${stockCount} stock lots, ${fbCount} approved feedback.`
  );
  console.log(
    `DB totals: ${totals.posts} posts, ${totals.stock} stock, ${totals.feedback} feedback.`
  );
  process.exit(0);
} catch (err) {
  console.error("\nDemo seed failed:", err.message);
  process.exit(1);
}
