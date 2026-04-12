const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import model vào đây

exports.updateSession = async (res, user) => {
    // 1. Tạo Access Token (1h)
    const accessToken = jwt.sign(
        { id: user._id, fullname: user.fullname, avatar: user.avatar },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
    );

    // 2. Tạo Refresh Token (7d)
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );

    // 3. LƯU REFRESH TOKEN VÀO DATABASE
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshToken });

    // 4. Thiết lập Cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000 
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/refresh-token', 
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });
};