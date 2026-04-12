const Comment = require("../models/comment");
const Task = require("../models/Task");
const Project = require("../models/Project");

const commentController = {
  create: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const task = await Task.findById(taskId).populate({
        path: "listId",
        select: "projectId",
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy task",
        });
      }

      const hasProjectContext =
        task.listId && task.listId.projectId;
      if (!hasProjectContext) {
        return res.status(404).json({
          success: false,
          message: "Task không còn task list hợp lệ",
        });
      }

      const projectId = task.listId.projectId;
      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy project",
        });
      }

      const userIdStr = userId.toString();
      const isMember = project.members.some(
        (memberId) => memberId.toString() === userIdStr,
      );
      const isProjectOwner = project.owner.toString() === userIdStr;
      const canCreate = isMember || isProjectOwner;

      if (!canCreate) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền bình luận trong project này",
        });
      }

      const comment = await Comment.create({
        task: taskId,
        user: userId,
        content,
      });

      const populated = await Comment.findById(comment._id).populate(
        "user",
        "fullname avatar",
      );

      return res.status(201).json({
        success: true,
        data: populated,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  list: async (req, res) => {
    try {
      const { taskId } = req.params;

      const comments = await Comment.find({ task: taskId })
        .populate("user", "fullname avatar")
        .sort({ createdAt: 1 });

      return res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận",
        });
      }

      const isAuthor = comment.user.toString() === userId.toString();

      if (!isAuthor) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền sửa bình luận này",
        });
      }

      const task = await Task.findById(comment.task).populate({
        path: "listId",
        select: "projectId",
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy task",
        });
      }

      const hasProjectContext =
        task.listId && task.listId.projectId;
      if (!hasProjectContext) {
        return res.status(404).json({
          success: false,
          message: "Task không còn task list hợp lệ",
        });
      }

      const project = await Project.findById(task.listId.projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy project",
        });
      }

      const userIdStr = userId.toString();
      const isMember = project.members.some(
        (memberId) => memberId.toString() === userIdStr,
      );
      const isProjectOwner = project.owner.toString() === userIdStr;
      const canEditInProject = isMember || isProjectOwner;

      if (!canEditInProject) {
        return res.status(403).json({
          success: false,
          message: "Bạn không còn quyền trong project này",
        });
      }

      comment.content = content;
      await comment.save();

      return res.status(200).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  remove: async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bình luận",
        });
      }

      const task = await Task.findById(comment.task).populate({
        path: "listId",
        select: "projectId",
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy task",
        });
      }

      const hasProjectContext =
        task.listId && task.listId.projectId;
      if (!hasProjectContext) {
        return res.status(404).json({
          success: false,
          message: "Task không còn task list hợp lệ",
        });
      }

      const project = await Project.findById(task.listId.projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy project",
        });
      }

      const userIdStr = userId.toString();
      const isAuthor = comment.user.toString() === userIdStr;
      const isMember = project.members.some(
        (memberId) => memberId.toString() === userIdStr,
      );
      const isProjectOwner = project.owner.toString() === userIdStr;
      const canDelete =
        isProjectOwner || (isAuthor && isMember);

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: isAuthor
            ? "Bạn không còn quyền trong project này"
            : "Bạn không có quyền xóa bình luận này",
        });
      }

      await Comment.findByIdAndDelete(commentId);

      return res.status(200).json({
        success: true,
        message: "Đã xóa bình luận",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = commentController;
