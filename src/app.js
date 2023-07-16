import express from "express";
import session from "express-session";
import connectSQLite3 from "connect-sqlite3";
import passport from "passport";
import authRoutes from "./routes/auth.routes.js"
import "./services/auth.services.js"

import dotenv from "dotenv";
dotenv.config();


import setupPassport from "./services/auth.services.js"
const app = express();
const port = process.env.PORT;
const SQLiteStore = connectSQLite3(session);

setupPassport(passport)

// Session setup
app.use(
  session({
    store: new SQLiteStore(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // set this to true in production, when using https
  })
);

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.use("/auth", authRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

export default app;