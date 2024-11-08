const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signup);

router.post("/login", authController.login);

router.get("/twitter", authController.twitterAuth);

router.get("/twitter/callback", authController.twitterAuthCallback);

// router.get("/twitter/logout", (req, res, next) => {
//     req.logout(() => {
//         res.sendStatus(200);
//     });
// });


module.exports = router;
