const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

// Route tạo task (POST)
router.post('/create', verifyToken, taskController.createTask);

// Route cập nhật trạng thái (PUT) - Dùng cho kéo thả
router.put('/update-status', verifyToken, taskController.updateStatus);

router.get('/my-tasks', verifyToken, taskController.getMyTasks);

module.exports = router;