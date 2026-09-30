const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true },
  donorId: { type: String, required: true },
  donorName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  hospitalName: { type: String, required: true },
  units: { type: Number, default: 1 },
  donationDate: { type: Date, default: Date.now },
  issueDate: { type: Date, default: Date.now },
  verificationHash: { type: String }
});

module.exports = mongoose.model('Certificate', certificateSchema);
