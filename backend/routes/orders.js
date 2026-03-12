const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const CargoService = require('../services/cargoService');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Sipariş oluştur
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, shippingCost, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Sepet boş' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Ürün bulunamadı: ${item.product}` });
      }

      const price = product.salePrice || product.price;
      totalAmount += price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name.tr,
        image: product.images[0] || '',
        price,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      });
    }

    // Kupon indirimi
    let discountAmount = 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid() && totalAmount >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round(totalAmount * coupon.discountValue / 100);
        } else {
          discountAmount = coupon.discountValue;
        }
        appliedCouponCode = coupon.code;
        coupon.usedCount += 1;
        coupon.usedBy.push(req.user._id);
        await coupon.save();
      }
    }

    totalAmount = totalAmount - discountAmount + (shippingCost || 0);

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      shippingCost: shippingCost || 0,
      couponCode: appliedCouponCode,
      discountAmount
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kendi siparişlerim
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tüm siparişler (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      from,
      to
    } = req.query;

    const query = {};

    // Date range filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    // Status filter
    if (status) query.status = status;

    // Search filter: match user name or order ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);

      query.$or = [
        { user: { $in: matchingUserIds } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Status counts aggregation
    const statusCountsPipeline = [];
    if (from || to) {
      const dateMatch = {};
      if (from) dateMatch.$gte = new Date(from);
      if (to) dateMatch.$lte = new Date(to);
      statusCountsPipeline.push({ $match: { createdAt: dateMatch } });
    }
    statusCountsPipeline.push({ $group: { _id: '$status', count: { $sum: 1 } } });

    const statusCountsRaw = await Order.aggregate(statusCountsPipeline);
    const statusCounts = {};
    statusCountsRaw.forEach(s => { statusCounts[s._id] = s.count; });

    res.json({
      orders,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      statusCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sipariş detayı (Admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Kullanıcı kendi siparişini veya admin tüm siparişleri görebilir
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Yetkiniz yok' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sipariş durumu güncelle (Admin)
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, trackingNumber, cargoProvider } = req.body;
    const update = { status };
    if (trackingNumber) update.trackingNumber = trackingNumber;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    // Kargoya verildiğinde otomatik gönderi kaydı oluştur
    if (status === 'shipped' && trackingNumber) {
      try {
        await CargoService.createShipment(order, {
          provider: cargoProvider || 'manual',
          trackingNumber,
          userId: req.user._id
        });
      } catch (shipErr) {
        console.error('Shipment creation error:', shipErr.message);
      }
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
