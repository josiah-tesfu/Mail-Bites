import express from "express";
import passport from "passport";

const router = express.Router();

// Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Redirect back to app
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/loggedin");
  }
);

// Login failure redirect
router.get("/login", (req, res, next) => {
  res.render("login");
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

export default router;
