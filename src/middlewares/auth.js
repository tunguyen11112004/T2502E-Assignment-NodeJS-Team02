const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");


// Check member
exports.isMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project id",
      });
    }

    const project = await Project.findById(id);

    if (!project || project.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    req.project = project;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Check owner (MULTI OWNER)
exports.isOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project id",
      });
    }

    const project = await Project.findById(id);

    if (!project || project.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only owner allowed",
      });
    }

    req.project = project;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Check project permission for creating tasks
exports.checkProjectPermission = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const currentUserId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project id",
      });
    }

    const project = await Project.findById(projectId);

    if (!project || project.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    const isMember = project.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    req.project = project;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Check task permission
exports.checkTaskPermission = async (req, res, next) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    const currentUserId = req.user.id || req.user._id;

    const task = await Task.findById(taskId).populate("listId");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const projectId = task.listId.projectId;
    const project = await Project.findById(projectId);

    if (!project || project.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isOwner = project.members.some(
      (m) =>
        m.user.toString() === currentUserId.toString() &&
        m.role === "owner"
    );

    const isMember = project.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this project",
      });
    }

    const memberAllowedActions = [
      "getTaskDetail",
      "updateTaskContent",
      "updateTaskDescription",
      "createComment",
      "updateComment",
      "deleteComment",
      "getComments",
    ];

    const path = req.route.path;
    const method = req.method;
    let action = "";

    if (path === "/:id" && method === "GET") action = "getTaskDetail";
    else if (path === "/:id/content" && method === "PUT") action = "updateTaskContent";
    else if (path === "/:id/description" && method === "PUT") action = "updateTaskDescription";
    else if (path === "/:taskId/comments" && method === "POST") action = "createComment";
    else if (path === "/:taskId/comments/:commentId" && method === "PUT") action = "updateComment";
    else if (path === "/:taskId/comments/:commentId" && method === "DELETE") action = "deleteComment";
    else if (path === "/:taskId/comments" && method === "GET") action = "getComments";
    else if (path === "/:id" && method === "DELETE") action = "deleteTask";
    else if (path === "/:id/deadline" && method === "PUT") action = "updateDeadline";
    else if (path === "/:id/restore" && method === "PATCH") action = "restoreTask";
    else if (path === "/:id/permanent" && method === "DELETE") action = "permanentDeleteTask";
    else if (path === "/:taskId/assignees" && method === "POST") action = "addAssignee";

    if (isOwner) {
      req.project = project;
      req.task = task;
      return next();
    }

    if (isMember && memberAllowedActions.includes(action)) {
      req.project = project;
      req.task = task;
      return next();
    }

    // req.project = project;
    // req.task = task;
    // return next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};