const express = require("express");
const postController = require("../controllers/postController");

const router = express.Router();

router.post("/", postController.createPost);

router.delete("/:id", postController.deletePost);

router.post("/:id/like", postController.likePost);

router.delete("/:id/like", postController.unlikePost);

router.post("/:id/bookmark", postController.bookmarkPost);

router.delete("/:id/bookmark", postController.removeBookmark);

router.post("/:id/repost", postController.repost);

router.delete("/:id/repost", postController.removeRepost);

router.get("/", postController.getPosts);

router.get("/:id", postController.getPost);

router.get("/:id/replies", postController.getPostReplies);

router.get("/liked-by/:userId", postController.getLikedPosts);

module.exports = router;
