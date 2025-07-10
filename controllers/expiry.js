const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const HealthCenter = require("../models/HealthCenter");
const XLSX = require("xlsx");


router.get("/expiry-check", (req, res) => {
  res.render('expiry/form.ejs', {
    results: null,
    startDate: '',
    endDate: '',
    user: req.session.user
  });
});

router.post("/expiry-check", async (req, res) => {
  const { startDate, endDate } = req.body;

  let healthCenterFilter = [];
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } 
  else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = allowedHealthCenters.map(center => center._id);
  } 
  else {
    healthCenterFilter = [req.session.user.healthCenter];
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  let query = {
    'expiry.expiryDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (req.session.user.position !== "Head of Pharmacy") {
    query.healthCenter = { $in: healthCenterFilter };
  }

  const results = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter');

  res.render('expiry/form.ejs', {
    results,
    startDate,
    endDate,
    allowedHealthCenters,
    user: req.session.user
  });
});

router.post("/expiry-check/export", async (req, res) => {
  const { startDate, endDate } = req.body;

  let healthCenterFilter = [];

  if (req.session.user.position === "Head of Pharmacy") {
    healthCenterFilter = [];
  } 
  else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    const regionCenters = await HealthCenter.find({ region: userHealthCenter.region });
    healthCenterFilter = regionCenters.map(center => center._id);
  } 
  else {
    healthCenterFilter = [req.session.user.healthCenter];
  }

  let query = {
    'expiry.expiryDate': { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  if (req.session.user.position !== "Head of Pharmacy") {
    query.healthCenter = { $in: healthCenterFilter };
  }

  const results = await MedicationTransaction.find(query)
    .populate('codeNumber')
    .populate('healthCenter');

  let exportData = [];

  results.forEach(tx => {
    tx.expiry.forEach(ex => {
      exportData.push({
        "Medication Name": tx.codeNumber.itemName,
        "Expiry Date": ex.expiryDate ? ex.expiryDate.toISOString().split('T')[0] : '',
        "Lot Number": ex.lotNumber,
        "Health Center": tx.healthCenter ? tx.healthCenter.healthCenterName : ''
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ExpiryData");

  const filePath = "ExpiryResults.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

module.exports = router;