const express = require('express');
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const CargoService = require('../services/cargoService');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Gönderi oluştur
router.post('/:orderId', protect, admin, async (req, res) => {
  try {
    const { provider, trackingNumber } = req.body;
    if (!trackingNumber) {
      return res.status(400).json({ message: 'Takip numarası gerekli' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    const shipment = await CargoService.createShipment(order, {
      provider: provider || 'manual',
      trackingNumber,
      userId: req.user._id
    });

    // Siparişi de güncelle
    order.trackingNumber = trackingNumber;
    if (order.status === 'preparing' || order.status === 'confirmed') {
      order.status = 'shipped';
    }
    await order.save();

    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Siparişe ait gönderi bilgisi
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ order: req.params.orderId });
    if (!shipment) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Gönderi durumu güncelle
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, description } = req.body;
    const shipment = await CargoService.updateShipmentStatus(
      req.params.id, status, description
    );

    // Eğer delivered ise siparişi de güncelle
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(shipment.order, { status: 'delivered' });
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook (kargo firmasından gelen durum güncellemeleri)
router.post('/webhook', async (req, res) => {
  try {
    const { trackingNumber, status, provider } = req.body;

    const shipment = await Shipment.findOne({ trackingNumber });
    if (!shipment) {
      return res.status(404).json({ message: 'Gönderi bulunamadı' });
    }

    const statusMap = {
      'picked_up': 'picked_up',
      'in_transit': 'in_transit',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
      'returned': 'returned'
    };

    const mappedStatus = statusMap[status] || status;
    shipment.status = mappedStatus;
    shipment.statusHistory.push({
      status: mappedStatus,
      description: `Webhook: ${status}`
    });
    await shipment.save();

    // Sipariş durumunu güncelle
    if (mappedStatus === 'delivered') {
      await Order.findByIdAndUpdate(shipment.order, { status: 'delivered' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
