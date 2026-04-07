const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Kết nối tới MongoDB (Sử dụng biến môi trường hoặc chuỗi kết nối trực tiếp)
    // Thay 'mongodb://localhost:27017/taskflow' bằng URL của bạn nếu dùng MongoDB Atlas
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Dừng app nếu không kết nối được DB
  }
};

module.exports = connectDB;