const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const PaymentService = require('../services/paymentService');
const { protect } = require('../middleware/auth');

// GET /api/payment/config - Aktif ödeme sağlayıcısını döndür (public)
router.get('/config', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const config = settings?.paymentConfig || {};
    res.json({
      provider: config.provider || 'iyzico',
      testMode: config.testMode !== false
    });
  } catch (error) {
    res.status(500).json({ message: 'Ödeme ayarları alınamadı' });
  }
});

// POST /api/payment/process - Ödemeyi işle
router.post('/process', protect, async (req, res) => {
  try {
    const { orderId, card } = req.body;

    if (!orderId || !card) {
      return res.status(400).json({ success: false, message: 'Sipariş ve kart bilgileri gerekli' });
    }

    // Kart doğrulama
    if (!card.cardHolderName || !card.cardNumber || !card.expireMonth || !card.expireYear || !card.cvc) {
      return res.status(400).json({ success: false, message: 'Tüm kart bilgilerini doldurun' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Yetkisiz erişim' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Bu sipariş zaten ödenmiş' });
    }

    const buyerData = {
      userId: req.user._id.toString(),
      name: order.shippingAddress.fullName,
      email: req.user.email,
      phone: order.shippingAddress.phone,
      address: order.shippingAddress.street,
      city: order.shippingAddress.city,
      zipCode: order.shippingAddress.zipCode || '34000',
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1'
    };

    const result = await PaymentService.createPayment(order, card, buyerData);

    if (result.success) {
      order.paymentStatus = 'paid';
      order.paymentId = result.paymentId;
      order.status = 'confirmed';
      await order.save();

      res.json({
        success: true,
        message: 'Ödeme başarılı',
        orderId: order._id,
        provider: result.provider
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      res.json({
        success: false,
        message: result.message || 'Ödeme başarısız',
        provider: result.provider
      });
    }
  } catch (error) {
    console.error('Ödeme hatası:', error);
    res.status(500).json({ success: false, message: error.message || 'Ödeme işlemi sırasında hata oluştu' });
  }
});

// POST /api/payment/paytr-callback - PayTR webhook
router.post('/paytr-callback', async (req, res) => {
  try {
    const { merchant_oid, status, total_amount, hash } = req.body;
    const settings = await Settings.findOne();
    const merchantKey = settings?.paymentConfig?.paytr?.merchantKey;
    const merchantSalt = settings?.paymentConfig?.paytr?.merchantSalt;

    if (merchantKey && merchantSalt) {
      // Hash doğrulaması
      const crypto = require('crypto');
      const checkHash = crypto.createHmac('sha256', merchantKey)
        .update(merchant_oid + merchantSalt + status + total_amount)
        .digest('base64');

      if (hash !== checkHash) {
        return res.send('PAYTR notification failed: hash mismatch');
      }
    }

    const order = await Order.findById(merchant_oid);
    if (order) {
      order.paymentStatus = status === 'success' ? 'paid' : 'failed';
      if (status === 'success') order.status = 'confirmed';
      await order.save();
    }

    res.send('OK');
  } catch (error) {
    console.error('PayTR callback hatası:', error);
    res.send('OK');
  }
});

module.exports = router;
