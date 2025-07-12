const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const HealthCenter = require("../models/HealthCenter");
const XLSX = require("xlsx");

router.get("/", async (req, res) => {
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
  } else {
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  res.render("reports/form.ejs", {
  allowedHealthCenters,
  user: req.session.user,
  results: null,
  startDate: "",
  endDate: "",
  selectedHealthCenter: ""
});
});

router.post("/", async (req, res) => {
  const { startDate, endDate, healthCenter } = req.body;

  let healthCenterFilter = [];
  if (req.session.user.position === "Head of Pharmacy") {
    if (healthCenter) {
      healthCenterFilter = [healthCenter];
    }
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    const regionCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = regionCenters.map(center => center._id);

    if (healthCenter) {
      healthCenterFilter = [healthCenter];
    }
  } else {
    healthCenterFilter = [req.session.user.healthCenter];
  }

  let query = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (healthCenterFilter.length) {
    query.healthCenter = { $in: healthCenterFilter };
  }

  const results = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter')
    .populate('enteredBy');

  let allowedHealthCenters = [];
  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
  } else {
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  res.render("reports/form.ejs", {
    allowedHealthCenters,
    user: req.session.user,
    results,
    startDate,
    endDate,
    selectedHealthCenter: healthCenter
  });
});

router.post("/reports/export", async (req, res) => {
  const { startDate, endDate, healthCenter } = req.body;

  let healthCenterFilter = [];
  if (req.session.user.position === "Head of Pharmacy") {
    if (healthCenter) {
      healthCenterFilter = [healthCenter];
    }
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    const regionCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = regionCenters.map(center => center._id);

    if (healthCenter) {
      healthCenterFilter = [healthCenter];
    }
  } else {
    healthCenterFilter = [req.session.user.healthCenter];
  }

  let query = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (healthCenterFilter.length) {
    query.healthCenter = { $in: healthCenterFilter };
  }

  const results = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter')
    .populate('enteredBy');

  const exportData = results.map(tx => ({
    "Date": tx.date,
    "Code Number": tx.codeNumber.codeNumber,
    "Item Name": tx.codeNumber.itemName,
    "Qty In": tx.qtyIn,
    "Qty Out": tx.qtyOut,
    "Counter Stock": tx.counterStock,
    "Store Balance": tx.storeBalance,
    "Order Number": tx.orderNumber,
    "Remarks": tx.remarks,
    "Health Center": tx.healthCenter ? tx.healthCenter.healthCenterName : '',
    "Entered By": tx.enteredBy ? tx.enteredBy.username : ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  const filePath = "TransactionReport.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

module.exports = router;
