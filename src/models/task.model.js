const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'Done'], 
    default: 'To Do' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  deadline: { type: Date },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
}, { timestamps: true });

// INDEXES: Tăng tốc độ tìm kiếm cho Dashboard
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ title: 'text' }); 
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);