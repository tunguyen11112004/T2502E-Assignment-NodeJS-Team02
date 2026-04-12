const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

router.patch("/:commentId", verifyToken, commentController.updateComment);
router.delete("/:commentId", verifyToken, commentController.deleteComment);

module.exports = router;
