const Task = require("../models/Task");
const TaskList = require("../models/TaskList");
const Project = require("../models/Project"); // Cần import Project model để kiểm tra projectId
const Comment = require("../models/comment");

// Sử dụng module.exports dạng object để giống các Controller khác của nhóm
const taskController = {
  //lọc task theo
  getProjectTasks: async (req, res) => {
    try {
      const { projectId } = req.params;
      const { member, overdue } = req.query;

      const query = {
        projectId: projectId,
        isDeleted: false,
      };

      // 1. Lọc theo thành viên (assignee)
      if (member) {
        query.assignee = member;
      }

      // 2. Lọc theo quá hạn (deadline)
      if (overdue === "true") {
        query.deadline = { $lt: new Date() };
        // Bỏ qua task đã hoàn thành (cột Done)
        const doneList = await TaskList.findOne({ projectId, title: "Done" });
        if (doneList) {
          query.listId = { $ne: doneList._id };
        }
      }

      const tasks = await Task.find(query)
        .populate("assignee", "fullname email avatar")
        .populate("listId", "title")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

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

      // Tìm hoặc tạo TaskList có title "ToDo" cho project
      let todoList = await TaskList.findOne({ title: "ToDo", projectId });
      if (!todoList) {
        todoList = await TaskList.create({ title: "ToDo", projectId });
      }

      const newTask = await Task.create({
        title,
        description,
        deadline,
        priority: priority || "Medium",
        listId: todoList._id,
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
      const task = await Task.findById(req.params.id)
        .populate("assignee", "username")
        .populate("listId", "title");
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
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const currentUserId = req.user.id || req.user._id;
      const { status, priority, search, overdue } = req.query;

      const query = {
        assignee: currentUserId,
        isDeleted: false,
      };

      if (status) {
        const taskList = await TaskList.findOne({ title: status });
        if (taskList) query.listId = taskList._id;
      }

      if (priority) query.priority = priority;

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      if (overdue === "true") {
        query.deadline = { $lt: new Date() };
        const doneList = await TaskList.findOne({ title: "Done" });
        if (doneList) query.listId = { $ne: doneList._id };
      }

      const tasks = await Task.find(query)
        .populate("assignee", "fullname email avatar")
        .populate("listId", "title")
        .sort({ deadline: 1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Get my tasks successfully",
        data: tasks,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  createTask: async (req, res) => {
    try {
      const { content, projectId, status } = req.body;

      let taskList = await TaskList.findOne({ title: status, projectId });
      if (!taskList) {
        taskList = await TaskList.create({ title: status, projectId });
      }

      const newTask = new Task({
        title: content,
        listId: taskList._id,
      });
      await newTask.save();

      
      const io = req.app.get("io");
      if (io) {
        // Kiểm tra xem req.user có tồn tại không trước khi gọi toString()
        const senderId =
          req.user && req.user._id ? req.user._id.toString() : "anonymous";

        console.log("--- DEBUG CREATE TASK ---");
        console.log("Sender ID:", senderId);
        console.log("Project ID:", projectId);

        io.to(projectId).emit("task-created", {
          message: "Một thẻ mới vừa được tạo!",
          senderId: senderId,
          projectId: projectId,
        });
      }

      
      return res.redirect(`/api/projects/${projectId}/board`);
    } catch (error) {
      console.error("Lỗi Controller:", error);
      res.status(500).send("Lỗi tạo task");
    }
  },

  // task-controller.js
  updateStatus: async (req, res) => {
    try {
      const taskId = req.params.id; // Lấy ID từ URL (Param)
      const { newStatus } = req.body; // Lấy Status từ Body

      const task = await Task.findById(taskId).populate("listId");
      if (!task) return res.status(404).json({ message: "Task not found" });

      const projectId = task.listId.projectId.toString();

      // ... Logic tìm TaskList và cập nhật vị trí ...
      let taskList = await TaskList.findOne({ title: newStatus, projectId });
      if (!taskList) {
        taskList = await TaskList.create({ title: newStatus, projectId });
      }
      await Task.findByIdAndUpdate(taskId, { listId: taskList._id });

      // ĐẨY SOCKET
      const io = req.app.get("io");
      if (io) {
        console.log("--- DEBUG SOCKET ---");
        console.log("Phòng dự án:", projectId);
        io.to(projectId).emit("notification", {
          content: "Một thẻ vừa được di chuyển sang cột: " + newStatus,
          projectId: projectId,
          senderId: req.user._id,
        });

        console.log("✅ Đã phát tín hiệu notification tới phòng:", projectId);
      }
      return res.status(200).json({ 
        success: true, 
        message: "Cập nhật vị trí thành công" 
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id || req.user._id;

      const task = await Task.findById(id).populate("listId", "projectId");
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Only owner can delete tasks" });
      }

      await Task.findByIdAndUpdate(id, { isDeleted: true });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  },
  getTaskDetail: async (req, res) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate("listId", "title projectId")
        .populate("assignee", "fullname email avatar");
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateTaskContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { title } = req.body;
      await Task.findByIdAndUpdate(id, { title }); // Giả sử 'title' là trường chứa nội dung chính
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  },
  updateTaskDescription: async (req, res) => {
    try {
      const { id } = req.params;
      const { description } = req.body;
      await Task.findByIdAndUpdate(id, { description: description });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  },
  updateDeadline: async (req, res) => {
    try {
      const { id } = req.params;
      const { deadline } = req.body;
      const currentUserId = req.user.id || req.user._id;

      const task = await Task.findById(id).populate("listId", "projectId");
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task không tồn tại" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Only owner can update deadline" });
      }

      const selectedDeadline = new Date(deadline);
      if (isNaN(selectedDeadline.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: "Ngày không hợp lệ" });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDeadline.setHours(0, 0, 0, 0);
      if (selectedDeadline < today) {
        return res.status(400).json({
          success: false,
          message: "Ngày hết hạn không được trước ngày hiện tại",
        });
      }
      await Task.findByIdAndUpdate(id, { deadline: selectedDeadline });
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  },

  addAssignee: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { userId } = req.body;
      const currentUserId = req.user.id || req.user._id;

      const task = await Task.findById(taskId).populate("listId", "projectId");
      if (!task)
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (project.owner.toString() !== currentUserId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Only owner can manage" });
      }

      const io = req.app.get("io");
      const projectId = task.listId.projectId.toString();
      let isAdding = false;

      if (task.assignee.includes(userId)) {
        task.assignee.pull(userId);
        isAdding = false;
      } else {
        task.assignee.push(userId);
        isAdding = true;
      }

      await task.save();

      if (io) {
        // Cập nhật giao diện chung (Avatar)
        io.to(projectId).emit("task-updated");

        // Gửi thông báo riêng biệt cho người nhận (nếu không phải chính mình)
        if (userId.toString() !== currentUserId.toString()) {
          const message = isAdding
            ? `Bạn vừa được thêm vào task: ${task.title}`
            : `Bạn đã được xóa khỏi task: ${task.title}`;

          io.to(userId.toString()).emit("notification", { content: message });
        }
      }

      return res.status(200).json({
        success: true,
        message: isAdding
          ? "Bạn đã thêm thành viên thành công"
          : "Bạn đã xóa thành viên thành công",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  removeAssignee: async (req, res) => {
    try {
      const { taskId, userId } = req.params;
      const currentUserId = req.user.id || req.user._id;

      const task = await Task.findById(taskId).populate("listId", "projectId");
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Only owner can manage assignees" });
      }

      const index = task.assignee.indexOf(userId);
      if (index === -1) {
        return res
          .status(400)
          .json({ success: false, message: "User not assigned to this task" });
      }

      task.assignee.splice(index, 1);
      await task.save();

      // Real-time: Báo cho cả Board cập nhật lại avatar thẻ
      const io = req.app.get("io");
      if (io) io.to(task.listId.projectId.toString()).emit("task-updated");

      res.status(200).json({ success: true, message: "Assignee removed" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getComments: async (req, res) => {
    try {
      const taskId = req.params.id;
      const comments = await Comment.find({ taskId })
        .populate("userId", "fullname avatar")
        .sort({ createdAt: 1 });
      res.status(200).json({ success: true, data: comments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  createComment: async (req, res) => {
    try {
      const taskId = req.params.id;
      const content = req.body.content;
      const userId = req.user.id || req.user._id;
      const newComment = new Comment({
        taskId,
        userId,
        content,
      });
      await newComment.save();
      res.status(200).json({ success: true, data: newComment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDeletedTasks: async (req, res) => {
    try {
      const { projectId } = req.query;
      const currentUserId = req.user.id || req.user._id;

      if (!projectId) {
        return res
          .status(400)
          .json({ success: false, message: "Project ID is required" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(projectId);

      if (!project || project.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only owner can view deleted tasks",
        });
      }

      // Find all task lists of the project
      const taskLists = await TaskList.find({ projectId });
      const listIds = taskLists.map((tl) => tl._id);

      // Find deleted tasks in those lists
      const tasks = await Task.find({
        listId: { $in: listIds },
        isDeleted: true,
      })
        .populate("assignee", "fullname email avatar")
        .populate("listId", "title")
        .sort({ updatedAt: -1 });

      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  restoreTask: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id || req.user._id;

      const task = await Task.findById(id).populate("listId", "projectId");
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      if (!task.isDeleted) {
        return res
          .status(400)
          .json({ success: false, message: "Task is not deleted" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Only owner can restore tasks" });
      }

      task.isDeleted = false;
      await task.save();

      res
        .status(200)
        .json({ success: true, message: "Task restored successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  permanentDeleteTask: async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id || req.user._id;

      const task = await Task.findById(id).populate("listId", "projectId");
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      if (!task.isDeleted) {
        return res
          .status(400)
          .json({ success: false, message: "Task is not deleted" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only owner can permanently delete tasks",
        });
      }

      await Task.findByIdAndDelete(id);

      res
        .status(200)
        .json({ success: true, message: "Task permanently deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = taskController;
