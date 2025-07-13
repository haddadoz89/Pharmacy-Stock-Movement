const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const MedicationCatalog = require("../models/MedicationCatalog");
const HealthCenter = require("../models/HealthCenter");

router.get("/", async (req, res) => {
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } 
  else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
  } 
  else {
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  res.render("reports/vaccineForm.ejs", {
    user: req.session.user,
    allowedHealthCenters,
    selectedHealthCenter: "",
    month: "",
    year: "",
    reportData: []  // Always pass an array, even empty
  });
});

router.post("/", async (req, res) => {
  const { month, year, healthCenter } = req.body;

  let selectedMonth = parseInt(month);
  let selectedYear = parseInt(year);

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  let healthCenterFilter = [];
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
    if (healthCenter) healthCenterFilter = [healthCenter];
  } 
  else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = allowedHealthCenters.map(center => center._id);

    if (healthCenter) healthCenterFilter = [healthCenter];
  } 
  else {
    healthCenterFilter = [req.session.user.healthCenter];
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  const vaccineItems = await MedicationCatalog.find({
    codeNumber: { $regex: /^22C20-43-/i },
    isActive: true
  });

  let reportData = [];

  for (const vaccine of vaccineItems) {
    let query = {
      codeNumber: vaccine._id,
      date: { $gte: monthStart, $lte: monthEnd }
    };

    if (healthCenterFilter.length) {
      query.healthCenter = { $in: healthCenterFilter };
    }

    const transactions = await MedicationTransaction.find(query);

    let totalQtyIn = 0;
    let totalQtyOut = 0;
    let lastStoreBalance = 0;

    transactions.forEach(tx => {
      totalQtyIn += tx.qtyIn;
      totalQtyOut += tx.qtyOut;
      lastStoreBalance = tx.storeBalance;
    });

    reportData.push({
      codeNumber: vaccine.codeNumber,
      itemName: vaccine.itemName,
      qtyIn: totalQtyIn,
      qtyOut: totalQtyOut,
      storeBalance: lastStoreBalance
    });
  }

  res.render("reports/vaccineForm.ejs", {
    user: req.session.user,
    allowedHealthCenters,
    selectedHealthCenter: healthCenter,
    month,
    year,
    reportData
  });
});

module.exports = router;