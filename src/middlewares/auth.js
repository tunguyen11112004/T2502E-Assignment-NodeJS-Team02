const mongoose = require("mongoose");
const Project = require("../models/Project");

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

    const isMember =
      project.owner.toString() === currentUserId.toString() ||
      project.members.some((m) => m.toString() === currentUserId.toString());

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

// Check owner
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

    if (project.owner.toString() !== currentUserId.toString()) {
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