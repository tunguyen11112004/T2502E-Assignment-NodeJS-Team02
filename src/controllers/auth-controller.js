const authService = require("../services/auth-service");
const jwtHelper = require("../utils/jwt-helper");

// 1. Hiển thị trang đăng ký
exports.renderRegister = async (req, res) => {
  res.render("client/register", {
    layout: "layouts/auth",
    title: "Đăng ký TaskFlow",
    error: null,
  });
};

// 2. Xử lý logic đăng ký (Gộp cả Web và API)
exports.handleRegister = async (req, res) => {
  try {
    const user = await authService.register({
      fullname: req.body.fullname,
      email: req.body.email,
      password: req.body.password,
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(201).json({ success: true, message: "Đăng ký thành công", user });
    }
    res.redirect("/auth/login?message=Đăng ký tài khoản thành công");
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.render("client/register", { layout: "layouts/auth", title: "Đăng ký", error: error.message });
  }
};

// 3. Hiển thị trang đăng nhập
exports.renderLogin = async (req, res) => {
  res.render("client/login", {
    layout: "layouts/auth",
    title: "Đăng nhập",
    error: null,
  });
};

// 4. Xử lý logic đăng nhập (ĐỂ LẤY TOKEN TRÊN POSTMAN)
exports.handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken } = await authService.login(email, password);

    jwtHelper.updateSession(res, user);

    if (req.headers.accept && req.headers.accept.includes('application/json') || req.originalUrl.includes('/api/')) {
      return res.status(200).json({
        success: true,
        accessToken: accessToken, // <--- TOKEN CỦA BẠN ĐÂY
        user: { id: user._id, fullname: user.fullname, email: user.email }
      });
    }
    res.redirect("/");
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.render("client/login", { layout: "layouts/auth", title: "Đăng nhập", error: error.message });
  }
};

// 5. Đăng xuất
exports.handleLogout = (req, res) => {
  res.clearCookie("accessToken");
  res.redirect("/auth/login");
};

// 6. Hiển thị Profile
exports.renderProfile = async (req, res) => {
  try {
    const userProfile = await authService.getUserProfile(req.user.id);
    res.render("client/profile", {
      layout: "layouts/main",
      title: "Hồ sơ cá nhân",
      userProfile: userProfile,
    });
  } catch (error) {
    res.status(500).send("Lỗi máy chủ");
  }
};

// 7. Các hàm Update khác (giữ nguyên logic cũ của bạn)
exports.handleUpdateAvatar = async (req, res) => { /* Code cũ của bạn */ };
exports.handleChangePassword = async (req, res) => { /* Code cũ của bạn */ };
exports.handleUpdateProfile = async (req, res) => { /* Code cũ của bạn */ };