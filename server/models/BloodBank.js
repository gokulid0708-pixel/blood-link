const mongoose = require('mongoose');

const bloodInventoryItemSchema = new mongoose.Schema({
  bloodGroup: { 
    type: String, 
    required: true, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
  },
  availableUnits: { type: Number, default: 0 },
  reservedUnits: { type: Number, default: 0 },
  minThreshold: { type: Number, default: 5 },
  lastUpdated: { type: Date, default: Date.now },
  nearestExpiryDate: { type: Date }
});

const bloodBankSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  address: { type: String, required: true },
  storageCapacity: { type: Number, default: 1000 },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  inventory: [bloodInventoryItemSchema],
  verificationStatus: { 
    type: String, 
    enum: ['verified', 'pending', 'rejected'], 
    default: 'verified' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodBank', bloodBankSchema);
