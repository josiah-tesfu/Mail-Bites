import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

export default function setupPassport(passport) {
  const clientID = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

// Passport Google OAuth 2.0 setup
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: "http://localhost:3000/auth/google/callback",
      },
      function (accessToken, refreshToken, profile, cb) {
        cb(null, profile);
      }
    )
  );

// Passport user serialization setup
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
}
