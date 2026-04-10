const mongoose = require("mongoose");

const taskListSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("TaskList", taskListSchema);