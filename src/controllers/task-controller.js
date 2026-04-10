const Task = require("../models/Task");
const Project = require("../models/Project"); // Cần import Project model để kiểm tra projectId

// Sử dụng module.exports dạng object để giống các Controller khác của nhóm
const taskController = {
  // Hàm tạo Task mới (Nhiệm vụ 2.3)
  store: async (req, res) => {
    try {
      const { title, description, projectId, deadline, priority } = req.body;

      // Kiểm tra logic nghiệp vụ: Deadline không được là ngày quá khứ
      const today = new Date().setHours(0, 0, 0, 0);
      const taskDeadline = new Date(deadline).setHours(0, 0, 0, 0);

      if (taskDeadline < today) {
        return res.status(400).json({
          success: false,
          message: "Ngày hết hạn không được nhỏ hơn ngày hiện tại!",
        });
      }

      const newTask = await Task.create({
        title,
        description,
        projectId,
        deadline,
        priority: priority || "Medium",
        status: "ToDo",
      });

      res.status(201).json({
        success: true,
        data: newTask,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "loz" + error.message });
    }
  },

  // Hàm lấy chi tiết Task
  show: async (req, res) => {
    try {
      const task = await Task.findById(req.params.id).populate(
        "assignee",
        "username",
      );
      if (!task)
        return res.status(404).json({ message: "Không tìm thấy task" });
      res.json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // GET /api/tasks/my-tasks
  getMyTasks: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const currentUserId = req.user.id || req.user._id;
      const { status, priority, search, overdue } = req.query;
      const query = {
        assignee: currentUserId,
        isDeleted: false,
      };
      const isOverdue = overdue === "true";

      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = priority;
      }

      if (search) {
        query.$or = [
          {
            title: {
              $regex: search,
              $options: "i",
            },
          },
          {
            description: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      if (isOverdue) {
        query.deadline = {
          $lt: new Date(),
        };
        if (!status) {
          query.status = {
            $ne: "Done",
          };
        }
      }

      const tasks = await Task.find(query)
        .populate("assignee", "fullname email avatar")
        .sort({ deadline: 1, createdAt: -1 });
      return res.status(200).json({
        success: true,
        message: "Get my tasks successfully",
        data: tasks,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  createTask: async (req, res) => {
    try {
      const { content, projectId, status } = req.body;
      const newTask = new Task({
        title: content,
        projectId: projectId,
        status: status || "ToDo",
      });
      await newTask.save();
      return res.redirect(`/api/projects/${projectId}/board`);
    } catch (error) {
      console.error("Lỗi Controller:", error);
      res.status(500).send("Lỗi tạo task");
    }
  },
  updateStatus: async (req, res) => {
    try {
      const { taskId, newStatus } = req.body;
      await Task.findByIdAndUpdate(taskId, { status: newStatus });
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  },
  deleteTask: async (req, res) => {
    try {
        const { id } = req.params;
        await Task.findByIdAndDelete(id);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
  },
};

module.exports = taskController;
