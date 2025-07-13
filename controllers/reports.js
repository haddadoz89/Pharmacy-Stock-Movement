const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const HealthCenter = require("../models/HealthCenter");
const MedicationCatalog = require("../models/MedicationCatalog");
const XLSX = require("xlsx");

router.get("/", async (req, res) => {
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHC = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHC.region });
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
  if (req.session.user.position === "Head of Pharmacy" && healthCenter) {
    healthCenterFilter = [healthCenter];
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHC = await HealthCenter.findById(req.session.user.healthCenter);
    const regionHCs = await HealthCenter.find({ region: userHC.region });
    healthCenterFilter = regionHCs.map(c => c._id);
    if (healthCenter) healthCenterFilter = [healthCenter];
  } else {
    healthCenterFilter = [req.session.user.healthCenter];
  }

  let query = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (healthCenterFilter.length) {
    query.healthCenter = { $in: healthCenterFilter };
  }

  // Only transactions of active medications
  const activeMedications = await MedicationCatalog.find({ active: true });
  const activeIds = activeMedications.map(m => m._id);
  query.codeNumber = { $in: activeIds };

  const transactions = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter')
    .sort({ date: 1 });

  const summaryMap = new Map();

  transactions.forEach(tx => {
    if (!tx.codeNumber) return;
    const code = tx.codeNumber.codeNumber;
    const name = tx.codeNumber.itemName;

    if (!summaryMap.has(code)) {
      summaryMap.set(code, {
        codeNumber: code,
        itemName: name,
        qtyIn: 0,
        qtyOut: 0,
        lastStoreBalance: 0
      });
    }

    const entry = summaryMap.get(code);
    entry.qtyIn += tx.qtyIn || 0;
    entry.qtyOut += tx.qtyOut || 0;
    entry.lastStoreBalance = tx.storeBalance || 0;
  });

  const results = Array.from(summaryMap.values());

  let allowedHealthCenters = [];
  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHC = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHC.region });
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

router.post("/export", async (req, res) => {
  const { startDate, endDate, healthCenter } = req.body;

  let healthCenterFilter = [];
  if (req.session.user.position === "Head of Pharmacy" && healthCenter) {
    healthCenterFilter = [healthCenter];
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHC = await HealthCenter.findById(req.session.user.healthCenter);
    const regionHCs = await HealthCenter.find({ region: userHC.region });
    healthCenterFilter = regionHCs.map(c => c._id);
    if (healthCenter) healthCenterFilter = [healthCenter];
  } else {
    healthCenterFilter = [req.session.user.healthCenter];
  }

  let query = {
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (healthCenterFilter.length) {
    query.healthCenter = { $in: healthCenterFilter };
  }

  // Only active medications
  const activeMedications = await MedicationCatalog.find({ active: true });
  const activeIds = activeMedications.map(m => m._id);
  query.codeNumber = { $in: activeIds };

  const transactions = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter')
    .sort({ date: 1 });

  const summaryMap = new Map();

  transactions.forEach(tx => {
    if (!tx.codeNumber) return;
    const code = tx.codeNumber.codeNumber;
    const name = tx.codeNumber.itemName;

    if (!summaryMap.has(code)) {
      summaryMap.set(code, {
        "Code Number": code,
        "Item Name": name,
        "Qty In": 0,
        "Qty Out": 0,
        "Last Store Balance": 0
      });
    }

    const entry = summaryMap.get(code);
    entry["Qty In"] += tx.qtyIn || 0;
    entry["Qty Out"] += tx.qtyOut || 0;
    entry["Last Store Balance"] = tx.storeBalance || 0;
  });

  const exportData = Array.from(summaryMap.values());

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "TransactionReport");

  const filePath = "TransactionReport.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

module.exports = router;
