const router = require("express").Router();
const MedicationTransaction = require("../models/MedicationTransaction");
const HealthCenter = require("../models/HealthCenter");

router.get("/medications/:id/transactions/new", async (req, res) => {
  const medicationId = req.params.id;

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

  res.render("transactions/new.ejs", {
    medicationId,
    allowedHealthCenters,
    user: req.session.user
  });
});

router.post("/medications/:id/transactions", async (req, res) => {
  const medicationId = req.params.id;
  const selectedHealthCenter = req.body.healthCenter || req.session.user.healthCenter;
  const previousTransaction = await MedicationTransaction.findOne({
    codeNumber: medicationId,
    healthCenter: selectedHealthCenter
  }).sort({ date: -1 , _id: -1 });

  let previousBalance = 0;
  if (previousTransaction) {
    previousBalance = previousTransaction.storeBalance || 0;
  }

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

router.get("/transactions/:id/edit", async (req, res) => {
  const transaction = await MedicationTransaction.findById(req.params.id);
  res.render("transactions/edit.ejs", { transaction, user: req.session.user });
});

router.put("/transactions/:id", async (req, res) => {
  await MedicationTransaction.findByIdAndUpdate(req.params.id, {
    date: req.body.date,
    qtyIn: req.body.qtyIn,
    qtyOut: req.body.qtyOut,
    counterStock: req.body.counterStock,
    storeBalance: req.body.qtyIn - req.body.qtyOut,
    expiry: [{
      expiryDate: req.body.expiryDate,
      lotNumber: req.body.lotNumber
    }],
    orderNumber: req.body.orderNumber,
    remarks: req.body.remarks
  });

  const transaction = await MedicationTransaction.findById(req.params.id);
  res.redirect(`/medications/${transaction.codeNumber}`);
});

router.delete("/transactions/:id", async (req, res) => {
  const transaction = await MedicationTransaction.findById(req.params.id);
  const medicationId = transaction.codeNumber;

  await MedicationTransaction.findByIdAndDelete(req.params.id);
  res.redirect(`/medications/${medicationId}`);
});

module.exports = router;