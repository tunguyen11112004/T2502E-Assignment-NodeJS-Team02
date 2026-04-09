const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

// GET MY TASKS
router.get("/my-tasks", verifyToken, taskController.getMyTasks);

module.exports = router;
