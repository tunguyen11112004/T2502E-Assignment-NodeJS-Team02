const authService = require("../services/auth-service");
const jwtHelper = require("../utils/jwt-helper");

// Hiển thị trang đăng ký
exports.renderRegister = async (req, res) => {
  res.render("client/register", {
    layout: "layouts/auth",
    title: "Đăng ký TaskFlow",
    error: null,
  });
};

// Xử lý logic đăng ký
exports.handleRegister = async (req, res) => {
  try {
    const user = await authService.register({
      fullname: req.body.fullname,
      email: req.body.email,
      password: req.body.password,
    });

    // Chuyển hướng về trang Login sau khi tạo thành công giống cách bạn chuyển về list buddy
    res.redirect("/auth/login?message=Đăng ký tài khoản thành công");
  } catch (error) {
    // Nếu lỗi, render lại trang đăng ký và hiển thị thông báo lỗi
    res.render("client/register", {
      layout: "layouts/auth",
      title: "Đăng ký TaskFlow",
      error: error.message,
    });
  }
};

// Hiển thị trang đăng nhập
exports.renderLogin = async (req, res) => {
  res.render("client/login", {
    layout: "layouts/auth",
    title: "Đăng nhập",
    error: null,
  });
};

// Xử lý logic đăng nhập
exports.handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken } = await authService.login(email, password);

    // Lưu Access Token vào Cookie (HTTP-only để tăng cường bảo mật, không cho JavaScript truy cập)
    jwtHelper.updateSession(res, user);

    // Đăng nhập xong thì về trang chủ
    res.redirect("/");
  } catch (error) {
    // Nếu sai pass/email, quay lại trang login và hiện lỗi
    res.render("client/login", {
      layout: "layouts/auth",
      title: "Đăng nhập",
      error: error.message,
    });
  }
};

// Xử lý logic đăng xuất
exports.handleLogout = (req, res) => {
  res.clearCookie("accessToken");
  res.redirect("/auth/login");
};

// Hiển thị trang Profile (Dùng cho route /profile, có verifyToken ở middleware để bắt buộc phải đăng nhập mới vào được)
exports.renderProfile = async (req, res) => {
  try {
    // req.user.id lấy từ middleware verifyToken đã giải mã JWT
    const userProfile = await authService.getUserProfile(req.user.id);

    res.render("client/profile", {
      layout: "layouts/main", // Trang này dùng giao diện chính (có Header/Sidebar)
      title: "Hồ sơ cá nhân",
      userProfile: userProfile,
    });
  } catch (error) {
    res.status(500).send("Lỗi máy chủ");
  }
};

// Xử lý Upload Avatar
exports.handleUpdateAvatar = async (req, res) => {
  try {
    if (!req.file) throw new Error("Vui lòng chọn ảnh");
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await authService.updateAvatar(req.user.id, avatarPath);

    // Ghi đè cookie mới để cập nhật avatar hiển thị ở header
    jwtHelper.updateSession(res, user);

    res.redirect(
      "/auth/profile?status=success&message=Cập nhật ảnh thành công",
    );
  } catch (error) {
    // Nếu lỗi user is not defined ở đây, hãy kiểm tra xem bạn có dùng biến "user" trong catch không
    res.redirect(
      "/auth/profile?status=error&message=" + encodeURIComponent(error.message),
    );
  }
};

// Xử lý Đổi mật khẩu
exports.handleChangePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword)
      throw new Error("Mật khẩu mới không khớp");

    await authService.changePassword(req.user.id, oldPassword, newPassword);
    res.redirect(
      "/auth/profile?status=success&message=Mật khẩu đã được cập nhật",
    );
  } catch (error) {
    res.redirect(
      "/auth/profile?status=error&message=" + encodeURIComponent(error.message),
    );
  }
};

// Xử lý cập nhật thông tin cá nhân
exports.handleUpdateProfile = async (req, res) => {
  try {
    const { fullname } = req.body;
    const user = await authService.updateProfile(req.user.id, { fullname });

    // Ghi đè cookie mới
    jwtHelper.updateSession(res, user);

    res.redirect(
      "/auth/profile?status=success&message=Cập nhật tên thành công",
    );
  } catch (error) {
    res.redirect(
      "/auth/profile?status=error&message=" + encodeURIComponent(error.message),
    );
  }
};
