const Settings = require('../models/Settings');

// Get current settings (there should be only one document)
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings();
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error fetching settings' });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  const { siteTitle, adminEmail, enableNotifications, itemsPerPage } = req.body;

  if (!siteTitle || !adminEmail || typeof enableNotifications === 'undefined' || !itemsPerPage) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (typeof itemsPerPage !== 'number' || itemsPerPage <= 0) {
    return res.status(400).json({ message: 'Items per page must be a positive number' });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.siteTitle = siteTitle;
    settings.adminEmail = adminEmail;
    settings.enableNotifications = enableNotifications;
    settings.itemsPerPage = itemsPerPage;

    await settings.save();

    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};