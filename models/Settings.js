const mongoose = require('mongoose');
const settingsSchema = new mongoose.Schema({
  siteTitle: { type: String, required: true, default: 'My Awesome Site' },
  adminEmail: { type: String, required: true, default: 'admin@example.com' },
  enableNotifications: { type: Boolean, default: true },
  itemsPerPage: { type: Number, default: 20 },
}, { timestamps: true });
module.exports = mongoose.model('Settings', settingsSchema);