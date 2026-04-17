const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task-controller");
const commentController = require("../controllers/comment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");
const {
  checkTaskPermission,
  checkProjectPermission,
} = require("../middlewares/auth");

// Route lọc task
router.get("/projects/:projectId/tasks", taskController.getProjectTasks);

// Route tạo task (POST)
router.post(
  "/create",
  verifyToken,
  checkProjectPermission,
  taskController.createTask,
);

// Route cập nhật trạng thái (PUT) - Dùng cho kéo thả
router.put(
  "/:id/update-status",
  verifyToken,
  checkTaskPermission,
  taskController.updateStatus,
);

router.get("/my-tasks", verifyToken, taskController.getMyTasks);

router.get("/deleted", verifyToken, taskController.getDeletedTasks);

router.post("/:taskId/comments", verifyToken, commentController.create);
router.get("/:taskId/comments", verifyToken, commentController.list);

router.put(
  "/:taskId/comments/:commentId",
  verifyToken,
  commentController.updateComment,
);

router.delete(
  "/:taskId/comments/:commentId",
  verifyToken,
  commentController.deleteComment,
);

router.delete(
  "/:id",
  verifyToken,
  checkTaskPermission,
  taskController.deleteTask,
);

router.get(
  "/:id",
  verifyToken,
  checkTaskPermission,
  taskController.getTaskDetail,
);

router.put(
  "/:id/content",
  verifyToken,
  checkTaskPermission,
  taskController.updateTaskContent,
);

router.put(
  "/:id/description",
  verifyToken,
  checkTaskPermission,
  taskController.updateTaskDescription,
);

router.put(
  "/:id/deadline",
  verifyToken,
  checkTaskPermission,
  taskController.updateDeadline,
);

router.post(
  "/:taskId/assignees",
  verifyToken,
  checkTaskPermission,
  taskController.addAssignee,
);

router.delete(
  "/:taskId/assignees/:userId",
  verifyToken,
  checkTaskPermission,
  taskController.removeAssignee,
);

router.patch(
  "/:id/restore",
  verifyToken,
  checkTaskPermission,
  taskController.restoreTask,
);

router.delete(
  "/:id/permanent",
  verifyToken,
  checkTaskPermission,
  taskController.permanentDeleteTask,
);

module.exports = router;
