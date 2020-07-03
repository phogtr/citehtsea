const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { authenticated } = require("../config/auth");

// User model
const User = require("../models/User.js");
const Post = require("../models/Post.js");

//login
router.get("/login", (req, res) => {
  res.render("users/login");
});

//register
router.get("/register", (req, res) => {
  res.render("users/register");
});

// register handler
router.post("/register", (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("users/register", {
      errors,
      name,
      email,
      password,
      password2,
      user: null,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email is already registered" });
        res.render("users/register", {
          errors,
          name,
          email,
          password,
          password2,
          user: null,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        // Hash pw
        bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(() => {
                req.flash("success_msg", "Successfully registered.");
                res.redirect("login");
              })
              .catch((err) => console.log(err));
          })
        );
      }
    });
  }
});

// login handler
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/user/login",
    failureFlash: true,
  })(req, res, next);
});

// logout handler
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "Logged out successfully");
  res.redirect("login");
});

// dashboard
router.get("/dashboard", authenticated, (req, res) => {
  Post.find({}, (err, posts) => {
    if (err) throw err;
    res.render("users/dashboard", {
      posts: posts,
      users: req.user,
    });
  });
});

// account
router.get("/account", authenticated, (req, res) => {
  res.render("users/account", {
    users: req.user,
  });
});

module.exports = router;
