const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const TwitterStrategy = require("passport-twitter");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

const strategyJwt = new JwtStrategy(options, (payload, done) => {
  return done(null, payload);
});

const strategyTwitter = new TwitterStrategy(
  {
    consumerKey: process.env.X_API_KEY,
    consumerSecret: process.env.X_SECRET_KEY,
    callbackURL: "http://127.0.0.1:3000/auth/twitter/callback",
  },
  async function (token, tokenSecret, profile, cb) {
    // console.log("token", token);
    // console.log("secret", tokenSecret);
    console.log(profile);
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: profile.username,
        },
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            username: profile.username,
            name: profile.displayName,
            bio: profile._json.description,
            profileImgUrl: profile.photos.length
              ? profile.photos[0].value
              : null,
            coverImgUrl:
              profile.photos.length === 2 ? profile.photos[1].value : null,
            createdAt: new Date(),
          },
        });
        return cb(null, newUser);
      } else {
        return cb(null, existingUser);
      }
    } catch (err) {
      return cb(err);
    }
  }
);

module.exports = (passport) => {
  passport.use(strategyJwt);
  passport.use(strategyTwitter);
  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });
};
