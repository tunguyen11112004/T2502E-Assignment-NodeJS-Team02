const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // THÊM TRƯỜNG NÀY ĐỂ LƯU REFRESH TOKEN
    refreshToken: { type: String, default: "" }, 
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);