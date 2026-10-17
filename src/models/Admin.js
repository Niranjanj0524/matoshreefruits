import mongoose from "mongoose";

/**
 * Admin — single admin account for matoshreefruits.com.
 * Password is stored as a bcrypt hash only (never plaintext).
 */
const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    name: {
      type: String,
      default: "Administrator",
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export default Admin;
