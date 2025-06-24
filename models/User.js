const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  position: {
    type: String,
    enum: [
      "Head of Pharmacy",
      "Senior Pharmacy",
      "Pharmacist Incharge",
      "Pharmacist",
      "Senior Pharmacy Technician",
      "Pharmacy Technician"
    ],
    required: true
  },
  healthCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HealthCenter",
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);