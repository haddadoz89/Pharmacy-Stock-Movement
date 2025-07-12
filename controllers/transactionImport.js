const router = require("express").Router();
const multer = require("multer");
const XLSX = require("xlsx");
const MedicationTransaction = require("../models/MedicationTransaction");
const MedicationCatalog = require("../models/MedicationCatalog");
const HealthCenter = require("../models/HealthCenter");

const upload = multer({ dest: "uploads/" });

function formatDateToDDMMYYYY(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

router.get("/transactions/import", async (req, res) => {
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

  res.render("transactions/import.ejs", {
    allowedHealthCenters,
    user: req.session.user
  });
});

router.post("/transactions/import", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const selectedHealthCenter = req.body.healthCenter || req.session.user.healthCenter;

  for (let row of rows) {
    const medication = await MedicationCatalog.findOne({ codeNumber: row["Code Number"] });
    if (!medication) continue;

    let dateValue = row["Date"];
    let dateParsed = "";
    if (!isNaN(dateValue) && typeof dateValue === "number") {
      const parsed = XLSX.SSF.parse_date_code(dateValue);
      dateParsed = formatDateToDDMMYYYY(new Date(parsed.y, parsed.m - 1, parsed.d));
    } else {
      dateParsed = formatDateToDDMMYYYY(new Date(dateValue));
    }

    let expiryDateValue = row["Expiry Date"];
    let expiryDateParsed = "";
    if (!isNaN(expiryDateValue) && typeof expiryDateValue === "number") {
      const parsed = XLSX.SSF.parse_date_code(expiryDateValue);
      expiryDateParsed = formatDateToDDMMYYYY(new Date(parsed.y, parsed.m - 1, parsed.d));
    } else {
      expiryDateParsed = formatDateToDDMMYYYY(new Date(expiryDateValue));
    }

    const qtyIn = Number(row["Qty In"]) || 0;
    const qtyOut = Number(row["Qty Out"]) || 0;

    const lastTransaction = await MedicationTransaction.findOne({
      codeNumber: medication._id,
      healthCenter: selectedHealthCenter
    }).sort({ date: -1, _id: -1 });

    const previousBalance = lastTransaction ? lastTransaction.storeBalance : 0;
    const newBalance = previousBalance + qtyIn - qtyOut;

    await MedicationTransaction.create({
      codeNumber: medication._id,
      date: dateParsed,
      qtyIn,
      qtyOut,
      counterStock: row["Counter Stock"],
      storeBalance: newBalance,
      expiry: [{
        expiryDate: expiryDateParsed,
        lotNumber: row["Lot Number"]
      }],
      orderNumber: row["Order Number"],
      remarks: row["Remarks"],
      enteredBy: req.session.user._id,
      healthCenter: selectedHealthCenter
    });
  }

  res.redirect(`/medications`);
});

module.exports = router;
