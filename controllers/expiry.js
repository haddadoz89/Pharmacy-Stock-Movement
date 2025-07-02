const MedicationTransaction = require("../models/medicationTransaction");
const HealthCenter = require("../models/healthCenter");

const form = (req, res) => {
  res.render('expiry/form.ejs', {
    results: null,
    startDate: '',
    endDate: '',
    user: req.session.user
  });
};

const search = async (req, res) => {
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
};

module.exports = { form, search };