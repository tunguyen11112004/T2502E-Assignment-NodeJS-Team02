const jwt = require("jsonwebtoken");
const User = require("../models/User");
const jwtHelper = require("../utils/jwt-helper");

// Middleware 1: Kiểm tra để hiển thị Header + Tự động làm mới Token
exports.checkUser = async (req, res, next) => {
    const { accessToken, refreshToken } = req.cookies;

    // Nếu không có bất kỳ token nào -> Chắc chắn là khách, không làm gì thêm
    if (!accessToken && !refreshToken) {
        req.user = null;
        res.locals.user = null;
        return next();
    }

    try {
        if (accessToken) {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            req.user = decoded;
            res.locals.user = decoded;
            return next();
        }
    } catch (error) { /* Access Token hỏng, thử refresh bên dưới */ }

    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findById(decoded.id);

            // KIỂM TRA QUAN TRỌNG: Nếu trong DB trống (đã logout) -> Không cho refresh
            if (user && user.refreshToken === refreshToken && user.refreshToken !== "") {
                await jwtHelper.updateSession(res, user);
                const userData = { id: user._id, fullname: user.fullname, avatar: user.avatar };
                req.user = userData;
                res.locals.user = userData;
                return next();
            }
        } catch (rfError) { /* Refresh hỏng */ }
    }

    // Nếu chạy đến đây tức là token lởm hoặc đã logout -> Xóa sạch rác
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: '/auth/refresh-token' });
    req.user = null;
    res.locals.user = null;
    next();
};

exports.verifyToken = (req, res, next) => {
    // Nếu checkUser không tìm thấy user hợp lệ -> Đẩy thẳng về Login
    if (!req.user) {
        return res.redirect("/auth/login");
    }
    next();
};