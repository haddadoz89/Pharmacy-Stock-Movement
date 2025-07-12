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
  healthCenter: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "HealthCenter",
  required: true
  },
  active: {
  type: Boolean,

  
  default: true
  }
});

module.exports = mongoose.model("User", userSchema);