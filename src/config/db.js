const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ưu tiên dùng biến môi trường, nếu không có thì dùng localhost
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:2017/taskflow');
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Dừng app nếu không kết nối được DB
  }
};

module.exports = connectDB;