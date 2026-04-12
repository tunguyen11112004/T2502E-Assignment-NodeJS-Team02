const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task-controller");
const commentController = require("../controllers/comment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

// Route tạo task (POST)
router.post('/create', verifyToken, taskController.createTask);

// Route cập nhật trạng thái (PUT) - Dùng cho kéo thả
router.put('/update-status', verifyToken, taskController.updateStatus);

router.get('/my-tasks', verifyToken, taskController.getMyTasks);

router.post(
  "/:taskId/comments",
  verifyToken,
  commentController.create,
);
router.get(
  "/:taskId/comments",
  verifyToken,
  commentController.list,
);

router.delete('/:id', verifyToken, taskController.deleteTask);

router.get('/:id', verifyToken, taskController.getTaskDetail);

router.put('/:id/content', verifyToken, taskController.updateTaskContent);

router.put('/:id/description', verifyToken, taskController.updateTaskDescription);

router.put('/:id/deadline', verifyToken, taskController.updateDeadline);

module.exports = router;