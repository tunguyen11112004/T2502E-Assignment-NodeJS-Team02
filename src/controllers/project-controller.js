const Project = require("../models/Project");
const Task = require("../models/Task");
const TaskList = require("../models/TaskList");
const User = require("../models/User");


// Render Home Page
exports.renderHome = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/auth/login");
    }

    const currentUserId = req.user.id || req.user._id;

    const projects = await Project.find({
      isDeleted: false,
      $or: [{ owner: currentUserId }, { members: currentUserId }],
    })
      .populate("owner", "fullname email avatar")
      .populate("members", "fullname email avatar")
      .sort({ createdAt: -1 });

    return res.render("client/home", {
      title: "Trang chủ TaskFlow",
      user: req.user || null,
      projects,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    return res.status(500).send("Lỗi máy chủ");
  }
};

// CREATE PROJECT
// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect(
          "/?error=" + encodeURIComponent("Tiêu đề dự án là bắt buộc"),
        );
      }

      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    await Project.create({
      title: title.trim(),
      description: description?.trim() || "",
      owner: currentUserId,
      members: [currentUserId],
    });

    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(
        "/?success=" + encodeURIComponent("Tạo project thành công"),
      );
    }

    return res.status(201).json({
      success: true,
      message: "Create project successfully",
    });
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect("/?error=" + encodeURIComponent(error.message));
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET PROJECT LIST
// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;

    const projects = await Project.find({
      isDeleted: false,
      $or: [{ owner: currentUserId }, { members: currentUserId }],
    })
      .populate("owner", "fullname email avatar")
      .populate("members", "fullname email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Get project list successfully",
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE PROJECT
// PATCH/PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { id } = req.params;
const { title, description } = req.body;

    const project = await Project.findById(id);

    if (!project || project.isDeleted) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect("/?error=" + encodeURIComponent("Project không tồn tại"));
      }

      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== currentUserId.toString()) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect(
          "/?error=" + encodeURIComponent("Chỉ owner mới được sửa project"),
        );
      }

      return res.status(403).json({
        success: false,
        message: "Only owner can update this project",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        if (req.headers.accept && req.headers.accept.includes("text/html")) {
          return res.redirect(
            "/?error=" + encodeURIComponent("Tiêu đề không được để trống"),
          );
        }

        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      project.title = title.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    await project.save();

    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(
        "/?success=" + encodeURIComponent("Cập nhật project thành công"),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect("/?error=" + encodeURIComponent(error.message));
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SOFT DELETE PROJECT
// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project || project.isDeleted) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect("/?error=" + encodeURIComponent("Project không tồn tại"));
      }

      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== currentUserId.toString()) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect(
          "/?error=" + encodeURIComponent("Chỉ owner mới được xóa project"),
        );
      }

      return res.status(403).json({
        success: false,
        message: "Only owner can delete this project",
      });
    }
project.isDeleted = true;
    await project.save();

    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(
        "/?success=" + encodeURIComponent("Xóa project thành công"),
      );
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect("/?error=" + encodeURIComponent(error.message));
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.createTask = async (req, res) => {
    try {
        const currentUserId = req.user.id || req.user._id;
        const { title, description, projectId, deadline, priority } = req.body;
        // 1. Kiểm tra dự án có tồn tại không
        const project = await Project.findById(projectId);
        if (!project || project.isDeleted) {
            return res.status(404).json({ success: false, message: "Dự án không tồn tại" });
        }
        // 2. Logic kiểm tra 2.3: Deadline không được là quá khứ
        const today = new Date().setHours(0, 0, 0, 0);
        const selectedDate = new Date(deadline).setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            if (req.headers.accept && req.headers.accept.includes("text/html")) {
                return res.redirect("back"); // Hoặc redirect kèm lỗi
            }
            return res.status(400).json({ success: false, message: "Deadline không được là ngày quá khứ" });
        }
        // 3. Tạo task mới
        const newTask = new Task({
            title,
            description,
            projectId,
            deadline,
            priority: priority || 'Medium',
            status: 'To Do'
        });
        await newTask.save();
        if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return res.redirect(`/api/projects/${projectId}/board?success=Tạo task thành công`);
        }
        res.status(201).json({ success: true, data: newTask });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE TASK STATUS (Phục vụ kéo thả hoặc đổi cột)
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
        res.json({ success: true, data: task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// SHOW PROJECT BOARD
exports.getProjectBoard = async (req, res) => {
    try {
        const projectId = req.params.id;
        // 1. Lấy thông tin dự án
        const project = await Project.findById(projectId).populate('members', 'fullname avatar');
        
        if (!project || project.isDeleted) {
            return res.redirect("/api/projects?error=Dự án không tồn tại");
        }

        // 2. Lấy danh sách TaskList của dự án này
        const taskLists = await TaskList.find({ projectId: projectId });

        // 3. Lấy danh sách task của các list này
        const listIds = taskLists.map(tl => tl._id);
        const tasks = await Task.find({ listId: { $in: listIds } }).populate("listId", "title").populate("assignee", "fullname");

        // 4. Render giao diện board
        res.render('client/project-board', { 
            project, 
            taskLists,
            tasks, // Gửi nguyên mảng tasks
            user: req.user,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error(error);
        res.redirect("/api/projects?error=" + encodeURIComponent(error.message));
    }
};
//nhánh main (duy)
// INVITE MEMBER
// POST /api/projects/:id/invite
exports.inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const currentUserId = req.user.id || req.user._id;

    const project = await Project.findById(id);

    if (!project || project.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // chỉ owner được mời
    if (project.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only owner can invite",
      });
    }

    // tìm user theo email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // tránh add trùng
    const alreadyMember = project.members.some(
      (m) => m.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User already in project",
      });
    }

    project.members.push(user._id);
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Invite successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

