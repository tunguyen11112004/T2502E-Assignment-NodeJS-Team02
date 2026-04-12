const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

router.patch("/:commentId", verifyToken, commentController.update);
router.delete("/:commentId", verifyToken, commentController.remove);

module.exports = router;
