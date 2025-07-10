const router = require("express").Router();
const MedicationCatalog = require("../models/medicationCatalog");
const MedicationTransaction = require("../models/medicationTransaction");
const HealthCenter = require("../models/healthCenter");

router.get("/medications", async (req, res) => {
  const search = req.query.search || "";
  const regex = new RegExp(search, "i");
  const medications = await MedicationCatalog.find({
    $or:[
    { itemName: { $regex: regex }},
    { codeNumber:{$regex:regex}} 
  ]});
  res.render("medications/index.ejs", { medications, search });
});

router.get("/medications/new", (req, res) => {
  res.render("medications/new.ejs", { user: req.session.user });
});

router.get("/medications/import", (req, res) => {
  if (req.session.user.position !== "Head of Pharmacy") {
    req.session.formError = "Access Denied: Head of Pharmacy Only.";
    return res.redirect("/medications");
  }
  res.render("medications/import.ejs");
});

router.post("/medications", async (req, res) => {
  await MedicationCatalog.create({
    itemName: req.body.itemName,
    codeNumber: req.body.codeNumber
  });
  res.redirect("/medications");
});

router.get("/medications/:id/edit", async (req, res) => {
  const medication = await MedicationCatalog.findById(req.params.id);
  res.render("medications/edit.ejs", { medication });
});

router.put("/medications/:id", async (req, res) => {
  await MedicationCatalog.findByIdAndUpdate(req.params.id, {
    itemName: req.body.itemName,
    codeNumber: req.body.codeNumber
  });
  res.redirect('/medications');
});

router.delete("/medications/:id", async (req, res) => {
  await MedicationCatalog.findByIdAndDelete(req.params.id);
  res.redirect('/medications');
});

router.get("/medications/:id", async (req, res) => {
  let medication;
  try {
    medication = await MedicationCatalog.findById(req.params.id);
  } catch (err) {
    return res.redirect("/medications");
  }

  if (!medication) {
    return res.redirect("/medications");
  }

  let allHealthCenters = [];
  let filter = { codeNumber: medication._id };
  let selectedHealthCenter = null;

  if (req.session.user.position === "Head of Pharmacy") {
    allHealthCenters = await HealthCenter.find();
    if (req.query.healthCenter) {
      filter.healthCenter = req.query.healthCenter;
      selectedHealthCenter = await HealthCenter.findById(req.query.healthCenter);
    }
  } 
  else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });

    if (req.query.healthCenter) {
      filter.healthCenter = req.query.healthCenter;
      selectedHealthCenter = await HealthCenter.findById(req.query.healthCenter);
    } else {
      filter.healthCenter = req.session.user.healthCenter._id;
      selectedHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    }
  } 
  else {
    filter.healthCenter = req.session.user.healthCenter._id;
  }

  const transactions = await MedicationTransaction.find(filter)
    .populate("healthCenter")
    .populate("enteredBy");

  res.render("medications/show.ejs", {
    medication,
    transactions,
    allHealthCenters,
    selectedHealthCenter,
    user: req.session.user
  });
});

module.exports = router;