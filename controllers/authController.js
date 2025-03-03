const asyncHandler = require("express-async-handler");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

exports.signup = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 4 })
    .withMessage("Username should be at least 4 characters long")
    .isAlphanumeric()
    .withMessage("Username must not contain special characters"),
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
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 5, max: 15 })
    .withMessage("Password length should be between 5 and 15 characters"),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      try {
        await prisma.user.create({
          data: {
            username: req.body.username,
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            createdAt: new Date(),
          },
        });
        res.json({ msg: "User created successfully" });
      } catch (err) {
        if (err.code === "P2002") {
          return res.status(400).json({
            errors: [
              {
                msg: `${err.meta.target[0]} already exists`,
                path: err.meta.target[0],
              },
            ],
          });
        }
        res.status(500).json({ msg: "Something went wrong" });
      }
    });
  }),
];

exports.login = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email is not valid"),
  body("password").notEmpty().withMessage("Password is required"),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      res.status(400).json({ errors: [{ msg: "Invalid email or password" }] });
    } else {
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid email or password" }] });
      }

      jwt.sign(
        { user_id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
        (err, token) => {
          res.status(200).json({ token: `Bearer ${token}`, user_id: user.id });
        }
      );
    }
  }),
];

exports.twitterAuth = [passport.authenticate("twitter")];

exports.twitterAuthCallback = [
  passport.authenticate("twitter"),
  (req, res, next) => {
    jwt.sign(
      { user_id: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        res.redirect(`${process.env.FRONTEND_URL}/auth-success#token=Bearer ${token}&user_id=${req.user.id}`);
      }
    );
  },
];
