const MedicationCatalog = require("../models/medicationCatalog");
const MedicationTransaction = require("../models/medicationTransaction");
const HealthCenter = require("../models/healthCenter");

const index = async (req, res) => {
  const search = req.query.search || "";
  const regex = new RegExp(search, "i");
  const medications = await MedicationCatalog.find({ itemName: { $regex: regex } });
  res.render("medications/index.ejs", { medications, search });
};

const show = async (req, res) => {
  const medication = await MedicationCatalog.findById(req.params.id);

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
};


const newForm = (req, res) => {
  res.render("medications/new.ejs", { user: req.session.user });
};

const create = async (req, res) => {
  await MedicationCatalog.create({
    itemName: req.body.itemName,
    codeNumber: req.body.codeNumber
  });
  res.redirect("/medications");
};

module.exports = { index, show, newForm, create };