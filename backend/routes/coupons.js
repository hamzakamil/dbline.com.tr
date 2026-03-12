const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DBWP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

// POST /api/coupons/generate-whatsapp - Popup'tan kupon oluştur
router.post('/generate-whatsapp', async (req, res) => {
  try {
    const { name, surname, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Ad ve telefon numarası gerekli' });
    }

    // Aynı telefon numarasıyla daha önce oluşturulmuş aktif kupon var mı?
    const existingCoupon = await Coupon.findOne({
      'assignedTo.phone': phone,
      source: 'whatsapp_popup',
      active: true,
      expiresAt: { $gt: new Date() }
    });

    if (existingCoupon) {
      return res.json({
        success: true,
        couponCode: existingCoupon.code,
        message: 'Mevcut kupon kodunuz',
        alreadyExists: true
      });
    }

    // Settings'ten indirim ayarlarını al
    const settings = await Settings.findOne();
    const discountPercent = settings?.marketingPopup?.discountPercent || 10;
    const validDays = settings?.marketingPopup?.couponValidDays || 7;
    const minOrder = settings?.marketingPopup?.minOrderAmount || 0;

    // Benzersiz kupon kodu oluştur
    let code;
    let attempts = 0;
    do {
      code = generateCouponCode();
      attempts++;
    } while (await Coupon.findOne({ code }) && attempts < 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    const coupon = await Coupon.create({
      code,
      discountType: 'percentage',
      discountValue: discountPercent,
      minOrderAmount: minOrder,
      maxUses: 1,
      assignedTo: {
        name: `${name} ${surname || ''}`.trim(),
        phone,
        email: email || ''
      },
      source: 'whatsapp_popup',
      expiresAt
    });

    // Kullanıcı kayıtlıysa WhatsApp bildirim tercihini güncelle
    if (email) {
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            'notifications.whatsapp': true,
            'notifications.whatsappNumber': phone
          }
        }
      );
    }

    // WhatsApp mesajı gönder
    const expiryStr = expiresAt.toLocaleDateString('tr-TR');
    await whatsappService.sendWelcomeMessage(phone, name, code, discountPercent, expiryStr);

    res.json({
      success: true,
      couponCode: code,
      discountPercent,
      expiresAt: expiryStr,
      message: 'Kupon kodunuz oluşturuldu ve WhatsApp ile gönderildi'
    });
  } catch (error) {
    console.error('Kupon oluşturma hatası:', error);
    res.status(500).json({ message: 'Kupon oluşturulamadı' });
  }
});

// GET /api/coupons/validate/:code - Kupon geçerliliğini kontrol et
router.get('/validate/:code', async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Kupon bulunamadı' });
    }

    if (!coupon.isValid()) {
      let reason = 'Kupon geçersiz';
      if (!coupon.active) reason = 'Kupon deaktif edilmiş';
      else if (coupon.expiresAt <= new Date()) reason = 'Kupon süresi dolmuş';
      else if (coupon.usedCount >= coupon.maxUses) reason = 'Kupon kullanım limiti dolmuş';
      return res.json({ valid: false, message: reason });
    }

    res.json({
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      expiresAt: coupon.expiresAt
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Doğrulama hatası' });
  }
});

// POST /api/coupons/apply - Kuponu siparişe uygula
router.post('/apply', protect, async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon || !coupon.isValid()) {
      return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş kupon' });
    }

    coupon.usedCount += 1;
    coupon.usedBy.push(req.user._id);
    await coupon.save();

    res.json({
      success: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      message: 'Kupon uygulandı'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Kupon uygulama hatası' });
  }
});

// --- Admin Endpoints ---

// GET /api/coupons/admin/list - Tüm kuponları listele
router.get('/admin/list', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(200);
    const stats = {
      total: await Coupon.countDocuments(),
      active: await Coupon.countDocuments({ active: true, expiresAt: { $gt: new Date() } }),
      used: await Coupon.countDocuments({ usedCount: { $gt: 0 } })
    };
    res.json({ coupons, stats });
  } catch (error) {
    res.status(500).json({ message: 'Kupon listesi alınamadı' });
  }
});

// POST /api/coupons/admin/create - Manuel kupon oluştur
router.post('/admin/create', protect, admin, async (req, res) => {
  try {
    const { discountType, discountValue, minOrderAmount, maxUses, expiresAt, assignedTo } = req.body;

    let code;
    let attempts = 0;
    do {
      code = generateCouponCode().replace('DBWP', 'DBMN');
      attempts++;
    } while (await Coupon.findOne({ code }) && attempts < 10);

    const coupon = await Coupon.create({
      code,
      discountType: discountType || 'percentage',
      discountValue: discountValue || 10,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || 1,
      assignedTo: assignedTo || {},
      source: 'manual',
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: 'Kupon oluşturulamadı' });
  }
});

// DELETE /api/coupons/admin/:id - Kupon sil
router.delete('/admin/:id', protect, admin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Kupon silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Kupon silinemedi' });
  }
});

module.exports = router;
