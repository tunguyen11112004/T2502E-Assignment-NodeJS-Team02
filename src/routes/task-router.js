const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

// Route tạo task (POST)
router.post('/create', verifyToken, taskController.createTask);

// Route cập nhật trạng thái (PUT) - Dùng cho kéo thả
router.put('/update-status', verifyToken, taskController.updateStatus);

router.get('/my-tasks', verifyToken, taskController.getMyTasks);

router.delete('/:id', verifyToken, taskController.deleteTask);

router.get('/:id', verifyToken, taskController.getTaskDetail);

router.put('/:id/content', verifyToken, taskController.updateTaskContent);

router.put('/:id/description', verifyToken, taskController.updateTaskDescription);

module.exports = router;