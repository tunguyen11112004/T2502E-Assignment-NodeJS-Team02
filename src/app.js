const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");

const projectRouter = require("./routes/project-router");
const authRouter = require("./routes/auth-router");
const projectController = require("./controllers/project-controller");
const taskRouter = require("./routes/task-router");
const taskListRouter = require("./routes/tasklist-router");

const { errorHandler } = require("./middlewares/errorHandler");
const authMiddleware = require("./middlewares/auth-middleware");

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

// middleware đọc user từ cookie
app.use(authMiddleware.checkUser);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// static files
app.use(express.static(path.join(__dirname, "../public")));

// ==========================================
// ROUTES
// ==========================================
app.use("/auth", authRouter);

// CRUD Project API
app.use("/api/projects", projectRouter);
// CRUD Task API
app.use("/api/tasks", taskRouter);
// CRUD TaskList API
app.use("/api/tasklists", taskListRouter);

// Home có render list project
app.get("/", authMiddleware.verifyToken, projectController.renderHome);

// ==========================================
// ERROR HANDLER
// ==========================================
app.use(errorHandler);

module.exports = app;