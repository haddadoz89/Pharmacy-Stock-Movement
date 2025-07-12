const mongoose = require("mongoose");

const medicationTransactionSchema = new mongoose.Schema({
  codeNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MedicationCatalog",
    required: true
  },
  date: { type: Date, required: true },
  qtyIn: Number,
  qtyOut: Number,
  counterStock: Number,
  storeBalance: Number,
  expiry: [{
    expiryDate: Date,
    lotNumber: String
  }],
  orderNumber: String,
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  healthCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HealthCenter"
  },
  remarks: String
});

module.exports = mongoose.model("MedicationTransaction", medicationTransactionSchema);
