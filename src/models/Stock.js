import mongoose from "mongoose";

/**
 * Stock — current banana stock availability.
 * NOTE: no price field — pricing is never public, enquiries go through WhatsApp.
 */
const StockSchema = new mongoose.Schema(
  {
    variety: {
      type: String,
      required: [true, "Variety is required"],
      trim: true,
      maxlength: 120,
    },
    varietyMr: { type: String, default: "", trim: true },
    varietyHi: { type: String, default: "", trim: true },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    unit: {
      type: String,
      default: "crate",
      enum: ["crate", "box", "kg", "quintal", "truck", "bunch"],
    },
    quality: {
      type: String,
      required: true,
      enum: ["premium", "grade-a", "grade-b", "ripening", "mixed"],
      default: "grade-a",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: 200,
    },
    available: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: { type: String, default: "", maxlength: 1000 },
    notesMr: { type: String, default: "" },
    notesHi: { type: String, default: "" },
    lastUpdatedBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

StockSchema.index({ available: 1, createdAt: -1 });

const Stock = mongoose.models.Stock || mongoose.model("Stock", StockSchema);

export default Stock;
