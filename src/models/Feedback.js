import mongoose from "mongoose";

/**
 * Feedback — messages submitted through the public feedback form.
 * approved=false means it is hidden from the public site until reviewed.
 */
const FeedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 120,
    },
    contact: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 2000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    language: {
      type: String,
      enum: ["mr", "hi", "en"],
      default: "en",
    },
    approved: { type: Boolean, default: false, index: true },
    spam: { type: Boolean, default: false },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

FeedbackSchema.index({ createdAt: -1 });

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);

export default Feedback;
