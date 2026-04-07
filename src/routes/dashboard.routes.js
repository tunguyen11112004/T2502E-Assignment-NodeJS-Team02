const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Lưu ý: Bạn cần middleware xác thực (JWT) ở đây
// Giả sử bạn có middleware tên là 'protect'
// const { protect } = require('../middleware/auth.middleware');
// router.use(protect);

router.get('/my-tasks', dashboardController.getMyTasks);
router.get('/overdue', dashboardController.getOverdueTasks);

module.exports = router;