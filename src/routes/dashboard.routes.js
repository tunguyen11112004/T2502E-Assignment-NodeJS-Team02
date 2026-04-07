const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { checkUser, verifyToken } = require('../middlewares/auth-middleware');

// Áp dụng middleware bảo mật cho tất cả các routes dashboard
router.use(checkUser);
router.use(verifyToken);

router.get('/my-tasks', dashboardController.getMyTasks);
router.get('/overdue', dashboardController.getOverdueTasks);

module.exports = router;