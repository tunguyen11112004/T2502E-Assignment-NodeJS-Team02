const Task = require('../models/task.model');

class DashboardService {
  // Logic lọc Task của tôi (có Phân trang & Tìm kiếm)
  async getMyTasks(userId, query) {
    const { status, priority, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter = { assignee: userId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.title = { $regex: search, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('project', 'title');

    const total = await Task.countDocuments(filter);

    return { 
      tasks, 
      total, 
      page: parseInt(page), 
      pages: Math.ceil(total / limit) 
    };
  }

  // Logic lấy Task quá hạn
  async getOverdueTasks(userId) {
    return await Task.find({
      assignee: userId,
      status: { $ne: 'Done' }, // Chưa xong
      deadline: { $lt: new Date() } // Deadline nhỏ hơn hiện tại
    }).sort({ deadline: 1 });
  }
}

module.exports = new DashboardService();