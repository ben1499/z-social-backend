const passport = require("passport");
// const { body, validationResult } = require("express-validator");
const multer = require("multer");

const { storage } = require("../config/cloudinary");

const upload = multer({ storage: storage });

exports.uploadImage = [
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  (req, res, next) => {
    res.json({ url: req.file.path });
  },
];
