const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

// 1. IMPORT MIDDLEWARES & ROUTERS
const { errorHandler } = require("./middlewares/errorhandler");
// const authMiddleware = require("./middlewares/auth-middleware"); // Dùng khi cần bảo vệ route
const authRouter = require("./routes/auth-router");
const dashboardRouter = require("./routes/dashboard.routes"); // Thêm route của bạn vào đây

const app = express();

// 2. CẤU HÌNH VIEW ENGINE & LAYOUTS (Dành cho giao diện EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts); 
app.set('layout', 'layouts/main'); // Layout mặc định

// 3. CẤU HÌNH TỆP TĨNH & MIDDLEWARES HỆ THỐNG
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(cors());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// 4. ĐỊNH TUYẾN (ROUTES)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", dashboardRouter); // Dashboard của bạn chạy ở đây

// 5. XỬ LÝ LỖI (Luôn đặt ở cuối cùng)
app.use(errorHandler);

module.exports = app;