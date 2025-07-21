const router = require("express").Router();
const MedicationCatalog = require("../models/MedicationCatalog");
const MedicationTransaction = require("../models/MedicationTransaction");
const HealthCenter = require("../models/HealthCenter");
router.get("medications/autocomplete",async(req,res)=>{
  const search = req.query.search || "";
  if (!search) return res.json([])
  const regex = new RegExp(search, "i");
  const meds = await MedicationCatalog.find({
    isActive: true,
    $or: [
      { itemName: { $regex: regex } },
      { codeNumber: { $regex: regex } }
    ]
  })
    .limit(10)
    .sort({ codeNumber: 1 });
  res.json(meds.map(m => ({
    _id: m._id,
    codeNumber: m.codeNumber,
    itemName: m.itemName
  })));
});
router.get("/medications", async (req, res) => {
  const search = req.query.search || "";
  const status = req.query.status || "all";

  const regex = new RegExp(search, "i");
  const baseFilter = {
    $or: [
      { itemName: { $regex: regex } },
      { codeNumber: { $regex: regex } }
    ]
  };

  if (req.session.user.position === "Head of Pharmacy") {
    if (status === "active") baseFilter.isActive = true;
    if (status === "inactive") baseFilter.isActive = false;
  } else {
    baseFilter.isActive = true;
  }

  const medications = await MedicationCatalog.find(baseFilter).sort({ codeNumber: 1 });
 
  const grouped = {};
  medications.forEach(item => {
    const groupKey = item.codeNumber.split('-').slice(0, 2).join('-');
    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(item);
  });
  res.render("medications/index.ejs", {
    medications: medications || [],
    grouped,
    groupKeys: Object.keys(grouped),
    search,
    status,
    user: req.session.user
  });
});

router.get("/medications/new", (req, res) => {
  res.render("medications/new.ejs", { user: req.session.user });
});

router.get("/medications/import", (req, res) => {
  if (req.session.user.position !== "Head of Pharmacy") {
    req.session.formError = "Access Denied: Head of Pharmacy Only.";
    return res.redirect("/medications");
  }
  res.render("medications/import.ejs", { user: req.session.user });
});

router.post("/medications", async (req, res) => {
  await MedicationCatalog.create({
    itemName: req.body.itemName,
    codeNumber: req.body.codeNumber,
    isActive: true
  });
  res.redirect("/medications");
});

router.get("/medications/:id/edit", async (req, res) => {
  const medication = await MedicationCatalog.findById(req.params.id);
  if (!medication) return res.redirect("/medications");
  res.render("medications/edit.ejs", { medication, user: req.session.user });
});

router.put("/medications/:id", async (req, res) => {
  await MedicationCatalog.findByIdAndUpdate(req.params.id, {
    itemName: req.body.itemName,
    codeNumber: req.body.codeNumber,
    isActive: req.body.isActive === "true"
  });
  res.redirect('/medications');
});

router.delete("/medications/:id", async (req, res) => {
  const medId = req.params.id;
  await MedicationTransaction.deleteMany({ codeNumber: medId });
  await MedicationCatalog.findByIdAndDelete(medId);
  res.redirect('/medications');
});

router.get("/medications/:id", async (req, res) => {
  const medication = await MedicationCatalog.findById(req.params.id);
  if (!medication) return res.redirect("/medications");

  let filter = { codeNumber: medication._id };
  let allHealthCenters = [];
  let selectedHealthCenter = null;

  if (req.session.user.position === "Head of Pharmacy") {
    allHealthCenters = await HealthCenter.find();
    if (req.query.healthCenter) {
      filter.healthCenter = req.query.healthCenter;
      selectedHealthCenter = await HealthCenter.findById(req.query.healthCenter);
    }
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHC = await HealthCenter.findById(req.session.user.healthCenter);
    allHealthCenters = await HealthCenter.find({ region: userHC.region });
    if (req.query.healthCenter) {
      filter.healthCenter = req.query.healthCenter;
      selectedHealthCenter = await HealthCenter.findById(req.query.healthCenter);
    } else {
      filter.healthCenter = req.session.user.healthCenter._id;
      selectedHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    }
  } else {
    filter.healthCenter = req.session.user.healthCenter._id;
  }

  const allMeds = await MedicationCatalog.find({ isActive: true }).sort({ codeNumber: 1 });
  const index = allMeds.findIndex(med => med._id.toString() === req.params.id);
  const previousMed = index > 0 ? allMeds[index - 1] : null;
  const nextMed = index < allMeds.length - 1 ? allMeds[index + 1] : null;

  const transactions = await MedicationTransaction.find(filter)
    .populate("healthCenter")
    .populate("enteredBy");

  res.render("medications/show.ejs", {
    medication,
    transactions,
    allHealthCenters,
    selectedHealthCenter,
    user: req.session.user,
    previousMed,
    nextMed
  });
});

// ✅ TOGGLE ACTIVE
router.post("/medications/:id/toggle", async (req, res) => {
  const medication = await MedicationCatalog.findById(req.params.id);
  if (medication) {
    medication.isActive = !medication.isActive;
    await medication.save();
  }
  res.redirect("/medications");
});

module.exports = router;