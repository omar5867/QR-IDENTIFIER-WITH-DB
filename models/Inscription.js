const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  promotion: String,
  fullName: String,
  gender: String,
  docType: String,
  docNumber: String,
  entryNumber: Number // ← nuevo campo único por invitado
});

const inscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  guests: [guestSchema],
  guestCount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  token: { type: String, required: true },
  used: { type: Boolean, default: false }
});

module.exports = mongoose.model('Inscription', inscriptionSchema);
