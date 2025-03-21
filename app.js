const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { PrismaClient } = require("@prisma/client");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const indexRouter = require("./routes/index");
const postRouter = require("./routes/post");
const notificationRouter = require("./routes/notification");
const postController = require("./controllers/postController");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");

require("./config/passport")(passport);

const app = express();

app.use(cors());

// Set up rate limiter: maximum of 30 requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
});
// Apply rate limiter to all requests
app.use(limiter);

// Compress all routes
app.use(compression());

// Add helmet to the middleware chain.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'"],
      "img-src": ["'self'", "res.cloudinary.com"],
    },
  })
);

app.use(express.json());

app.set('trust proxy', 1);

// express session setup for use in twitter oauth2.0 auth
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
      secure: process.env.NODE_ENV === "production",
      // sameSite: "none",
    },
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/notifications", notificationRouter);

app.get("/bookmarks", postController.getBookmarkedPosts);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // show error message
  res
    .status(err.status || 500)
    .json({ message: err.message || "Something went wrong" });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
