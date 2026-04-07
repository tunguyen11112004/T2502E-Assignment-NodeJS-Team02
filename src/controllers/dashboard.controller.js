const dashboardService = require('../services/dashboard.service');

exports.getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
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
    const userId = req.user.id || req.user._id;
    const tasks = await dashboardService.getOverdueTasks(userId);

    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};