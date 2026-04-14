const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller"); // Đổi tên file controller luôn cho đồng bộ
const upload = require("../middlewares/upload-middleware");
const { verifyToken } = require("../middlewares/auth-middleware");

// Các route cho Register
router.get("/register", authController.renderRegister);
router.post("/register", authController.handleRegister);

// Các route cho Login
router.get("/login", authController.renderLogin);
router.post("/login", authController.handleLogin);

// Route cho Logout
router.get("/logout", authController.handleLogout);

// Route cho Profile (Có middleware verifyToken để bắt buộc phải đăng nhập mới vào được)
router.get("/profile", verifyToken, authController.renderProfile);

// Route cập nhật avatar (Dùng upload.single('avatar') để nhận 1 file từ input name="avatar")
router.post(
  "/profile/avatar",
  verifyToken,
  upload.single("avatar"),
  authController.handleUpdateAvatar,
);

// Route đổi mật khẩu
router.post(
  "/profile/change-password",
  verifyToken,
  authController.handleChangePassword,
);

// Route cập nhật thông tin cá nhân (fullname)
router.post("/profile/update", verifyToken, authController.handleUpdateProfile);

// Route refresh token
router.get('/refresh-token', authController.handleRefreshToken);

module.exports = router;
