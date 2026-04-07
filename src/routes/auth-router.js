const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller");

// Dòng 6 (Dòng bị lỗi trong ảnh của bạn):
router.get("/register", authController.renderRegister);

// Dòng 7:
router.get("/login", authController.renderLogin);

// Các dòng xử lý logic
router.post("/register", authController.handleRegister);
router.post("/login", authController.handleLogin);
router.get("/logout", authController.handleLogout);

// Các dòng Profile
router.get("/profile", authController.renderProfile);
router.post("/update-avatar", authController.handleUpdateAvatar);
router.post("/change-password", authController.handleChangePassword);
router.post("/update-profile", authController.handleUpdateProfile);

module.exports = router;