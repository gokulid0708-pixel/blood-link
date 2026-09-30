const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: String, required: true },
  donorName: { type: String, required: true },
  donorBloodGroup: { type: String, required: true },
  hospitalId: { type: String, required: true },
  hospitalName: { type: String, required: true },
  requestId: { type: String },
  units: { type: Number, default: 1 },
  donationDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Completed' 
  },
  certificateIssued: { type: Boolean, default: true },
  badgeAwarded: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
