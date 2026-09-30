const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true },
  recipientRole: { type: String, enum: ['donor', 'hospital', 'bloodbank', 'admin'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['emergency_request', 'match_found', 'request_accepted', 'escalation_alert', 'inventory_low', 'system'], 
    default: 'emergency_request' 
  },
  priority: { type: String, enum: ['Critical', 'Urgent', 'Normal'], default: 'Normal' },
  metadata: { type: Object },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
