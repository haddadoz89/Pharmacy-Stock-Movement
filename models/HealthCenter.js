const mongoose = require("mongoose");

const healthCenterSchema = new mongoose.Schema({
  healthCenterName: {
    type: String,
    enum: [
      "Aali Health Center", "Ahmed Ali Kanoo Health Center", "AlHoora Health Center",
      "Al-Naim Health Center", "Bahrain & Kuwait Health Center HIDD", "Bilad AlQadeem Health Center",
      "Budaiya Health Center", "Hamad Town Health Center", "Isa Town Health Center",
      "Kuwait Health Center", "Madinat Khalifa Health Center", "Muharraq Health Center",
      "NBB Health Center Dair", "NBB Health Center Arad", "Shaikh Sabah AlSalem Health Center",
      "Shaikh Salman Health Center", "Shaikh Jaber Al Ahmed Al Sabah Health Center", 
      "Sitra Health Center", "Yousif Abdullrahman Engineer Health Center", "Zallaq Health Center"
    ],
    required: true
  },
  region: {
    type: String,
    enum: ["Capital", "Muharraq", "Northern", "Southern"],
    required: true
  }
});

module.exports = mongoose.model("HealthCenter", healthCenterSchema);
