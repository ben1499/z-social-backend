const express = require("express");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", notificationController.getNotifications);

router.get("/unread", notificationController.getUnreadNotificationsCount);

module.exports = router;
