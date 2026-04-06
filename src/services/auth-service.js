const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

exports.register = async (userData) => {
  const { fullname, email, password } = userData;

  // 1. Kiểm tra email đã tồn tại chưa
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error("Email này đã được đăng ký!");
  }

  // 2. Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 3. Tạo user mới và lưu vào DB
  const newUser = new User({
    fullname,
    email,
    password: hashedPassword,
  });

  return await newUser.save();
};

exports.login = async (email, password) => {
  // 1. Tìm user theo email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Email hoặc mật khẩu không chính xác!");
  }

  // 2. Kiểm tra mật khẩu (So sánh pass nhập vào với pass đã hash trong DB)
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Email hoặc mật khẩu không chính xác!");
  }

  // 3. Tạo Access Token (Key VIP lấy từ .env)
  const accessToken = jwt.sign(
    { id: user._id, fullname: user.fullname, avatar: user.avatar },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );

  return { user, accessToken };
};

// Hàm này sẽ được dùng trong auth-middleware để lấy thông tin user từ token
exports.getUserProfile = async (userId) => {
  // Tìm user và loại bỏ mật khẩu khỏi kết quả trả về để bảo mật
  return await User.findById(userId).select("-password");
};

// Cập nhật Avatar
exports.updateAvatar = async (userId, avatarPath) => {
  const user = await User.findById(userId);

  // Xóa ảnh cũ nếu có và không phải ảnh mặc định
  if (user && user.avatar && !user.avatar.includes("default-avatar.png")) {
    const oldPath = path.join(__dirname, "../../public", user.avatar);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  user.avatar = avatarPath;
  await user.save();
  return user;
};

// Đổi mật khẩu
exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);

  // Kiểm tra mật khẩu cũ
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Mật khẩu cũ không chính xác");

  // Mã hóa mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedPassword;
  await user.save();
  return true;
};

// Cập nhật thông tin cá nhân (Fullname)
exports.updateProfile = async (userId, updateData) => {
  return await User.findByIdAndUpdate(
    userId,
    { fullname: updateData.fullname },
    { new: true }, // Trả về dữ liệu mới sau khi cập nhật
  );
};
