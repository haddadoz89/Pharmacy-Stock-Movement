const mongoose = require("mongoose");

const healthCenterSchema = new mongoose.Schema({
  healthCenterName: {
    type: String,
    enum: [
      "Aali Health Center", "Ahmed Ali Kanoo Health Center", "Al-Hoora Health Center",
      "Al-Naim Health Center", "Bahrain & Kuwait Health Center – HIDD", "Bilad Al-Qadeem Health Center",
      "Budaiya Health Center", "Hamad Town Health Center", "Isa Town Health Center",
      "Kuwait Health Center", "Madinat Khalifa Health Center", "Muharraq Health Center",
      "NBB Health Center - Dair", "NBB Health Center - Arad", "Sh. Sabah Al-Salem Health Center",
      "Sh. Salman Health Center", "Sh. Jaber Al Ahmed Al Sabah Health Center", 
      "Sitra Health Center", "Yousif A. Rahman Engineer Health Center", "Zallaq Health Center"
    ],
    required: true
  },
  region: {
    type: String,
    enum: ["All", "Capital", "Muharraq", "Northern", "Southern"],
    required: true
  }
});

module.exports = mongoose.model("HealthCenter", healthCenterSchema);
