const Settings = require('../models/Settings');
const Order = require('../models/Order');
const User = require('../models/User');
const whatsappService = require('./whatsappService');

let reportInterval = null;

async function generateReport(frequency) {
  const now = new Date();
  let from;

  if (frequency === 'daily') {
    from = new Date(now);
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
  } else {
    // weekly
    from = new Date(now);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
  }

  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  // Toplam gelir ve sipariş
  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
  ]);

  const revenue = revenueData[0]?.revenue || 0;
  const orderCount = revenueData[0]?.count || 0;

  // Yeni müşteri
  const newCustomers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: from, $lte: to }
  });

  // Bekleyen sipariş
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  // En çok satan 3 ürün
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' } } },
    { $sort: { totalQty: -1 } },
    { $limit: 3 },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$product.name.tr', 'Bilinmeyen'] }, qty: '$totalQty' } }
  ]);

  const periodLabel = frequency === 'daily' ? 'Günlük' : 'Haftalık';
  const topList = topProducts.map((p, i) => `  ${i + 1}. ${p.name} (${p.qty} adet)`).join('\n');

  const message = `📊 DB Line ${periodLabel} Rapor\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💰 Gelir: ₺${revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}\n` +
    `📦 Sipariş: ${orderCount}\n` +
    `👤 Yeni Müşteri: ${newCustomers}\n` +
    `⏳ Bekleyen Sipariş: ${pendingOrders}\n` +
    `\n🏆 En Çok Satan:\n${topList || '  Veri yok'}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📅 ${from.toLocaleDateString('tr-TR')} - ${to.toLocaleDateString('tr-TR')}`;

  return message;
}

async function sendScheduledReport() {
  try {
    const settings = await Settings.findOne();
    const schedule = settings?.reportSchedule;

    if (!schedule || !schedule.enabled || !schedule.whatsappNumber) {
      return;
    }

    const now = new Date();
    const [targetHour, targetMinute] = (schedule.sendTime || '09:00').split(':').map(Number);

    // Saat kontrolü (±5 dakika tolerans)
    if (now.getHours() !== targetHour || Math.abs(now.getMinutes() - targetMinute) > 5) {
      return;
    }

    // Haftalık ise sadece Pazartesi
    if (schedule.frequency === 'weekly' && now.getDay() !== 1) {
      return;
    }

    const message = await generateReport(schedule.frequency);
    const result = await whatsappService.sendMessage(schedule.whatsappNumber, message);
    console.log(`[ScheduledReport] ${schedule.frequency} rapor gönderildi:`, result.success ? 'Başarılı' : result.reason);
  } catch (error) {
    console.error('[ScheduledReport] Hata:', error.message);
  }
}

function startScheduler() {
  // Her dakika kontrol et
  reportInterval = setInterval(sendScheduledReport, 60 * 1000);
  console.log('[ScheduledReport] Zamanlayıcı başlatıldı');
}

function stopScheduler() {
  if (reportInterval) {
    clearInterval(reportInterval);
    reportInterval = null;
    console.log('[ScheduledReport] Zamanlayıcı durduruldu');
  }
}

module.exports = {
  generateReport,
  sendScheduledReport,
  startScheduler,
  stopScheduler
};
