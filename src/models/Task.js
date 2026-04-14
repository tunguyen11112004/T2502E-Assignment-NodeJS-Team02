const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskList",
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    assignee: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    deadline: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
