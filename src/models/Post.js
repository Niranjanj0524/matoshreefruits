import mongoose from "mongoose";

/**
 * Post — a photo/video update shown on the public site
 * (fresh arrivals, gallery items, announcements).
 *
 * type "temporary" posts auto-expire 7 days after publishing
 * (expiresAt is set when they are published).
 * type "permanent" posts never expire until an admin deletes them.
 */
const MediaSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "cloudinary",
      enum: ["cloudinary"],
    },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    secureUrl: { type: String, default: "" },
    resourceType: {
      type: String,
      required: true,
      enum: ["image", "video"],
    },
    format: { type: String, default: "" },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
  },
  { _id: true }
);

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    titleMr: { type: String, default: "", trim: true },
    titleHi: { type: String, default: "", trim: true },
    body: { type: String, default: "", maxlength: 2000 },
    bodyMr: { type: String, default: "" },
    bodyHi: { type: String, default: "" },
    media: { type: [MediaSchema], default: [] },
    type: {
      type: String,
      required: true,
      enum: ["temporary", "permanent"],
      default: "permanent",
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "unpublished"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    deletedFromCloudinaryAt: { type: Date, default: null },
    slug: { type: String, index: true, default: "" },
  },
  { timestamps: true }
);

// Fast lookups for public pages ("only live posts") and the expiry cron.
PostSchema.index({ status: 1, expiresAt: 1 });
PostSchema.index({ status: 1, publishedAt: -1 });

/** A post is publicly visible when published and not yet expired. */
PostSchema.methods.isLive = function isLive() {
  if (this.status !== "published") return false;
  if (this.type === "temporary" && this.expiresAt && this.expiresAt < new Date()) {
    return false;
  }
  return true;
};

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

export default Post;
