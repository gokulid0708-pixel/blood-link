const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date },
  bloodGroup: { 
    type: String, 
    required: true, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
  },
  currentLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  workingLocation: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  aadhaarNumber: { type: String },
  aadhaarStatus: { 
    type: String, 
    enum: ['verified', 'pending', 'rejected'], 
    default: 'verified' 
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relation: { type: String }
  },
  lastDonationDate: { type: Date },
  availability: {
    type: String,
    enum: ['Available Now', 'Available Today', 'Busy', 'Unavailable'],
    default: 'Available Now'
  },
  trustScore: { type: Number, default: 95 },
  livesSaved: { type: Number, default: 0 },
  donationsCount: { type: Number, default: 0 },
  badges: [{ type: String }],
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donor', donorSchema);
