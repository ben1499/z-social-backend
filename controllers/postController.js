const asyncHandler = require("express-async-handler");
const { PrismaClient, Prisma } = require("@prisma/client");
const { body, query, validationResult } = require("express-validator");
const passport = require("passport");

const prisma = new PrismaClient();

function formatDate(date) {
  return `${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} ${date.toLocaleDateString("en-IN", { dateStyle: "medium" })}`;
}

exports.createPost = [
  passport.authenticate("jwt", { session: false }),
  body("content")
    .trim()
    .custom((value, { req }) => {
      if (!req.body.imgUrl && !value) {
        throw new Error("Content is required when imgUrl is not provided.");
      } else if (value && value.length > 400) {
        throw new Error("Content exceeds the maximum length");
      }
      return true;
    }),
  body("imgUrl")
    .trim()
    .custom((value, { req }) => {
      if (!req.body.content && !value) {
        throw new Error("imgUrl is required when content is not provided.");
      }
      return true;
    }),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      await prisma.post.create({
        data: {
          content: req.body.content,
          createdAt: new Date(),
          userId: req.user.user_id,
          parentPostId: req.body.parentPostId,
          imgUrl: req.body.imgUrl,
        },
      });
      res.json({ message: "Post created successfully" });
    } catch (err) {
      res.status(400).json({ message: "Something went wrong" });
    }
  }),
];

exports.deletePost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      await prisma.post.delete({
        where: {
          id: +req.params.id,
        },
      });
      res.json({ message: "Post deleted successfully " });
    } catch (err) {
      console.log(err);
      if (err.code === "P2025") {
        return res.status(500).json({ message: "Post does not exist" });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.likePost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      const post = await prisma.post.findUnique({
        where: {
          id: +req.params.id,
        },
        select: {
          userId: true,
        },
      });
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.user_id },
        select: { name: true },
      });
      await prisma.like.create({
        data: {
          postId: +req.params.id,
          userId: req.user.user_id,
        },
      });

      if (req.user.user_id !== post.userId) {
        await prisma.notification.create({
          data: {
            type: "LIKE",
            senderId: req.user.user_id,
            receiverId: post.userId,
            postId: +req.params.id,
            content: `${currentUser.name} liked your post`,
          },
        });
      }
      res.json({ message: "Post liked successfully" });
    } catch (err) {
      console.log(err);
      if (err.code === "P2002") {
        return res.status(500).json({ message: "Post is already liked" });
      } else if (err.code === "P2003") {
        return res.status(500).json({ message: "Post does not exist" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.unlikePost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId: +req.params.id,
            userId: req.user.user_id,
          },
        },
      });

      await prisma.notification.deleteMany({
        where: {
          postId: +req.params.id,
          senderId: req.user.user_id,
          type: "LIKE",
        },
      });
      res.json({ message: "Post like removed successfully" });
    } catch (err) {
      console.log(err);
      if (err.code === "P2025") {
        return res.status(500).json({ message: "Post does not exist" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.bookmarkPost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      await prisma.bookmark.create({
        data: {
          postId: +req.params.id,
          userId: req.user.user_id,
        },
      });
      res.json({ message: "Post bookmarked successfully" });
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(500).json({ message: "Post is already bookmarked" });
      } else if (err.code === "P2003") {
        return res.status(500).json({ message: "Post does not exist" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.removeBookmark = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      await prisma.bookmark.delete({
        where: {
          postId_userId: {
            postId: +req.params.id,
            userId: req.user.user_id,
          },
        },
      });
      res.json({ message: "Post bookmark removed successfully" });
    } catch (err) {
      if (err.code === "P2025") {
        return res.status(500).json({ message: "Post does not exist" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.getPosts = [
  passport.authenticate("jwt", { session: false }),
  query("user_id").optional().isNumeric().withMessage("User id is not valid"),
  query("limit")
    .optional()
    .isNumeric()
    .withMessage("Limit value must be a number"),
  query("is_explore").isBoolean().withMessage("is_explore must be a boolean"),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let followers = null;
      if (!req.query.user_id) {
        followers = await prisma.follow.findMany({
          where: {
            followedById: req.user.user_id,
          },
          select: {
            followingId: true,
          },
        });

        followers = followers.map((follower) => follower.followingId);
      }

      const is_explore = req.query.is_explore === "true" ? true : false;

      const posts = await prisma.post.findMany({
        take: req.query.limit ? +req.query.limit : undefined,
        where: {
          // userId: req.query.user_id ? +req.query.user_id : undefined,
          userId: is_explore
            ? { not: req.user.user_id } // for explore page
            : req.query.user_id
            ? +req.query.user_id // for user profile
            : { in: [...followers, req.user.user_id] }, // for feed
          // by default return only top level posts
          parentPostId: null,
          // parentPostId: req.query.parent_post_id ? +req.query.parent_post_id : null
          content: {
            contains: req.query.searchQuery,
            mode: "insensitive",
          },
        },
        orderBy: [
          {
            createdAt: "desc",
          },
        ],
        include: {
          reposts: {
            where: {
              userId: req.user.user_id,
            },
          },
          likes: {
            where: {
              userId: req.user.user_id,
            },
          },
          bookmarks: {
            where: {
              userId: req.user.user_id,
            },
          },
          user: {
            select: {
              name: true,
              profileImgUrl: true,
              // id: true,
              username: true,
            },
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
              replies: true,
              reposts: true,
            },
          },
        },
      });

      let reposts = [];

      if (!is_explore) {
        reposts = await prisma.repost.findMany({
          where: {
            userId: req.query.user_id
              ? +req.query.user_id
              : { in: [...followers, req.user.user_id] },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
            post: {
              include: {
                likes: {
                  where: {
                    userId: req.user.user_id,
                  },
                },
                bookmarks: {
                  where: {
                    userId: req.user.user_id,
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    profileImgUrl: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                    bookmarks: true,
                    replies: true,
                    reposts: true,
                  },
                },
              },
            },
          },
        });
      }

      let timeline = [...posts, ...reposts].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      timeline = timeline.map((item) => {
        // if it is a repost
        if (Object.hasOwn(item, "post")) {
          return {
            keyId: `repost-${item.postId}-${item.userId}`,
            id: item.postId,
            repostUser: item.user,
            // username: item.user.username,
            content: item.post.content,
            user: item.post.user,
            createdAt: item.post.createdAt,
            createdAtFormatted: formatDate(item.post.createdAt),
            imgUrl: item.post.imgUrl,
            userId: item.post.userId,
            parentPostId: item.post.parentPostId,
            likeCount: item.post._count.likes,
            bookmarkCount: item.post._count.bookmarks,
            replyCount: item.post._count.replies,
            repostCount: item.post._count.reposts,
            isLiked: item.post.likes.length > 0,
            isBookmarked: item.post.bookmarks.length > 0,
            isRepost: true,
            isRepostedByUser: item.userId === req.user.user_id ? true : false,
          };
        } else {
          const {
            id,
            content,
            createdAt,
            imgUrl,
            userId,
            parentPostId,
            _count,
            likes,
            bookmarks,
            reposts,
            user,
          } = item;
          return {
            keyId: `post-${item.id}`,
            id,
            content,
            imgUrl,
            userId,
            parentPostId,
            user,
            createdAt: createdAt,
            createdAtFormatted: formatDate(createdAt),
            likeCount: _count.likes,
            bookmarkCount: _count.bookmarks,
            replyCount: _count.replies,
            repostCount: _count.reposts,
            isRepostedByUser: reposts.length > 0,
            isLiked: likes.length > 0,
            isBookmarked: bookmarks.length > 0,
            isDeletable: userId === req.user.user_id ? true : false,
          };
        }
      });

      res.json({ data: timeline });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.getBookmarkedPosts = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    try {
      const bookmarks = await prisma.bookmark.findMany({
        where: {
          userId: req.user.user_id,
          post: {
            OR: [
              {
                content: {
                  contains: req.query.searchQuery,
                  mode: "insensitive",
                },
              },
              {
                user: {
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
              },
            ],
          },
        },
        include: {
          post: {
            include: {
              user: {
                omit: {
                  email: true,
                  password: true,
                  createdAt: true,
                  bio: true,
                  coverImgUrl: true,
                },
              },
              likes: {
                where: {
                  userId: req.user.user_id,
                },
                take: 1,
              },
              reposts: {
                where: {
                  userId: req.user.user_id,
                },
              },
              _count: {
                select: {
                  likes: true,
                  bookmarks: true,
                  reposts: true,
                  replies: true,
                },
              },
            },
          },
        },
      });

      const response = bookmarks.map((item) => {
        const post = {
          id: item.post.id,
          content: item.post.content,
          createdAt: item.post.createdAt,
          imgUrl: item.post.imgUrl,
          userId: item.post.userId,
          parentPostId: item.post.parentPostId,
          replyCount: item.post._count.replies,
          repostCount: item.post._count.reposts,
          likeCount: item.post._count.likes,
          bookmarkCount: item.post._count.bookmarks,
        };

        return {
          ...post,
          keyId: post.id,
          user: item.post.user,
          createdAtFormatted: formatDate(item.post.createdAt),
          isLiked: item.post.likes.length > 0,
          isRepostedByUser: item.post.reposts.length > 0,
          isBookmarked: true,
        };
      });

      res.json({ data: response });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.getLikedPosts = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: +req.params.userId,
        },
        include: {
          likes: {
            include: {
              post: {
                include: {
                  user: {
                    omit: {
                      email: true,
                      password: true,
                      createdAt: true,
                      bio: true,
                      coverImgUrl: true,
                    },
                  },
                  likes: {
                    where: {
                      userId: req.user.user_id,
                    },
                    take: 1,
                  },
                  reposts: {
                    where: {
                      userId: req.user.user_id,
                    },
                  },
                  _count: {
                    select: {
                      likes: true,
                      bookmarks: true,
                      reposts: true,
                      replies: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "User with provided user id not found" });
      }

      const posts = user.likes.map((like) => like.post);
      const response = posts.map((post) => {
        return {
          id: post.id,
          content: post.content,
          createdAt: post.createdAt,
          imgUrl: post.imgUrl,
          userId: post.userId,
          parentPostId: post.parentPostId,
          replyCount: post._count.replies,
          repostCount: post._count.reposts,
          likeCount: post._count.likes,
          bookmarkCount: post._count.bookmarks,
          keyId: post.id,
          user: post.user,
          createdAtFormatted: formatDate(post.createdAt),
          isLiked: post.likes.length > 0,
          isRepostedByUser: post.reposts.length > 0,
          isBookmarked: true,
        };
      });
      return res.json({ data: response });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.getPost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      const post = await prisma.post.findUnique({
        where: {
          id: +req.params.id,
        },
        include: {
          user: {
            select: {
              username: true,
              name: true,
              profileImgUrl: true,
              id: true,
            },
          },
          reposts: {
            where: {
              userId: req.user.user_id,
            },
          },
          likes: {
            where: {
              userId: req.user.user_id,
            },
          },
          bookmarks: {
            where: {
              userId: req.user.user_id,
            },
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
              replies: true,
              reposts: true,
            },
          },
          replies: {
            orderBy: [
              {
                createdAt: "desc",
              },
            ],
            include: {
              user: {
                select: {
                  username: true,
                  name: true,
                  profileImgUrl: true,
                  id: true,
                },
              },
              reposts: {
                where: {
                  userId: req.user.user_id,
                },
              },
              likes: {
                where: {
                  userId: req.user.user_id,
                },
              },
              bookmarks: {
                where: {
                  userId: req.user.user_id,
                },
              },
              _count: {
                select: {
                  likes: true,
                  bookmarks: true,
                  replies: true,
                  reposts: true,
                },
              },
            },
          },
        },
      });

      if (post) {
        const { _count, ...formattedPost } = post;

        formattedPost.createdAt = post.createdAt;
        formattedPost.createdAtFormatted = formatDate(post.createdAt);
        formattedPost.likeCount = _count.likes;
        formattedPost.bookmarkCount = _count.bookmarks;
        formattedPost.replyCount = _count.replies;
        formattedPost.repostCount = _count.reposts;
        formattedPost.isLiked = formattedPost.likes.length > 0;
        formattedPost.isBookmarked = formattedPost.bookmarks.length > 0;
        formattedPost.isRepostedByUser = formattedPost.reposts.length > 0;

        delete formattedPost.likes;
        delete formattedPost.bookmarks;

        formattedPost.replies = formattedPost.replies.map((reply) => {
          return {
            id: reply.id,
            content: reply.content,
            imgUrl: reply.imgUrl,
            user: reply.user,
            userId: reply.userId,
            parentPostId: reply.parentPostId,
            likeCount: reply._count.likes,
            bookmarkCount: reply._count.bookmarks,
            createdAt: reply.createdAt,
            createdAtFormatted: formatDate(reply.createdAt),
            replyCount: reply._count.replies,
            repostCount: reply._count.reposts,
            isLiked: reply.likes.length > 0,
            isBookmarked: reply.bookmarks.length > 0,
            isRepostedByUser: reply.reposts.length > 0,
          };
        });
        return res.json({ data: formattedPost });
      }
      return res.status(404).json({ message: "Post not found" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.getPostReplies = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    try {
      const replies = await prisma.post.findMany({
        where: {
          parentPostId: +req.params.id,
        },
        include: {
          likes: {
            where: {
              userId: req.user.user_id,
            },
          },
          bookmarks: {
            where: {
              userId: req.user.user_id,
            },
          },
          reposts: {
            where: {
              userId: req.user.user_id,
            },
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
              replies: true,
              reposts: true,
            },
          },
        },
      });

      const formattedReplies = replies.map(
        ({ createdAt, _count, likes, bookmarks, reposts, ...reply }) => {
          return {
            ...reply,
            createdAt: formatDate(createdAt),
            isLiked: likes.length > 0,
            isBookmarked: likes.length > 0,
            isRepostedByUser: likes.length > 0,
            likeCount: _count.likes,
            bookmarkCount: _count.bookmarks,
            replyCount: _count.replies,
            repostCount: _count.reposts,
            isDeletable: reply.userId === req.user.user_id,
          };
        }
      );

      res.json({ data: formattedReplies });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.repost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      const repost = await prisma.repost.create({
        data: {
          postId: +req.params.id,
          userId: req.user.user_id,
          createdAt: new Date(),
        },
      });

      if (repost) {
        const post = await prisma.post.findUnique({
          where: {
            id: +req.params.id,
          },
          select: {
            userId: true,
          },
        });
        const currentUser = await prisma.user.findUnique({
          where: { id: req.user.user_id },
          select: { name: true },
        });

        if (req.user.user_id !== post.userId) {
          await prisma.notification.create({
            data: {
              type: "REPOST",
              senderId: req.user.user_id,
              receiverId: post.userId,
              postId: +req.params.id,
              content: `${currentUser.name} reposted your post`,
            },
          });
        }
      }

      res.json({ message: "Post reposted successfully" });
    } catch (err) {
      console.log(err);
      if (err.code === "P2002") {
        return res.status(500).json({ message: "Post is already reposted" });
      } else if (err.code === "P2003") {
        return res.status(500).json({ message: "Post does not exist" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];

exports.removeRepost = [
  passport.authenticate("jwt", { session: false }),
  asyncHandler(async (req, res, next) => {
    if (!Number.isInteger(+req.params.id)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    try {
      await prisma.repost.delete({
        where: {
          postId_userId: {
            postId: +req.params.id,
            userId: req.user.user_id,
          },
        },
      });

      await prisma.notification.deleteMany({
        where: {
          postId: +req.params.id,
          senderId: req.user.user_id,
          type: "REPOST",
        },
      });
      res.json({ message: "Post repost removed successfully" });
    } catch (err) {
      console.log(err);
      if (err.code === "P2025") {
        return res.status(500).json({ message: "Repost does not exist" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  }),
];
