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

    req.project = project;
    req.task = task;
    return next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};