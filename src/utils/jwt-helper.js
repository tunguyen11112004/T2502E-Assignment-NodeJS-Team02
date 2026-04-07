const jwt = require("jsonwebtoken");

exports.updateSession = (res, user) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      fullname: user.fullname,
      avatar: user.avatar,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h" },
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000, // 1 giờ
  });
};
