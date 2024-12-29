const passport = require("passport");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.getNotifications = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          receiverId: req.user.user_id
        }
      });
  
      // Mark notifications as read after listing them
      await prisma.notification.updateMany({
        where: {
          receiverId: req.user.user_id,
          isRead: false
        },
        data: {
          isRead: true
        }
      })
  
      res.json({ data: notifications })
    } catch (err) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.getUnreadNotificationsCount = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    try {
      const count = await prisma.notification.count({
        where: {
          receiverId: req.user.user_id,
          isRead: false
        }
      })
      res.json({ data: { unreadCount: count }});
    } catch (err) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
]
