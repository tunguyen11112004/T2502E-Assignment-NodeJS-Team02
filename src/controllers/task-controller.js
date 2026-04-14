const Task = require("../models/Task");
const TaskList = require("../models/TaskList");
const Project = require("../models/Project"); // Cần import Project model để kiểm tra projectId
const Comment = require("../models/comment");

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
      const task = await Task.findById(req.params.id).populate(
        "assignee",
        "username",
      ).populate("listId", "title");
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
        const taskList = await TaskList.findOne({ title: status });
        if (taskList) {
          query.listId = taskList._id;
        }
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
          const doneList = await TaskList.findOne({ title: "Done" });
          if (doneList) {
            query.listId = { $ne: doneList._id };
          }
        }
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
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  createTask: async (req, res) => {
    try {
      const { content, projectId, status } = req.body;
      // Tìm hoặc tạo TaskList với title = status, projectId
      let taskList = await TaskList.findOne({ title: status, projectId });
      if (!taskList) {
        taskList = await TaskList.create({ title: status, projectId });
      }
      const newTask = new Task({
        title: content,
        listId: taskList._id,
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
      // Lấy task để biết projectId từ listId
      const task = await Task.findById(taskId).populate('listId');
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const projectId = task.listId.projectId;
      // Tìm hoặc tạo TaskList với title = newStatus, projectId
      let taskList = await TaskList.findOne({ title: newStatus, projectId });
      if (!taskList) {
        taskList = await TaskList.create({ title: newStatus, projectId });
      }
      await Task.findByIdAndUpdate(taskId, { listId: taskList._id });
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error });
    }
  },
  deleteTask: async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id || req.user._id;

        const task = await Task.findById(id).populate("listId", "projectId");
        if (!task) {
          return res.status(404).json({ success: false, message: "Task not found" });
        }

        const Project = require("../models/Project");
        const project = await Project.findById(task.listId.projectId);

        if (!project || project.isDeleted) {
          return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (project.owner.toString() !== currentUserId.toString()) {
          return res.status(403).json({ success: false, message: "Only owner can delete tasks" });
        }

        await Task.findByIdAndUpdate(id, { isDeleted: true});
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
          return res.status(404).json({ success: false, message: "Task not found" });
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
          return res.status(404).json({ success: false, message: "Task không tồn tại" });
        }

        const Project = require("../models/Project");
        const project = await Project.findById(task.listId.projectId);

        if (!project || project.isDeleted) {
          return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (project.owner.toString() !== currentUserId.toString()) {
          return res.status(403).json({ success: false, message: "Only owner can update deadline" });
        }

        const selectedDeadline = new Date(deadline);
        if (isNaN(selectedDeadline.getTime())) {
          return res.status(400).json({ success: false, message: "Ngày không hợp lệ" });
        }
        const minCreatedAt = new Date(task.createdAt);
        minCreatedAt.setHours(0, 0, 0, 0);
        selectedDeadline.setHours(0, 0, 0, 0);
        if (selectedDeadline < minCreatedAt) {
          return res.status(400).json({
            success: false,
            message: "Ngày hết hạn không được trước ngày tạo task",
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
      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Only owner can manage assignees" });
      }

      const User = require("../models/User");
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      if (task.assignee.includes(userId)) {
        task.assignee.pull(userId);
        await task.save();
        return res.status(200).json({ success: true, code: 201, message: "Xóa assignee thành công" });
      }
      task.assignee.push(userId);
      await task.save();
      return res.status(200).json({ success: true, code: 202, message: "Thêm assignee thành công" });
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
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Only owner can manage assignees" });
      }

      const index = task.assignee.indexOf(userId);
      if (index === -1) {
        return res.status(400).json({ success: false, message: "User not assigned to this task" });
      }
      task.assignee.splice(index, 1);
      await task.save();
      res.status(200).json({ success: true, message: "Assignee removed" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getComments: async (req, res) => {
    try {
      const taskId = req.params.id;
      const comments = await Comment.find({ taskId }).populate("userId", "fullname avatar").sort({ createdAt: 1 });
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
        content
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
        return res.status(400).json({ success: false, message: "Project ID is required" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(projectId);

      if (!project || project.isDeleted) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Only owner can view deleted tasks" });
      }

      // Find all task lists of the project
      const taskLists = await TaskList.find({ projectId });
      const listIds = taskLists.map(tl => tl._id);

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
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      if (!task.isDeleted) {
        return res.status(400).json({ success: false, message: "Task is not deleted" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Only owner can restore tasks" });
      }

      task.isDeleted = false;
      await task.save();

      res.status(200).json({ success: true, message: "Task restored successfully" });
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
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      if (!task.isDeleted) {
        return res.status(400).json({ success: false, message: "Task is not deleted" });
      }

      const Project = require("../models/Project");
      const project = await Project.findById(task.listId.projectId);

      if (!project || project.isDeleted) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }

      if (project.owner.toString() !== currentUserId.toString()) {
        return res.status(403).json({ success: false, message: "Only owner can permanently delete tasks" });
      }

      await Task.findByIdAndDelete(id);

      res.status(200).json({ success: true, message: "Task permanently deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = taskController;

// GET /api/tasks/my-tasks
exports.getMyTasks = async (req, res) => {
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
};

