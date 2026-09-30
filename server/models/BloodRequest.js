const mongoose = require('mongoose');

const matchedDonorSchema = new mongoose.Schema({
  donorId: { type: String, required: true },
  donorName: { type: String, required: true },
  distanceKm: { type: Number },
  matchScore: { type: Number },
  compatibility: { type: Number },
  trustScore: { type: Number },
  availability: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Notified', 'Accepted', 'Declined', 'Registered', 'Interested'], 
    default: 'Notified' 
  },
  notifiedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
});

const bloodRequestSchema = new mongoose.Schema({
  // Category (Rule: Three Blood Request Categories)
  category: {
    type: String,
    enum: ['EMERGENCY', 'VOLUNTEER_DRIVE', 'SCHEDULED'],
    default: 'EMERGENCY',
    required: true
  },
  hospitalId: { type: String, required: true },
  hospitalName: { type: String, required: true },
  hospitalAddress: { type: String },
  hospitalPhone: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  bloodGroup: { 
    type: String, 
    required: true, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
  },
  unitsRequired: { type: Number, required: true, default: 1 },
  unitsSecured: { type: Number, default: 0 },
  priorityLevel: { 
    type: String, 
    enum: ['Critical', 'Urgent', 'Normal'], 
    default: 'Critical' 
  },
  requiredTime: { type: String, default: 'Immediate (< 30 mins)' },
  deadline: { type: Date },
  caseNotes: { type: String, default: 'Emergency patient care required.' },
  patientName: { type: String, default: 'Emergency Patient' },
  condition: { type: String, default: 'Trauma / Surgery' },
  
  // Category 2: Volunteer Blood Donation Drive specific fields
  driveDetails: {
    eventName: { type: String },
    eventDate: { type: String },
    locationName: { type: String },
    organizerDetails: {
      name: { type: String },
      contact: { type: String },
      organization: { type: String }
    },
    donorResponses: [{
      donorId: { type: String },
      donorName: { type: String },
      status: { type: String, enum: ['Register', 'Interested', 'Decline'] },
      respondedAt: { type: Date, default: Date.now }
    }]
  },

  // Category 3: Scheduled Blood Request specific fields
  scheduledDetails: {
    procedureType: { type: String }, // 'Planned Surgery', 'Organ Transplant', 'Future Medical Procedure'
    procedureDate: { type: String }, // e.g. 'Required after 4 days'
    advanceReservationEnabled: { type: Boolean, default: true },
    reservedBloodBankId: { type: String },
    reservedBloodBankName: { type: String },
    reminderSent: { type: Boolean, default: false }
  },

  // Status & Escalation
  status: { 
    type: String, 
    enum: ['Pending', 'Matching', 'Escalating', 'Partially Fulfilled', 'Fulfilled', 'Cancelled'], 
    default: 'Matching' 
  },
  escalationStage: { 
    type: String, 
    enum: [
      'Nearby Donors', 
      'Expanded Radius Search', 
      'Blood Banks', 
      'Partner Hospitals', 
      'District Alert', 
      'State Alert', 
      'Blood Secured'
    ], 
    default: 'Nearby Donors' 
  },
  matchedDonors: [matchedDonorSchema],
  reservedInventory: [{
    bloodBankId: { type: String },
    bloodBankName: { type: String },
    units: { type: Number },
    reservedAt: { type: Date, default: Date.now }
  }],
  timeline: [{
    stage: { type: String },
    message: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
