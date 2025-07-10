const router = require("express").Router();
const User = require("../models/User");
const HealthCenter = require("../models/HealthCenter");
const bcrypt = require("bcrypt");

router.get("/sign-up", async (req, res) => {
  const healthCenters = await HealthCenter.find({});
  const error = req.session.formError;
  req.session.formError = null;
  res.render("auth/sign-up.ejs", { healthCenters, error });
});

router.post("/sign-up", async (req, res) => {
  const isUserInDatabase = await User.findOne({ username: req.body.username });
  if (isUserInDatabase) {
    req.session.formError = "Username is already taken.";
    return res.redirect("/auth/sign-up");
  }

  if (req.body.password !== req.body.confirmPassword) {
    req.session.formError = "Passwords must match.";
    return res.redirect("/auth/sign-up");
  }

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  req.body.password = hashedPassword;

  const user = await User.create(req.body);

  req.session.user = {
    _id: user._id,
    username: user.username,
    position: user.position,
    healthCenter: user.healthCenter
  };

  res.redirect("/");
});

router.get("/sign-in", (req, res) => {
  const error = req.session.formError;
  req.session.formError = null;
  res.render("auth/sign-in.ejs", { error });
});

router.post("/sign-in", async (req, res) => {
  const user = await User.findOne({ username: req.body.username }).populate("healthCenter");

  if (!user) {
    req.session.formError = "Invalid username or password.";
    return res.redirect("/auth/sign-in");
  }

  const validPassword = bcrypt.compareSync(req.body.password, user.password);
  if (!validPassword) {
    req.session.formError = "Invalid username or password.";
    return res.redirect("/auth/sign-in");
  }

  req.session.user = {
    _id: user._id,
    username: user.username,
    position: user.position,
    healthCenter: user.healthCenter
  };

  res.redirect("/");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;