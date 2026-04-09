const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

// Kiểm tra và nạp route
router.post('/create', verifyToken, taskController.createTask);
router.get('/my-tasks', verifyToken, taskController.getMyTasks);

module.exports = router;