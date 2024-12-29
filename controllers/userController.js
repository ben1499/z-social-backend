const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const prisma = new PrismaClient();

exports.getUser = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: {
        username: req.params.username,
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });
    // Check if user is followed by logged in user
    const follow = await prisma.follow.findUnique({
      where: {
        followedById_followingId: {
          followedById: req.user.user_id,
          followingId: user.id,
        },
      },
    });
    if (user) {
      const { password, _count, ...formattedUser } = user;
      formattedUser.createdAt = `${user.createdAt.toLocaleString("en-US", {
        month: "long",
      })} ${user.createdAt.getFullYear()}`;
      formattedUser.isCurrentUser = req.user.user_id === user.id ? true : false;
      formattedUser.followingCount = _count.following;
      formattedUser.followerCount = _count.followers;
      formattedUser.isFollowing = formattedUser.isCurrentUser
        ? null
        : follow
        ? true
        : false;
      return res.json({ data: formattedUser });
    }
    return res.status(404).json({ message: "User not found" });
  }),
];

exports.updateProfile = [
  passport.authenticate("jwt", { session: false }),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 25 })
    .withMessage("Name exceeds the maximum length")
    .custom((value) => {
      const regex = /^[a-zA-Z\s]+$/;
      return regex.test(value);
    })
    .withMessage("Name must be contain only letters"),
  body("bio").trim(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      try {
        await prisma.user.update({
          where: {
            id: req.user.user_id,
          },
          data: {
            name: req.body.name,
            bio: req.body.bio,
            profileImgUrl: req.body.profileImgUrl,
            coverImgUrl: req.body.coverImgUrl,
          },
        });
        res.json({ message: "Profile updated successfully" });
      } catch (err) {
        res.status(400).json({ message: "Something went wrong" });
      }
    }
  }),
];

exports.getAllUsers = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: req.user.user_id,
        },
        OR: [
          {
            username: {
              contains: req.query.searchQuery,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: req.query.searchQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        followers: {
          where: {
            followedById: req.user.user_id,
          },
        },
      },
      take: req.query.limit ? +req.query.limit : undefined,
    });

    formattedUsers = users.map((user) => {
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profileImgUrl: user.profileImgUrl,
        isFollowing: user.followers.length > 0,
      };
    });

    return res.json({ data: formattedUsers });
  }),
];

exports.followUser = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      res.status(400).json({ message: "Invalid user id" });
    } else {
      if (req.user.user_id === +req.params.id) {
        return res.status(400).json({ message: "Cannot follow self" });
      }
      try {
        await prisma.follow.create({
          data: {
            followedById: req.user.user_id,
            followingId: +req.params.id,
          },
        });

        const currentUser = await prisma.user.findUnique({
          where: { id: req.user.user_id },
          select: { name: true }
        });
        await prisma.notification.create({
          data: {
            type: "FOLLOW",
            senderId: req.user.user_id,
            receiverId: +req.params.id,
            content: `${currentUser.name} followed you`
          }
        });

        return res.json({ message: "Followed user successfully" });
      } catch (err) {
        if (err.code === "P2002") {
          return res.status(500).json({ message: "User is already followed" });
        } else if (err.code === "P2003") {
          return res.status(500).json({ message: "User does not exist" });
        }
        return res.status(500).json({ message: "Something went wrong" });
      }
    }
  }),
];

exports.unfollowUser = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      res.status(400).json({ message: "Invalid user id" });
    } else {
      try {
        await prisma.follow.delete({
          where: {
            followedById_followingId: {
              followedById: req.user.user_id,
              followingId: +req.params.id,
            },
          },
        });

        await prisma.notification.deleteMany({
          where: {
            senderId: req.user.user_id,
            receiverId: +req.params.id,
            type: "FOLLOW"
          }
        })
        return res.json({ message: "Unfollowed user successfully" });
      } catch (err) {
        if (err.code === "P2025") {
          return res.status(500).json({ message: "Follow does not exist" });
        }
        return res.status(500).json({ message: "Something went wrong" });
      }
    }
  }),
];
