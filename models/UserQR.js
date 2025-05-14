const mongoose = require('mongoose');

const userQRSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true },
  passwordHash:{ type: String, required: true },
  token:       { type: String, required: true, unique: true },
  status:      { type: String, enum: ['pendiente','aceptado','rechazado'], default: 'pendiente' },
  used:        { type: Boolean, default: false },
  expiresAt:   { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('UserQR', userQRSchema);
