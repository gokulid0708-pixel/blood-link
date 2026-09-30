const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: String },
  userName: { type: String },
  userRole: { type: String },
  action: { type: String, required: true },
  details: { type: String },
  ip: { type: String, default: '127.0.0.1' },
  status: { type: String, enum: ['success', 'warning', 'danger'], default: 'success' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
