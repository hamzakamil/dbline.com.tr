const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');
const { getProductRatingStats, updateProductRating } = require('../services/reviewService');
const whatsappService = require('../services/whatsappService');

// --- Admin Endpoints (ÖNCE tanımlanmalı, /:productId yakalamadan) ---

// GET /api/reviews/admin/pending - Onay bekleyen yorumlar
router.get('/admin/pending', protect, admin, async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'pending' })
      .populate('product', 'name slug images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const stats = {
      pending: await Review.countDocuments({ status: 'pending' }),
      approved: await Review.countDocuments({ status: 'approved' }),
      rejected: await Review.countDocuments({ status: 'rejected' }),
      total: await Review.countDocuments()
    };

    res.json({ reviews, stats });
  } catch (error) {
    res.status(500).json({ message: 'Yorumlar yüklenemedi' });
  }
});

// GET /api/reviews/admin/all - Tüm yorumlar
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name slug images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Yorumlar yüklenemedi' });
  }
});

// PUT /api/reviews/admin/:id/approve
router.put('/admin/:id/approve', protect, admin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!review) return res.status(404).json({ message: 'Yorum bulunamadı' });

    await updateProductRating(review.product);

    if (review.notifyOnPublish && review.whatsappNumber) {
      await whatsappService.sendMessage(review.whatsappNumber, 'Yorumunuz yayınlandı! Teşekkürler. - DB Line');
    }

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: 'Onaylama başarısız' });
  }
});

// PUT /api/reviews/admin/:id/reject
router.put('/admin/:id/reject', protect, admin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!review) return res.status(404).json({ message: 'Yorum bulunamadı' });

    await updateProductRating(review.product);
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: 'Reddetme başarısız' });
  }
});

// PUT /api/reviews/admin/:id/reply - Admin yanıtı ekle
router.put('/admin/:id/reply', protect, admin, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Yanıt metni gerekli' });

    const review = await Review.findByIdAndUpdate(req.params.id, {
      adminReply: { text, repliedAt: new Date() }
    }, { new: true });

    if (!review) return res.status(404).json({ message: 'Yorum bulunamadı' });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: 'Yanıt eklenemedi' });
  }
});

// --- Public Endpoints ---

// GET /api/reviews/:productId - Ürün yorumlarını listele
router.get('/:productId', async (req, res) => {
  try {
    const { sort, filter } = req.query;
    const productId = new mongoose.Types.ObjectId(req.params.productId);

    const query = { product: productId, status: 'approved' };

    if (filter === 'photos') {
      query.mediaUrls = { $exists: true, $not: { $size: 0 } };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
    if (sort === 'lowest') sortOption = { rating: 1, createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

    const reviews = await Review.find(query)
      .populate('user', 'name')
      .sort(sortOption)
      .limit(50);

    const stats = await getProductRatingStats(productId);

    res.json({ reviews, stats });
  } catch (error) {
    console.error('Yorum listeleme hatası:', error);
    res.status(500).json({ message: 'Yorumlar yüklenemedi' });
  }
});

// POST /api/reviews/:productId - Yorum ekle
router.post('/:productId', async (req, res) => {
  try {
    const { rating, title, comment, mediaUrls, guestName, guestEmail, notifyOnPublish, whatsappOptIn, whatsappNumber } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Puan ve yorum gerekli' });
    }

    // Auth kontrolü - token varsa kullanıcı, yoksa misafir
    let userId = null;
    let isVerifiedBuyer = false;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;

        // Doğrulanmış alıcı mı kontrol et
        const orderExists = await Order.findOne({
          user: userId,
          'items.product': req.params.productId,
          status: { $in: ['delivered', 'completed'] }
        });
        isVerifiedBuyer = !!orderExists;
      } catch (e) {
        // Token geçersiz, misafir olarak devam
      }
    }

    const settings = await Settings.findOne();
    const requireApproval = settings?.reviewConfig?.requireApproval !== false;

    const review = await Review.create({
      product: req.params.productId,
      user: userId,
      guestName: userId ? undefined : guestName,
      guestEmail: userId ? undefined : guestEmail,
      rating,
      title,
      comment,
      mediaUrls: mediaUrls || [],
      isVerifiedBuyer,
      notifyOnPublish: notifyOnPublish || false,
      whatsappOptIn: whatsappOptIn || false,
      whatsappNumber: whatsappNumber || '',
      status: requireApproval ? 'pending' : 'approved'
    });

    // Onay gerekmiyorsa ürün puanını güncelle
    if (!requireApproval) {
      await updateProductRating(new mongoose.Types.ObjectId(req.params.productId));
    }

    // Admin'e bildirim
    if (settings?.reviewConfig?.notifyAdminOnNewReview) {
      const adminPhone = settings?.whatsapp?.phoneNumber;
      if (adminPhone) {
        const name = userId ? 'Kayıtlı kullanıcı' : (guestName || 'Misafir');
        await whatsappService.sendMessage(adminPhone, `Yeni yorum: ${name} ${rating} yıldız verdi. "${comment.substring(0, 50)}..."`);
      }
    }

    res.status(201).json({
      success: true,
      review,
      message: requireApproval ? 'Yorumunuz onay bekliyor' : 'Yorumunuz yayınlandı'
    });
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    res.status(500).json({ message: 'Yorum eklenemedi' });
  }
});

// POST /api/reviews/:reviewId/helpful - Faydalı bul
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Yorum bulunamadı' });

    review.helpfulCount += 1;
    await review.save();

    res.json({ success: true, helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).json({ message: 'İşlem başarısız' });
  }
});

module.exports = router;
