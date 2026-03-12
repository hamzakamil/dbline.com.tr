const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const SearchLog = require('../models/SearchLog');
const { protect, admin } = require('../middleware/auth');
const XLSX = require('xlsx');

const router = express.Router();

// Tarih aralığı yardımcısı
function getDateRange(req) {
  const now = new Date();
  let from, to;

  if (req.query.from && req.query.to) {
    from = new Date(req.query.from);
    to = new Date(req.query.to);
    to.setHours(23, 59, 59, 999);
  } else {
    const period = req.query.period || '30d';
    to = new Date();
    to.setHours(23, 59, 59, 999);
    if (period === 'today') {
      from = new Date(); from.setHours(0, 0, 0, 0);
    } else if (period === '7d') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '90d') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Önceki dönem (karşılaştırma için)
  const duration = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - duration);
  const prevTo = new Date(from.getTime() - 1);

  return { from, to, prevFrom, prevTo };
}

// ============================================================
// GENEL BAKIŞ (Overview KPI'lar)
// ============================================================
router.get('/overview', protect, admin, async (req, res) => {
  try {
    const { from, to, prevFrom, prevTo } = getDateRange(req);

    // Mevcut dönem
    const [currentOrders, prevOrders, currentCustomers, prevCustomers] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 }, avgOrder: { $avg: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: prevFrom, $lte: prevTo }, paymentStatus: 'paid' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 }, avgOrder: { $avg: '$totalAmount' } } }
      ]),
      User.countDocuments({ role: 'customer', createdAt: { $gte: from, $lte: to } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: prevFrom, $lte: prevTo } })
    ]);

    const curr = currentOrders[0] || { revenue: 0, count: 0, avgOrder: 0 };
    const prev = prevOrders[0] || { revenue: 0, count: 0, avgOrder: 0 };

    const pctChange = (curr_val, prev_val) => {
      if (prev_val === 0) return curr_val > 0 ? 100 : 0;
      return Math.round(((curr_val - prev_val) / prev_val) * 100);
    };

    res.json({
      revenue: { value: curr.revenue, change: pctChange(curr.revenue, prev.revenue) },
      orders: { value: curr.count, change: pctChange(curr.count, prev.count) },
      avgOrder: { value: curr.avgOrder, change: pctChange(curr.avgOrder, prev.avgOrder) },
      newCustomers: { value: currentCustomers, change: pctChange(currentCustomers, prevCustomers) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// SATIŞ ANALİZİ
// ============================================================
router.get('/sales', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    // Granularity desteği: daily (varsayılan), weekly, monthly
    const granularity = req.query.granularity || 'daily';
    let dateFormat = '%Y-%m-%d';
    if (granularity === 'weekly') {
      dateFormat = '%Y-W%V';
    } else if (granularity === 'monthly') {
      dateFormat = '%Y-%m';
    }

    const [trend, statusDist, paymentDist] = await Promise.all([
      // Gelir trendi (granularity'ye göre)
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'paid' } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Sipariş durum dağılımı
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Ödeme durum dağılımı
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
      ])
    ]);

    // İade verileri
    const refunds = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'refunded' } },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } }
    ]);
    const refundData = refunds[0] || { count: 0, amount: 0 };

    res.json({
      trend: { labels: trend.map(t => t._id), revenue: trend.map(t => t.revenue), orders: trend.map(t => t.count) },
      statusDistribution: statusDist.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      paymentDistribution: paymentDist.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
      refunds: { count: refundData.count, amount: refundData.amount }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// SATIŞ HUNİSİ
// ============================================================
router.get('/sales-funnel', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const funnel = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]);

    const statusMap = {};
    funnel.forEach(f => { statusMap[f._id] = { count: f.count, revenue: f.revenue }; });

    const total = funnel.reduce((sum, f) => sum + f.count, 0);
    const steps = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];
    const funnelData = steps.map(step => ({
      status: step,
      count: statusMap[step]?.count || 0,
      revenue: statusMap[step]?.revenue || 0,
      percentage: total > 0 ? Math.round(((statusMap[step]?.count || 0) / total) * 100) : 0
    }));

    res.json({
      funnel: funnelData,
      cancelled: statusMap.cancelled || { count: 0, revenue: 0 },
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// ÜRÜN PERFORMANSI
// ============================================================
router.get('/products', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [topSelling, velocity, categoryDist] = await Promise.all([
      // En çok satan ürünler
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, name: { $first: '$items.name' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 10 }
      ]),
      // Stok devir hızı
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: {
          name: '$product.name', stock: '$product.stock', totalSold: 1,
          velocity: { $cond: [{ $gt: ['$product.stock', 0] }, { $divide: ['$totalSold', '$product.stock'] }, 0] },
          agingDays: { $divide: [{ $subtract: [new Date(), '$product.createdAt'] }, 86400000] }
        }},
        { $sort: { velocity: -1 } },
        { $limit: 20 }
      ]),
      // Kategori bazlı satış
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productData' } },
        { $unwind: '$productData' },
        { $lookup: { from: 'categories', localField: 'productData.category', foreignField: '_id', as: 'categoryData' } },
        { $unwind: '$categoryData' },
        { $group: { _id: '$categoryData._id', name: { $first: '$categoryData.name' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, totalQty: { $sum: '$items.quantity' } } },
        { $sort: { totalRevenue: -1 } }
      ])
    ]);

    // En az satan ürünler (aktif ama satılmayan)
    const soldProductIds = topSelling.map(p => p._id);
    const leastSelling = await Product.find({ active: true, _id: { $nin: soldProductIds } })
      .select('name stock createdAt')
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    res.json({
      topSelling,
      leastSelling: leastSelling.map(p => ({
        ...p,
        agingDays: Math.round((Date.now() - new Date(p.createdAt).getTime()) / 86400000)
      })),
      velocity,
      categoryDistribution: categoryDist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// ÜRÜN BİRLİKTELİK (Affinity / Cross-sell)
// ============================================================
router.get('/products/affinity', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    // Birlikte sipariş edilen ürün çiftleri
    const orders = await Order.find({
      createdAt: { $gte: from, $lte: to },
      paymentStatus: 'paid',
      'items.1': { $exists: true } // En az 2 ürün olan siparişler
    }).select('items.product items.name').lean();

    const pairCount = {};
    for (const order of orders) {
      const items = order.items;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const ids = [items[i].product.toString(), items[j].product.toString()].sort();
          const key = ids.join('|');
          if (!pairCount[key]) {
            pairCount[key] = {
              product1: { id: ids[0], name: items[i].name },
              product2: { id: ids[1], name: items[j].name },
              count: 0
            };
          }
          pairCount[key].count++;
        }
      }
    }

    const pairs = Object.values(pairCount).sort((a, b) => b.count - a.count).slice(0, 10);

    res.json({ pairs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// MÜŞTERİ ANALİZİ
// ============================================================
router.get('/customers', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const [newCustomersTrend, topCustomers, cityDist, repeatRate] = await Promise.all([
      // Aylık yeni müşteri trendi
      User.aggregate([
        { $match: { role: 'customer', createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // En değerli müşteriler (LTV)
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', email: '$user.email', totalSpent: 1, orderCount: 1 } }
      ]),
      // Şehir bazlı dağılım
      User.aggregate([
        { $match: { role: 'customer', 'address.city': { $exists: true, $ne: '' } } },
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Tekrar eden müşteri oranı
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$user', orderCount: { $sum: 1 } } },
        { $group: { _id: null, total: { $sum: 1 }, repeat: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } } } }
      ])
    ]);

    const rr = repeatRate[0] || { total: 0, repeat: 0 };

    res.json({
      newCustomersTrend: { labels: newCustomersTrend.map(n => n._id), data: newCustomersTrend.map(n => n.count) },
      topCustomers,
      cityDistribution: { labels: cityDist.map(c => c._id), data: cityDist.map(c => c.count) },
      repeatRate: { total: rr.total, repeat: rr.repeat, percentage: rr.total > 0 ? Math.round((rr.repeat / rr.total) * 100) : 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// SEPET ANALİZİ
// ============================================================
router.get('/basket', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);

    const basket = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'paid' } },
      { $project: { itemCount: { $size: '$items' }, totalAmount: 1 } },
      { $group: { _id: null, avgItems: { $avg: '$itemCount' }, avgAmount: { $avg: '$totalAmount' }, totalOrders: { $sum: 1 } } }
    ]);

    const b = basket[0] || { avgItems: 0, avgAmount: 0, totalOrders: 0 };

    res.json({
      avgItems: Math.round(b.avgItems * 10) / 10,
      avgAmount: Math.round(b.avgAmount * 100) / 100,
      totalOrders: b.totalOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// YORUM ÖZETİ
// ============================================================
router.get('/reviews-summary', protect, admin, async (req, res) => {
  try {
    const [statusDist, avgTrend, topReviewed] = await Promise.all([
      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 12 }
      ]),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$product', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', count: 1, avgRating: 1 } }
      ])
    ]);

    const photoCount = await Review.countDocuments({ status: 'approved', 'mediaUrls.0': { $exists: true } });
    const totalApproved = await Review.countDocuments({ status: 'approved' });

    res.json({
      distribution: statusDist.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      ratingTrend: { labels: avgTrend.map(a => a._id), data: avgTrend.map(a => Math.round(a.avgRating * 10) / 10) },
      topReviewed,
      photoRate: totalApproved > 0 ? Math.round((photoCount / totalApproved) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// KUPON ÖZETİ
// ============================================================
router.get('/coupons-summary', protect, admin, async (req, res) => {
  try {
    const [sourceDist, stats] = await Promise.all([
      Coupon.aggregate([
        { $group: { _id: '$source', total: { $sum: 1 }, used: { $sum: { $cond: [{ $gt: ['$usedCount', 0] }, 1, 0] } } } }
      ]),
      Coupon.aggregate([
        { $group: { _id: null, total: { $sum: 1 }, used: { $sum: { $cond: [{ $gt: ['$usedCount', 0] }, 1, 0] } }, active: { $sum: { $cond: ['$active', 1, 0] } } } }
      ])
    ]);

    const s = stats[0] || { total: 0, used: 0, active: 0 };

    res.json({
      total: s.total,
      used: s.used,
      active: s.active,
      conversionRate: s.total > 0 ? Math.round((s.used / s.total) * 100) : 0,
      sourceDistribution: sourceDist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// ARAMA ÖZETİ
// ============================================================
router.get('/search-summary', protect, admin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [topTerms, failedSearches, dailyTrend] = await Promise.all([
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$normalizedTerm', term: { $first: '$term' }, count: { $sum: 1 }, avgResults: { $avg: '$resultCount' } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, resultCount: 0 } },
        { $group: { _id: '$normalizedTerm', term: { $first: '$term' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      topTerms,
      failedSearches,
      dailyTrend: { labels: dailyTrend.map(d => d._id), data: dailyTrend.map(d => d.count) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// ŞEHİR BAZLI GELİR
// ============================================================
// Şehir bazlı gelir
router.get('/city-revenue', protect, admin, async (req, res) => {
  try {
    const { from, to } = getDateRange(req);
    const cities = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, paymentStatus: 'paid' } },
      { $group: {
        _id: '$shippingAddress.city',
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 15 }
    ]);
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// EXCEL EXPORT
// ============================================================
router.get('/export/:type', protect, admin, async (req, res) => {
  try {
    const { type } = req.params;
    const { from, to } = getDateRange(req);
    let data = [];
    let sheetName = 'Report';

    if (type === 'sales') {
      sheetName = 'Satis Raporu';
      const orders = await Order.find({ createdAt: { $gte: from, $lte: to } })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .lean();

      data = orders.map(o => ({
        'Siparis No': o._id.toString().slice(-8),
        'Tarih': new Date(o.createdAt).toLocaleDateString('tr-TR'),
        'Musteri': o.user?.name || '-',
        'Tutar': o.totalAmount,
        'Kargo': o.shippingCost,
        'Durum': o.status,
        'Odeme': o.paymentStatus,
        'Urun Sayisi': o.items.length
      }));
    } else if (type === 'products') {
      sheetName = 'Urun Raporu';
      const products = await Product.find({ active: true })
        .populate('category', 'name')
        .sort({ stock: 1 })
        .lean();

      data = products.map(p => ({
        'Urun Adi': p.name?.tr || p.name?.en || '-',
        'Kategori': p.category?.name?.tr || '-',
        'Fiyat': p.price,
        'Indirimli Fiyat': p.salePrice || '-',
        'Stok': p.stock,
        'Puan': p.rating,
        'Yorum Sayisi': p.reviewCount
      }));
    } else if (type === 'customers') {
      sheetName = 'Musteri Raporu';
      const customers = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 }, lastOrder: { $max: '$createdAt' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { totalSpent: -1 } }
      ]);

      data = customers.map(c => ({
        'Ad': c.user.name,
        'E-posta': c.user.email,
        'Toplam Harcama': c.totalSpent,
        'Siparis Sayisi': c.orderCount,
        'Son Siparis': new Date(c.lastOrder).toLocaleDateString('tr-TR'),
        'Sehir': c.user.address?.city || '-'
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
