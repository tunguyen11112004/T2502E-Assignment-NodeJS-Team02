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
};

module.exports = taskListController;