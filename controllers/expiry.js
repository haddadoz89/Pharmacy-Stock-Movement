const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const HealthCenter = require("../models/HealthCenter");
const MedicationCatalog = require("../models/MedicationCatalog");
const XLSX = require("xlsx");

router.get("/expiry-check", async (req, res) => {
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
  } else {
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  res.render('expiry/form.ejs', {
    results: null,
    startDate: '',
    endDate: '',
    selectedHealthCenter: '',
    allowedHealthCenters,
    user: req.session.user
  });
});

router.post("/expiry-check", async (req, res) => {
  const { startDate, endDate, healthCenter } = req.body;

  let healthCenterFilter = [];
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = allowedHealthCenters.map(center => center._id);
  } else {
    healthCenterFilter = [req.session.user.healthCenter];
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  let query = {
    'expiry.expiryDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (req.session.user.position === "Head of Pharmacy" && healthCenter) {
    query.healthCenter = healthCenter;
  } else if (req.session.user.position === "Senior Pharmacy" && healthCenter) {
    query.healthCenter = healthCenter;
  } else if (req.session.user.position !== "Head of Pharmacy") {
    query.healthCenter = { $in: healthCenterFilter };
  }

  const transactions = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter');

  const grouped = {};

  for (const tx of transactions) {
    if (!tx.codeNumber || tx.codeNumber.active === false) continue;

    const store = tx.storeBalance || 0;
    const counter = tx.counterStock || 0;
    const total = store + counter;

    if (total <= 0) continue;

    tx.expiry.forEach(ex => {
      if (!ex.expiryDate) return;

      const key = [
        tx.codeNumber._id,
        ex.lotNumber,
        ex.expiryDate.toISOString(),
        tx.healthCenter?._id
      ].join("_");

      if (!grouped[key]) {
        grouped[key] = {
          medicationName: tx.codeNumber.itemName,
          lotNumber: ex.lotNumber,
          expiryDate: ex.expiryDate,
          storeBalance: 0,
          counterStock: 0,
          healthCenterName: tx.healthCenter ? tx.healthCenter.healthCenterName : ""
        };
      }

      grouped[key].storeBalance += store;
      grouped[key].counterStock += counter;
    });
  }

  const results = Object.values(grouped).filter(item =>
    (item.storeBalance + item.counterStock) > 0
  );

  res.render('expiry/form.ejs', {
    results,
    startDate,
    endDate,
    selectedHealthCenter: healthCenter,
    allowedHealthCenters,
    user: req.session.user
  });
});

router.post("/expiry-check/export", async (req, res) => {
  const { startDate, endDate, healthCenter } = req.body;

  let healthCenterFilter = [];

  if (req.session.user.position === "Head of Pharmacy") {
    healthCenterFilter = [];
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    const regionCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = regionCenters.map(center => center._id);
  } else {
    healthCenterFilter = [req.session.user.healthCenter];
  }

  let query = {
    'expiry.expiryDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (req.session.user.position === "Head of Pharmacy" && healthCenter) {
    query.healthCenter = healthCenter;
  } else if (req.session.user.position === "Senior Pharmacy" && healthCenter) {
    query.healthCenter = healthCenter;
  } else if (req.session.user.position !== "Head of Pharmacy") {
    query.healthCenter = { $in: healthCenterFilter };
  }

  const transactions = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter');

  const grouped = {};

  for (const tx of transactions) {
    if (!tx.codeNumber || tx.codeNumber.active === false) continue;

    const store = tx.storeBalance || 0;
    const counter = tx.counterStock || 0;
    const total = store + counter;

    if (total <= 0) continue;

    tx.expiry.forEach(ex => {
      if (!ex.expiryDate) return;

      const key = [
        tx.codeNumber._id,
        ex.lotNumber,
        ex.expiryDate.toISOString(),
        tx.healthCenter?._id
      ].join("_");

      if (!grouped[key]) {
        grouped[key] = {
          "Medication Name": tx.codeNumber.itemName,
          "Lot Number": ex.lotNumber,
          "Expiry Date": ex.expiryDate ? ex.expiryDate.toISOString().split('T')[0] : '',
          "Store Balance": 0,
          "Counter Stock": 0,
          "Health Center": tx.healthCenter ? tx.healthCenter.healthCenterName : ""
        };
      }

      grouped[key]["Store Balance"] += store;
      grouped[key]["Counter Stock"] += counter;
    });
  }

  const exportData = Object.values(grouped).filter(item =>
    (item["Store Balance"] + item["Counter Stock"]) > 0
  );

  exportData.sort((a, b) => {
    if (a["Health Center"] < b["Health Center"]) return -1;
    if (a["Health Center"] > b["Health Center"]) return 1;
    return new Date(a["Expiry Date"]) - new Date(b["Expiry Date"]);
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ExpiryData");

  const filePath = "ExpiryResults.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

module.exports = router;