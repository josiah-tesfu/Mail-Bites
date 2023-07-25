import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectSQLite3 from "connect-sqlite3";
import dotenv from "dotenv";

dotenv.config();

export function setupPassport(passport) {
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
      (accessToken, refreshToken, profile, cb) => {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
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

export function setupSession() {
  const SQLiteStore = connectSQLite3(session);
  return session({
    store: new SQLiteStore(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set this to true in production, when using https
  });
}
