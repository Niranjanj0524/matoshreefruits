#!/usr/bin/env node
/**
 * Phase 2 sample content — realistic banana stock lots + a couple of
 * text-only announcements, so the public pages are never empty.
 *
 * Usage: npm run seed
 * Safe to re-run: each lot is upserted on variety + location, posts on title.
 * No images are inserted — real photos/videos are uploaded in Phase 3.
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
const { default: Stock } = await import(
  pathToFileURL(path.join(root, "src", "models", "Stock.js")).href
);
const { default: Post } = await import(
  pathToFileURL(path.join(root, "src", "models", "Post.js")).href
);

const STOCK = [
  {
    variety: "Rajapuri",
    varietyMr: "राजापुरी",
    varietyHi: "राजापुरी",
    quantity: 480,
    unit: "crate",
    quality: "grade-a",
    location: "Lasalgaon APMC Market",
    available: true,
    notes: "Large sized lot, steady ripening — ideal for wholesale distribution.",
    notesMr: "मोठ्या आकाराचा माल, नियमित पिरणे — थोक वितरणासाठी योग्य.",
    notesHi: "बड़े आकार का माल, नियमित पकने के साथ — थोक वितरण के लिए उपयुक्त.",
  },
  {
    variety: "Velchi",
    varietyMr: "वेलची",
    varietyHi: "वेलची",
    quantity: 260,
    unit: "crate",
    quality: "premium",
    location: "Pimpalgaon Baswant Market",
    available: true,
    notes: "Aroma-heavy variety, quick ripening — premium grade.",
    notesMr: "सुगंधायुक्त जात, लवकर पिरणे — प्रीमियम ग्रेड.",
    notesHi: "खुशबूदार किस्म, तेज़ पकने वाली — प्रीमियम ग्रेड.",
  },
  {
    variety: "Dwarf Cavendish",
    varietyMr: "डवर्फ कॅव्हेंडिश",
    varietyHi: "ड्वार्फ कैवेंडिश",
    quantity: 340,
    unit: "box",
    quality: "grade-a",
    location: "Nashik Fruit Market",
    available: true,
    notes: "Export standard packing, uniform size.",
    notesMr: "एक्सपोर्ट स्टँडर्ड पॅकिंग, एकसमान आकार.",
    notesHi: "एक्सपोर्ट स्टैंडर्ड पैकिंग, एकसमान साइज़।",
  },
  {
    variety: "Red Banana",
    varietyMr: "लाल केळी",
    varietyHi: "लाल केला",
    quantity: 120,
    unit: "bunch",
    quality: "premium",
    location: "Kolhapur Market",
    available: true,
    notes: "Limited lot — premium retail demand.",
    notesMr: "मर्यादित माल — प्रीमियम रिटेल माग.",
    notesHi: "सीमित लॉट — प्रीमियम रिटेल माँग।",
  },
  {
    variety: "Poovan",
    varietyMr: "पूवन",
    varietyHi: "पूवन",
    quantity: 300,
    unit: "crate",
    quality: "ripening",
    location: "Tiptur APMC Market",
    available: true,
    notes: "Currently ripening — dispatch in 2 days.",
    notesMr: "सध्या पिरणारा माल — २ दिवसांत पुरवठा.",
    notesHi: "अभी पक रहा है — 2 दिन में सप्लाई।",
  },
  {
    variety: "Nendran",
    varietyMr: "नेंद्रन",
    varietyHi: "नेंद्रन",
    quantity: 90,
    unit: "quintal",
    quality: "mixed",
    location: "Ranchi Mandi",
    available: false,
    notes: "Sold out — next lot arriving this week.",
    notesMr: "माल संपला — पुढचा माल या आठवड्यात येणार.",
    notesHi: "माल खत्म — अगला लॉट इस हफ़्ते आएगा।",
  },
  {
    variety: "Sabraz",
    varietyMr: "सब्राज",
    varietyHi: "सब्राज",
    quantity: 210,
    unit: "truck",
    quality: "grade-b",
    location: "Rajapur Market",
    available: true,
    notes: "Bulk lot for processors and ripeners.",
    notesMr: "प्रोसेसर व पिरणार्थ्यांसाठी मोठा माल.",
    notesHi: "प्रोसेसर और पकाने वालों के लिए बड़ा लॉट।",
  },
  {
    variety: "Ambuli",
    varietyMr: "अंबुळी",
    varietyHi: "अंबुली",
    quantity: 150,
    unit: "box",
    quality: "grade-a",
    location: "Deolali Market",
    available: true,
    notes: "Firm texture, long shelf life.",
    notesMr: "ठोस बांधणी, लांब शेल्फ आयुष्य.",
    notesHi: "मज़बूत बनावट, लंबी शेल्फ़ लाइफ़।",
  },
];

const POSTS = [
  {
    title: "Daily fresh arrivals at the mandi",
    titleMr: "मंडीत रोज नवीन आवक",
    titleHi: "मंडी में रोज़ नई आवक",
    body: "Fresh lots are landing every morning. Stock is graded, sorted and listed with quantity and location — ask us on WhatsApp for today's rate.",
    bodyMr: "प्रत्येक सकाळी नवीन माल येतो. माल वर्गीकृत व निवडलेला असून प्रमाण आणि स्थानासह यादीत आहे — आजच्या दरासाठी व्हॉट्सअ‍ॅपवर विचार करा.",
    bodyHi: "हर सुबह नया माल आता है। माल ग्रेडेड और छाँटा हुआ है तथा मात्रा और स्थान के साथ सूचीबद्ध है — आज के दाम के लिए व्हाट्सएप पर पूछें।",
    type: "permanent",
    status: "published",
  },
  {
    title: "Quality grading explained",
    titleMr: "गुणवत्ता वर्गीकरण समजावून",
    titleHi: "क्वालिटी ग्रेडिंग की जानकारी",
    body: "Premium, Grade A and Grade B lots are packed separately so you always know what you are buying before dispatch.",
    bodyMr: "प्रीमियम, ग्रेड-ए व ग्रेड-बी माल वेगळा पॅक केला जातो — पुरवठ्यापूर्वीच तुम्हाला काय घेत आहात ते माहीत असते.",
    bodyHi: "प्रीमियम, ग्रेड-ए और ग्रेड-बी लॉट अलग पैक होते हैं — सप्लाई से पहले ही पता रहता है कि आप क्या खरीद रहे हैं।",
    type: "permanent",
    status: "published",
  },
  {
    title: "Direct dispatch, no middlemen",
    titleMr: "थेट पुरवठा, दलाल नाही",
    titleHi: "सीधी सप्लाई, बिचौलिया नहीं",
    body: "Orders are packed at the market and dispatched the same day. Enquire on WhatsApp for today's availability.",
    bodyMr: "ऑर्डर मंडीत पॅक करून त्याच दिवशी पुरवठा केला जातो. आजच्या उपलब्धतेसाठी व्हॉट्सअ‍ॅपवर चौकशी करा.",
    bodyHi: "ऑर्डर मंडी में पैक होकर उसी दिन सप्लाई होते हैं। आज की उपलब्धता के लिए व्हाट्सएप पर पूछताछ करें।",
    type: "permanent",
    status: "published",
  },
];

try {
  await connectDB();
  console.log("✓ Connected to MongoDB\n");

  console.log("Stock:");
  let stockCount = 0;
  for (const item of STOCK) {
    // variety + location come from the equality filter (they are also written
    // on insert), so they must not be repeated in $set — MongoDB rejects the
    // conflicting path otherwise.
    const { variety, location, ...fields } = item;
    await Stock.findOneAndUpdate(
      { variety, location },
      { $set: fields },
      { upsert: true, runValidators: true, returnDocument: "after" }
    );
    stockCount += 1;
    console.log(`  ✓ ${item.variety} — ${item.location}`);
  }

  console.log("\nPosts:");
  const now = new Date();
  let postCount = 0;
  for (const post of POSTS) {
    const { title, ...fields } = post;
    await Post.findOneAndUpdate(
      { title },
      {
        $set: { ...fields, publishedAt: now, expiresAt: null },
        $setOnInsert: { media: [] },
      },
      { upsert: true, runValidators: true, returnDocument: "after" }
    );
    postCount += 1;
    console.log(`  ✓ ${post.title}`);
  }

  const totals = {
    stock: await Stock.countDocuments(),
    posts: await Post.countDocuments(),
  };

  await disconnectDB();
  console.log(
    `\n✅ Seed complete — ${stockCount} stock lots upserted, ${postCount} posts upserted.`
  );
  console.log(
    `   Totals in DB: ${totals.stock} stock, ${totals.posts} posts (sample content only — no media).`
  );
  process.exit(0);
} catch (err) {
  console.error("\n✗ Seed failed:", err.message);
  process.exit(1);
}
