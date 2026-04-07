const express = require('express');
const router = express.Router();
const User = require('../models/user.model'); // Import khuôn mẫu vừa tạo

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body; // Lấy dữ liệu bạn vừa nhập ở Postman

    // Tạo user mới trong Database
    const newUser = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: "Đã lưu User vào Database thành công!",
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;