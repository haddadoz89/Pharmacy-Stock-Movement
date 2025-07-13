const mongoose = require("mongoose");

const medicationCatalogSchema = new mongoose.Schema({
  codeNumber: { type: String, required: true, unique: true },
  itemName: { type: String, required: true },
  isActive: {
  type: Boolean,
  default: true
}
});

module.exports = mongoose.model("MedicationCatalog", medicationCatalogSchema);