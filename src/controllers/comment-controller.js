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

      const hasProjectContext = task.listId && task.listId.projectId;
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

  updateComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.id || req.user._id;

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bình luận" });
      }

      const isAuthor = comment.user.toString() === userId.toString();
      if (!isAuthor) {
        return res
          .status(403)
          .json({ success: false, message: "Không có quyền sửa" });
      }

      comment.content = content;
      await comment.save();

      return res.status(200).json({ success: true, data: comment });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.id || req.user._id;

      // 1. Tìm bình luận
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy bình luận" });
      }

      // 2. Tìm Task và Project để kiểm tra quyền Owner
      const task = await Task.findById(comment.task).populate({
        path: "listId",
        select: "projectId",
      });

      if (!task || !task.listId) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Dữ liệu task hoặc project không hợp lệ",
          });
      }

      const project = await Project.findById(task.listId.projectId);
      if (!project) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy project" });
      }

      // 3. Logic kiểm tra quyền Multi-Owner
      const userIdStr = userId.toString();
      const isAuthor = comment.user.toString() === userIdStr;

      // QUAN TRỌNG: Kiểm tra trong mảng members thay vì chỉ kiểm tra project.owner
      const isProjectOwner = project.members.some(
        (m) => m.user.toString() === userIdStr && m.role === "owner",
      );

      // Quyền xóa: Tác giả bình luận HOẶC bất kỳ ai có role 'owner' trong dự án
      if (!isAuthor && !isProjectOwner) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa bình luận này",
        });
      }

      // 4. Thực hiện xóa
      await Comment.findByIdAndDelete(commentId);

      return res
        .status(200)
        .json({ success: true, message: "Đã xóa bình luận thành công" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = commentController;
