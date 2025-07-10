const router = require("express").Router();
const multer = require("multer");
const XLSX = require("xlsx");
const MedicationCatalog = require("../models/MedicationCatalog");

const upload = multer({ dest: "uploads/" });

router.get("/medications/import", (req, res) => {
  if (req.session.user.position !== "Head of Pharmacy") {
    req.session.formError = "Access Denied: Head of Pharmacy Only.";
    return res.redirect("/medications");
  }

  res.render("medications/import.ejs", { error: req.session.formError });
  req.session.formError = null;
});


router.post("/medications/import", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  for (let row of rows) {
    await MedicationCatalog.create({
      codeNumber: row["Code Number"],
      itemName: row["Item Name"]
    });
  }

  res.redirect("/medications");
});

module.exports = router;