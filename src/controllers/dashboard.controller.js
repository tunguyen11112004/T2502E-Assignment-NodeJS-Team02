const dashboardService = require('../services/dashboard.service');

exports.getMyTasks = async (req, res, next) => {
  try {
    // Thay vì dùng req.user.id (đang lỗi), mình dán trực tiếp ID vào đây
    const userId = req.user.id;// dùng middleware protect để gán req.user sau khi xác thực JWT thành công
    const result = await dashboardService.getMyTasks(userId, req.query);

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOverdueTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;// dùng middleware protect để gán req.user sau khi xác thực JWT thành công
    const tasks = await dashboardService.getOverdueTasks(userId);

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};