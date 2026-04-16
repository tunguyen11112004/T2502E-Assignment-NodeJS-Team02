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
      "members.user": currentUserId,
    })
      .populate("owner", "fullname email avatar")
      .populate("members.user", "fullname email avatar")
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
exports.createProject = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        return res.redirect(
          "/?error=" + encodeURIComponent("Tiêu đề dự án là bắt buộc")
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
      members: [{ user: currentUserId, role: "owner" }],
    });

    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(
        "/?success=" + encodeURIComponent("Tạo project thành công")
      );
    }

    return res.status(201).json({
      success: true,
      message: "Create project successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET PROJECT LIST
exports.getProjects = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;

    const projects = await Project.find({
      isDeleted: false,
      "members.user": currentUserId,
    })
      .populate("owner", "fullname email avatar")
      .populate("members.user", "fullname email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
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
exports.updateProject = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { id } = req.params;
    const { title, description } = req.body;

    const project = await Project.findById(id);

    if (!project || project.isDeleted) {
      // Nếu không tìm thấy, quay về dashboard báo lỗi
      return res.redirect("/?message=Dự án không tồn tại");
    }

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    if (!isOwner) {
      return res.redirect(`/?message=Chỉ chủ sở hữu mới có quyền sửa dự án`);
    }

    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();

    await project.save();

    // Chuyển hướng về lại trang chi tiết dự án sau khi sửa xong
    // Bạn có thể truyền thêm query parameter để hiển thị thông báo "Sửa thành công"
    return res.redirect(`/api/projects/${id}/board?status=success&message=Cập nhật dự án thành công`);
    
  } catch (error) {
    return res.redirect(`/?message=Lỗi: ${error.message}`);
  }
};


// DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) return res.redirect("/?message=Dự án không tồn tại");

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    if (!isOwner) {
      return res.redirect("/?message=Chỉ chủ sở hữu mới có quyền xóa dự án");
    }

    // Soft delete
    project.isDeleted = true;
    await project.save();

    // Xóa xong thì về trang chủ (nơi liệt kê các dự án)
    return res.redirect("/?status=success&message=Xóa dự án thành công");
    
  } catch (error) {
    return res.redirect(`/?message=Lỗi xóa dự án: ${error.message}`);
  }
};


// SHOW PROJECT BOARD
exports.getProjectBoard = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId)
      .populate("owner", "fullname email avatar")
      .populate("members.user", "fullname email avatar");

    if (!project || project.isDeleted) {
      return res.redirect("/?error=Dự án không tồn tại");
    }

    const taskLists = await TaskList.find({
      projectId: projectId,
      isDeleted: false,
    });

    const listIds = taskLists.map((tl) => tl._id);

    const tasks = await Task.find({
      listId: { $in: listIds },
      isDeleted: { $ne: true },
    });

    const currentUserId = req.user.id || req.user._id;

    const isOwner = project.members.some(
      (m) =>
        m.user._id.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    res.render("client/project-board", {
      project,
      taskLists,
      tasks,
      user: req.user,
      isOwner,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    return res.redirect("/?error=" + encodeURIComponent(error.message));
  }
};


// INVITE MEMBER
exports.inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const currentUserId = req.user.id || req.user._id;

    const project = await Project.findById(id);

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only owner can invite",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User already in project",
      });
    }

    project.members.push({
      user: user._id,
      role: "member",
    });

    await project.save();

    return res.json({
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


// UPDATE MEMBER ROLE (MULTI OWNER)
exports.updateMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id || req.user._id;

    const project = await Project.findById(id);

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only owner can manage members",
      });
    }

    const targetMember = project.members.find(
      (m) => m.user.toString() === memberId.toString()
    );

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (role === "delete") {

      if (targetMember.role === "owner") {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa owner",
        });
      }

      project.members = project.members.filter(
        (m) => m.user.toString() !== memberId.toString()
      );

    } else if (role === "owner") {

      targetMember.role = "owner";

    } else if (role === "member") {

      targetMember.role = "member";

    }

    await project.save();

    return res.json({
      success: true,
      message: "Cập nhật quyền thành công",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET MEMBERS
exports.getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate("members.user", "fullname email avatar");

    return res.json({
      success: true,
      data: project.members,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};