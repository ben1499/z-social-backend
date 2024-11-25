const express = require("express");
const miscController = require("../controllers/miscController");

const router = express.Router();

router.post("/images", miscController.uploadImage);

module.exports = router;
