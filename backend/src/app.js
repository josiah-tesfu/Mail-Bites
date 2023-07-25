import express from "express";
import passport from "passport";
import authRoutes from "./routes/auth.routes.js"
import { setupPassport, setupSession } from "./services/auth.services.js"

import dotenv from "dotenv";
dotenv.config();


import setupPassport from "./services/auth.services.js"
const app = express();
const port = process.env.PORT;

setupPassport(passport)

// Session setup
app.use(setupSession());

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