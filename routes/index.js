const express = require("express");
const miscController = require("../controllers/miscController");

const router = express.Router();

router.post("/images", miscController.uploadImage);

router.delete("/images/", miscController.deleteImage);

module.exports = router;
