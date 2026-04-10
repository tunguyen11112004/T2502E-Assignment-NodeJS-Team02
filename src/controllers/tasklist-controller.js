const TaskList = require("../models/TaskList");

// Sử dụng module.exports dạng object để giống các Controller khác của nhóm
const taskListController = {
  // Hàm tạo TaskList mới
  create: async (req, res) => {
    try {
      const { projectId, title } = req.body;

      if (!projectId || !title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "ProjectId and title are required",
        });
      }

      const newTaskList = await TaskList.create({
        title: title.trim(),
        projectId,
      });

      res.status(201).json({
        success: true,
        data: newTaskList,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = taskListController;