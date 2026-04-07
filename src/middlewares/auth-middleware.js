const jwt = require("jsonwebtoken");

// Kiểm tra User từ cả Cookie và Header
exports.checkUser = (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    req.user = null;
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    next();
  } catch (error) {
    res.clearCookie("accessToken");
    req.user = null;
    res.locals.user = null;
    next();
  }
};

// Bắt buộc đăng nhập
exports.verifyToken = (req, res, next) => {
  if (!req.user) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ success: false, message: "Unauthorized: Access denied" });
    }
    return res.redirect("/auth/login");
  }
  next();
};