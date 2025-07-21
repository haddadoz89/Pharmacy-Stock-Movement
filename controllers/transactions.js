const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const MedicationCatalog = require("../models/MedicationCatalog");
const HealthCenter = require("../models/HealthCenter");

// New transaction form
router.get("/medications/:id/transactions/new", async (req, res) => {
  const medicationId = req.params.id;
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
  } else {
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  res.render("transactions/new.ejs", {
    medicationId,
    allowedHealthCenters,
    user: req.session.user
  });
});

// Add transaction
router.post("/medications/:id/transactions", async (req, res) => {
  const medicationId = req.params.id;
  const selectedHealthCenter = req.body.healthCenter || req.session.user.healthCenter;

  const medication = await MedicationCatalog.findById(medicationId);
  if (!medication || medication.isActive === false) {
    req.session.formError = "This medication is deactivated and cannot receive new transactions.";
    return res.redirect(`/medications/${medicationId}`);
  }

  const previousTransaction = await MedicationTransaction.findOne({
    codeNumber: medicationId,
    healthCenter: selectedHealthCenter
  }).sort({ date: -1, _id: -1 });

  let previousBalance = previousTransaction ? previousTransaction.storeBalance || 0 : 0;
  const qtyIn = parseInt(req.body.qtyIn) || 0;
  const qtyOut = parseInt(req.body.qtyOut) || 0;
  const newStoreBalance = previousBalance + qtyIn - qtyOut;

  await MedicationTransaction.create({
    codeNumber: medicationId,
    date: req.body.date,
    qtyIn,
    qtyOut,
    counterStock: req.body.counterStock,
    storeBalance: newStoreBalance,
    expiry: [{
      expiryDate: req.body.expiryDate,
      lotNumber: req.body.lotNumber
    }],
    orderNumber: req.body.orderNumber,
    remarks: req.body.remarks,
    enteredBy: req.session.user._id,
    healthCenter: selectedHealthCenter
  });

  res.redirect(`/medications/${medicationId}`);
});

// Edit form
router.get("/transactions/:id/edit", async (req, res) => {
  const transaction = await MedicationTransaction.findById(req.params.id).populate('healthCenter');
  let allowedHealthCenters = [];

  if (req.session.user.position === "Head of Pharmacy") {
    allowedHealthCenters = await HealthCenter.find();
  } else if (req.session.user.position === "Senior Pharmacy") {
    const userHealthCenter = await HealthCenter.findById(req.session.user.healthCenter);
    allowedHealthCenters = await HealthCenter.find({ region: userHealthCenter.region });
  } else {
    allowedHealthCenters = await HealthCenter.find({ _id: req.session.user.healthCenter });
  }

  res.render("transactions/edit.ejs", { transaction, allowedHealthCenters, user: req.session.user });
});

// Update transaction
router.put("/transactions/:id", async (req, res) => {
  const transaction = await MedicationTransaction.findById(req.params.id);
  let storeBalance = transaction.storeBalance;

  if (typeof req.body.qtyIn !== "undefined" && typeof req.body.qtyOut !== "undefined") {
    const qtyIn = parseInt(req.body.qtyIn) || 0;
    const qtyOut = parseInt(req.body.qtyOut) || 0;
    // Optional: update balance if desired
    storeBalance = qtyIn - qtyOut;
  }

  await MedicationTransaction.findByIdAndUpdate(req.params.id, {
    date: req.body.date,
    qtyIn: req.body.qtyIn,
    qtyOut: req.body.qtyOut,
    counterStock: req.body.counterStock,
    storeBalance: storeBalance,
    expiry: [{
      expiryDate: req.body.expiryDate,
      lotNumber: req.body.lotNumber
    }],
    orderNumber: req.body.orderNumber,
    remarks: req.body.remarks,
    healthCenter: req.body.healthCenter || transaction.healthCenter
  });

  res.redirect(`/medications/${transaction.codeNumber}`);
});

// Delete transaction
router.delete("/transactions/:id", async (req, res) => {
  const transaction = await MedicationTransaction.findById(req.params.id);
  const medicationId = transaction.codeNumber;
  await MedicationTransaction.findByIdAndDelete(req.params.id);
  res.redirect(`/medications/${medicationId}`);
});

module.exports = router;
