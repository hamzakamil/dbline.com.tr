const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * Kullanıcının bildirim tercihlerini getir
 * GET /api/notifications/preferences
 */
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications timestampPreference');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      notifications: user.notifications || {
        email: true,
        push: false,
        whatsapp: false,
        whatsappNumber: '',
        preferences: {
          orderUpdates: true,
          promotions: false,
          priceDrops: false,
          stockAlerts: false,
          newsletter: false
        }
      },
      timestampPreference: user.timestampPreference || {
        scope: 'all',
        specificDocuments: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Kullanıcının bildirim tercihlerini güncelle
 * PUT /api/notifications/preferences
 */
router.put('/preferences', protect, async (req, res) => {
  try {
    const { notifications, timestampPreference } = req.body;

    const updateData = {};

    if (notifications) {
      if (typeof notifications.email === 'boolean') updateData['notifications.email'] = notifications.email;
      if (typeof notifications.push === 'boolean') updateData['notifications.push'] = notifications.push;
      if (typeof notifications.whatsapp === 'boolean') updateData['notifications.whatsapp'] = notifications.whatsapp;
      if (notifications.whatsappNumber !== undefined) updateData['notifications.whatsappNumber'] = notifications.whatsappNumber;

      if (notifications.preferences) {
        const prefs = notifications.preferences;
        if (typeof prefs.orderUpdates === 'boolean') updateData['notifications.preferences.orderUpdates'] = prefs.orderUpdates;
        if (typeof prefs.promotions === 'boolean') updateData['notifications.preferences.promotions'] = prefs.promotions;
        if (typeof prefs.priceDrops === 'boolean') updateData['notifications.preferences.priceDrops'] = prefs.priceDrops;
        if (typeof prefs.stockAlerts === 'boolean') updateData['notifications.preferences.stockAlerts'] = prefs.stockAlerts;
        if (typeof prefs.newsletter === 'boolean') updateData['notifications.preferences.newsletter'] = prefs.newsletter;
      }
    }

    if (timestampPreference) {
      if (timestampPreference.scope) updateData['timestampPreference.scope'] = timestampPreference.scope;
      if (Array.isArray(timestampPreference.specificDocuments)) {
        const validDocs = timestampPreference.specificDocuments.filter(d => ['order', 'invoice', 'shipping'].includes(d));
        updateData['timestampPreference.specificDocuments'] = validDocs;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('notifications timestampPreference');

    res.json({
      message: 'Tercihler güncellendi',
      notifications: user.notifications,
      timestampPreference: user.timestampPreference
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
