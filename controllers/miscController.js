const passport = require("passport");
const multer = require("multer");

const { storage, removeFromCloudinary } = require("../config/cloudinary");

const upload = multer({ storage: storage });

exports.uploadImage = [
  passport.authenticate("jwt", { session: false }),
  upload.single("image"),
  (req, res, next) => {
    res.json({ url: req.file.path });
  },
];

exports.deleteImage = [
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (!req.query.image_id) {
      return res
        .status(400)
        .json({
          errors: [{ msg: "image_id is required", path: "image_id" }],
        });
    }
    removeFromCloudinary(req.query.image_id)
      .then(() => {
        res.json({ message: "Image deleted successfully" });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ message: "Something went wrong" });
      });
  },
];
