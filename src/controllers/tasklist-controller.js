const TaskList = require("../models/TaskList");

const taskListController = {
  create: async (req, res) => {
    try {
      const { projectId, title } = req.body;

      if (!projectId || !title || !title.trim()) {
        return res.redirect(
          `/api/projects/${projectId}/board?error=${encodeURIComponent("ProjectId và title là bắt buộc")}`
        );
      }

      const existed = await TaskList.findOne({
        projectId,
        title: title.trim(),
      });

      if (existed) {
        return res.redirect(
          `/api/projects/${projectId}/board?error=${encodeURIComponent("Danh sách đã tồn tại")}`
        );
      }

      await TaskList.create({
        title: title.trim(),
        projectId,
      });

      return res.redirect(
        `/api/projects/${projectId}/board?success=${encodeURIComponent("Tạo danh sách thành công")}`
      );
    } catch (error) {
      const fallbackProjectId = req.body && req.body.projectId ? req.body.projectId : "";
      return res.redirect(
        `/api/projects/${fallbackProjectId}/board?error=${encodeURIComponent(error.message)}`
      );
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id || req.user._id;

      const taskList = await TaskList.findById(id).populate('projectId');
      if (!taskList || taskList.isDeleted) {
        return res.status(404).json({ message: "TaskList not found" });
      }

      // Kiểm tra quyền owner
      if (taskList.projectId.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({ message: "Only owner can delete tasklist" });
      }

      taskList.isDeleted = true;
      await taskList.save();
      res.status(200).json({ message: "TaskList deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = taskListController;