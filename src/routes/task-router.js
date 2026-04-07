const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task-controller');
const authMiddleware = require('../middlewares/auth-middleware');
// Bảo vệ tất cả các route bằng middleware đăng nhập
router.use(authMiddleware);

router.post('/', taskController.createTask);

router.patch('/:taskId/assign', taskController.assignUser);

router.patch('/:taskId/status', taskController.updateStatusPriority);

router.patch('/:taskId/deadline', taskController.updateDeadline);

module.exports = router;