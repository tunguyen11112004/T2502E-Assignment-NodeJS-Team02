const express = require("express");
const router = express.Router();

const projectController = require("../controllers/project-controller");
const { verifyToken } = require("../middlewares/auth-middleware");
const { isOwner } = require("../middlewares/auth");


// Render form create project
router.get("/new", verifyToken, (req, res) => {
  res.render("client/create-project", {
    title: "Tạo dự án mới",
    user: req.user || null,
  });
});

// CREATE
router.post("/", verifyToken, projectController.createProject);

// GET LIST
router.get("/", verifyToken, projectController.getProjects);

// UPDATE - only owner
router.patch("/:id", verifyToken, isOwner, projectController.updateProject);
router.put("/:id", verifyToken, isOwner, projectController.updateProject);

// SOFT DELETE - only owner
router.delete("/:id", verifyToken, isOwner, projectController.deleteProject);

router.post("/:id/invite", verifyToken, isOwner, projectController.inviteMember);

module.exports = router;