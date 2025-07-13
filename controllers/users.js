const router = require("express").Router();
const User = require("../models/User");
const HealthCenter = require("../models/HealthCenter");
const bcrypt = require("bcrypt");


const isHead = (req, res, next) => {
  if (req.session.user?.position === "Head of Pharmacy") return next();
  res.status(403).send("Access Denied: Head of Pharmacy Only");
};


router.get("/", isHead, async (req, res) => {
  const search = req.query.search || "";
  const role = req.query.role || "";

  let query = {};

  if (search) {
    query.username = { $regex: search, $options: "i" };
  }

  if (role) {
    query.position = role;
  }

  let users = await User.find(query).populate("healthCenter");


  const roleOrder = [
    "Head of Pharmacy",
    "Senior Pharmacy",
    "Pharmacist Incharge",
    "Senior Pharmacy Technician",
    "Pharmacist",
    "Pharmacy Technician"
  ];

  users.sort((a, b) => {
    return roleOrder.indexOf(a.position) - roleOrder.indexOf(b.position);
  });

  res.render("users/index.ejs", { users, search, role });
});

router.get("/new", isHead, async (req, res) => {
  const healthCenters = await HealthCenter.find();
  res.render("users/new.ejs", { healthCenters });
});


router.post("/", isHead, async (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  req.body.password = hashedPassword;

  await User.create(req.body);
  res.redirect("/users");
});

router.put("/:id/toggle", isHead, async (req, res) => {
  const user = await User.findById(req.params.id);
  user.active = !user.active;
  await user.save();
  res.redirect("/users");
});

router.get("/:id/edit", isHead, async (req, res) => {
  const user = await User.findById(req.params.id);
  const healthCenters = await HealthCenter.find();
  res.render("users/edit.ejs", { user, healthCenters });
});


router.put("/:id", isHead, async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);
  } else {
    delete req.body.password;
  }

  await User.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/users");
});


router.delete("/:id", isHead, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/users");
});

module.exports = router;