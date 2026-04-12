const jwt = require('jsonwebtoken');
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
    // 1. Lấy thêm confirmPassword từ body
    const { fullname, email, password, confirmPassword } = req.body;

    // 2. Logic kiểm tra khớp mật khẩu (Security Check)
    if (password !== confirmPassword) {
      throw new Error("Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại!");
    }

    // 3. Nếu khớp mới gọi Service để tạo User
    await authService.register({
      fullname,
      email,
      password,
    });

    res.redirect("/auth/login?status=success&message=Đăng ký tài khoản thành công");
  } catch (error) {
    res.render("client/register", {
      layout: "layouts/auth",
      title: "Đăng ký TaskFlow",
      error: error.message,
      // Gửi lại dữ liệu cũ để User không phải nhập lại từ đầu (trừ password)
      oldData: req.body 
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
    await jwtHelper.updateSession(res, user);

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
exports.handleLogout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;

        if (refreshToken) {
            // Giải mã để lấy ID user mà không cần verify (vì có thể token hết hạn rồi)
            const decoded = jwt.decode(refreshToken);
            if (decoded && decoded.id) {
                // XÓA TRONG DB: Đây là bước quan trọng nhất để vô hiệu hóa hoàn toàn
                await User.findByIdAndUpdate(decoded.id, { refreshToken: "" });
            }
        }

        // Xóa sạch Cookies ở trình duyệt
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken', { path: '/auth/refresh-token' });

        return res.redirect('/auth/login?message=Đã đăng xuất thành công');
    } catch (error) {
        res.redirect('/auth/login');
    }
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
    await jwtHelper.updateSession(res, user);

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
    await jwtHelper.updateSession(res, user);

    res.redirect(
      "/auth/profile?status=success&message=Cập nhật tên thành công",
    );
  } catch (error) {
    res.redirect(
      "/auth/profile?status=error&message=" + encodeURIComponent(error.message),
    );
  }
};

exports.handleRefreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) throw new Error("Phiên đăng nhập hết hạn");

        // 1. Kiểm tra Token có hợp lệ không
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // 2. Kiểm tra Token có khớp với Token trong Database không (Bảo mật cao)
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            throw new Error("Token không hợp lệ hoặc đã bị thu hồi");
        }

        // 3. Nếu mọi thứ OK, cấp Access Token mới
        await jwtHelper.updateSession(res, user);

        res.json({ status: 'success', message: 'Đã gia hạn phiên làm việc' });
    } catch (error) {
      	// Nếu Refresh Token cũng lỗi -> Bắt login lại
        res.status(401).redirect('/auth/login?message=Vui lòng đăng nhập lại');
    }
};
