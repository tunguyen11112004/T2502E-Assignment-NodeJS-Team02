const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

const { errorHandler } = require("./middlewares/errorhandler");
const authMiddleware = require("./middlewares/auth-middleware");
const authRouter = require("./routes/auth-router");

const app = express();

// ==========================================
// CẤU HÌNH VIEW ENGINE & LAYOUT
// ==========================================
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/main");

// ==========================================
// MIDDLEWARES HỆ THỐNG
// ==========================================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(cookieParser());
app.use(authMiddleware.checkUser); // Middleware này sẽ chạy trước tất cả routes để kiểm tra user
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Cấu hình thư mục tĩnh: Nhảy ra ngoài src để vào public
app.use(express.static(path.join(__dirname, "../public")));

// ==========================================
// ĐỊNH NGHĨA ROUTES
// ==========================================
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.render("client/home", {
    user: req.user || null,
    title: "Trang chủ TaskFlow",
  });
});

// ==========================================
// XỬ LÝ LỖI
// ==========================================
app.use(errorHandler);

module.exports = app;
