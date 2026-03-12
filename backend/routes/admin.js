const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Dashboard istatistikleri
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'customer' });

    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Son 30 gün siparişleri
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Bekleyen siparişler
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      recentOrders,
      pendingOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Enhanced Dashboard - tek çağrıda tüm dashboard verileri
router.get('/dashboard-enhanced', protect, admin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const sevenDaysAgo = new Date(todayStart); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalOrders, totalProducts, totalUsers, pendingOrders,
      todayAgg, yesterdayAgg, thisWeekAgg, lastWeekAgg,
      sparkline, recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ active: true }),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ status: 'pending' }),
      // Today's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: todayStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Yesterday's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: yesterdayStart, $lt: todayStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // This week's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: weekStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Last week's revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: lastWeekStart, $lt: weekStart }, paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // 7-day sparkline
      Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo }, paymentStatus: 'paid' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Recent 5 orders
      Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(5).select('totalAmount status createdAt user')
    ]);

    const totalRevenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      pendingOrders,
      todayRevenue: todayAgg[0]?.revenue || 0,
      todayOrders: todayAgg[0]?.count || 0,
      yesterdayRevenue: yesterdayAgg[0]?.revenue || 0,
      yesterdayOrders: yesterdayAgg[0]?.count || 0,
      thisWeekRevenue: thisWeekAgg[0]?.revenue || 0,
      lastWeekRevenue: lastWeekAgg[0]?.revenue || 0,
      sparkline: sparkline.map(s => ({ date: s._id, revenue: s.revenue, orders: s.count })),
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Site ayarlarını getir
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Site ayarlarını güncelle
router.put('/settings', protect, admin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      // Audit trail: tema veya layout değişikliği varsa
      if (req.body.themeConfig || req.body.layoutConfig) {
        req.body.designUpdatedAt = new Date();
        req.body.designUpdatedBy = req.user._id;
      }
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
