const express = require("express");
const router = express.Router();
const taskListController = require("../controllers/tasklist-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

// Route tạo TaskList mới
router.post('/create', verifyToken, taskListController.create);

// Route xóa mềm TaskList
router.delete('/:id', verifyToken, taskListController.delete);

module.exports = router;