const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/profile", userController.getProfile);

router.get("/:username", userController.getUser);

router.put("/profile/", userController.updateProfile);

router.get("/", userController.getAllUsers);

router.post("/follow/:id", userController.followUser);

router.delete("/follow/:id", userController.unfollowUser);

module.exports = router;
