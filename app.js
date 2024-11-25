const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { PrismaClient } = require("@prisma/client");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const indexRouter = require("./routes/index");

require("./config/passport")(passport);

const app = express();

// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// express session setup for use in twitter oauth2.0 auth
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
      secure: false,
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
