const jwt = require("jsonwebtoken");

// Middleware 1: Chỉ kiểm tra để hiển thị Header (Dùng cho toàn bộ App)
exports.checkUser = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) {
    res.locals.user = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    res.locals.user = decoded; // Giúp file header.ejs luôn có biến user để hiện Avatar
    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.locals.user = null;
    next();
  }
};

// Middleware 2: Bắt buộc đăng nhập (Dùng cho các trang như Profile, Create Project)
// Middleware 2: Bắt buộc đăng nhập cho API
exports.verifyToken = (req, res, next) => {
  if (!req.user) {
   
  }

  return next();
};