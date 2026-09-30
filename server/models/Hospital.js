const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  address: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  verificationStatus: { 
    type: String, 
    enum: ['verified', 'pending', 'rejected'], 
    default: 'verified' 
  },
  type: { type: String, default: 'General / Trauma' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
