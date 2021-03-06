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
  let search = {};
  if (req.query.title != null && req.query.title !== "") {
    search.title = new RegExp(req.query.title, "i");
  }

  Post.find(search, (err, posts) => {
    if (err) throw err;
    res.render("users/dashboard", {
      posts: posts,
      users: req.user,
      search: req.query,
    });
  });
});

// profile
router.get("/profile", authenticated, (req, res) => {
  res.render("users/profile", {
    user: req.user,
  });
});

// profile handler
router.post("/profile", (req, res) => {
  const { name, email } = req.body;
  let errors = [];

  User.findOne({ email: email }).then((user) => {
    if (user && user.email != req.user.email) {
      errors.push({ msg: "Email is already registered" });
      res.render("users/profile", {
        errors,
        name,
        email,
        user: req.user,
      });
    } else {
      var user = {};
      user.name = name;
      user.email = email;
      user.date = Date.now();

      User.updateOne({ _id: req.user._id }, user, (err) => {
        if (err) throw err;
        req.flash("success_msg", "Your profile has been updated");
        res.redirect("/");
      });
    }
  });
});

module.exports = router;
