const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Kayıt
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Giriş
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mevcut kullanıcı bilgisi
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// Profil güncelleme
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google ile giriş
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential gerekli' });
    }

    const settings = await Settings.findOne();
    const googleConfig = settings?.oauthConfig?.google;
    if (!googleConfig || !googleConfig.enabled || !googleConfig.clientId) {
      return res.status(400).json({ message: 'Google giriş aktif değil' });
    }

    const client = new OAuth2Client(googleConfig.clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleConfig.clientId
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Mevcut kullanıcıya googleId ekle
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      // Yeni kullanıcı oluştur (şifresiz)
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        avatar: picture || ''
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('[Google Auth] Hata:', error.message);
    res.status(401).json({ message: 'Google doğrulama başarısız' });
  }
});

// Google client ID'yi public olarak döndür
router.get('/google-client-id', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const googleConfig = settings?.oauthConfig?.google;
    if (googleConfig && googleConfig.enabled && googleConfig.clientId) {
      res.json({ clientId: googleConfig.clientId, enabled: true });
    } else {
      res.json({ clientId: '', enabled: false });
    }
  } catch {
    res.json({ clientId: '', enabled: false });
  }
});

// Checkout kayıt — e-posta ile kullanıcı bul veya oluştur
router.post('/checkout-register', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'E-posta gerekli' });
    }

    const settings = await Settings.findOne();
    const smsEnabled = !!(settings && settings.whatsapp && settings.whatsapp.enabled);

    let user = await User.findOne({ email: email.toLowerCase() });
    let isNew = false;

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: email.split('@')[0],
        email: email.toLowerCase(),
        password: randomPassword
      });
      isNew = true;
    }

    // SMS kapalıysa otomatik e-posta doğrulama kodu gönder
    if (!smsEnabled) {
      const code = generateOtpCode();
      await Otp.deleteMany({ email: email.toLowerCase(), type: 'email' });
      await Otp.create({
        email: email.toLowerCase(),
        code,
        type: 'email',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      });

      // Nodemailer ile gönder
      try {
        const nodemailer = require('nodemailer');
        const smtp = settings?.notificationSettings?.smtp || {};
        if (smtp.host && smtp.user) {
          const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port || 587,
            secure: (smtp.port || 587) === 465,
            auth: { user: smtp.user, pass: smtp.pass }
          });
          await transporter.sendMail({
            from: smtp.user,
            to: email,
            subject: 'DB Line - Doğrulama Kodu',
            html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
              <h2 style="text-align:center;">Doğrulama Kodu</h2>
              <p style="text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0;">${code}</p>
              <p style="text-align:center;color:#666;">Bu kod 8 saat geçerlidir.</p>
            </div>`
          });
        }
      } catch (mailErr) {
        console.error('[Email] Doğrulama kodu gönderim hatası:', mailErr.message);
      }
    }

    res.json({
      userId: user._id,
      isNew,
      smsEnabled,
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SMS ile OTP gönder
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ message: 'E-posta ve telefon gerekli' });
    }

    const code = generateOtpCode();
    await Otp.deleteMany({ email: email.toLowerCase(), type: 'sms' });
    await Otp.create({
      email: email.toLowerCase(),
      phone,
      code,
      type: 'sms',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Kullanıcının telefonunu güncelle
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { phone }
    );

    // WhatsApp servisi ile gönder
    const whatsappService = require('../services/whatsappService');
    const result = await whatsappService.sendMessage(phone, `DB Line doğrulama kodunuz: ${code}`);

    if (result.success) {
      res.json({ success: true });
    } else {
      res.json({ success: true, simulated: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// OTP doğrula
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'E-posta ve kod gerekli' });
    }

    const otp = await Otp.findOne({
      email: email.toLowerCase(),
      code,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş doğrulama kodu' });
    }

    otp.verified = true;
    await otp.save();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// E-posta doğrulama kodu tekrar gönder
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'E-posta gerekli' });
    }

    const code = generateOtpCode();
    const otpType = type || 'email';
    const otpExpiry = otpType === 'email'
      ? new Date(Date.now() + 8 * 60 * 60 * 1000)   // 8 saat
      : new Date(Date.now() + 5 * 60 * 1000);        // 5 dakika
    await Otp.deleteMany({ email: email.toLowerCase(), type: otpType });
    await Otp.create({
      email: email.toLowerCase(),
      code,
      type: otpType,
      expiresAt: otpExpiry
    });

    if (otpType === 'email') {
      try {
        const nodemailer = require('nodemailer');
        const settings = await Settings.findOne();
        const smtp = settings?.notificationSettings?.smtp || {};
        if (smtp.host && smtp.user) {
          const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port || 587,
            secure: (smtp.port || 587) === 465,
            auth: { user: smtp.user, pass: smtp.pass }
          });
          await transporter.sendMail({
            from: smtp.user,
            to: email,
            subject: 'DB Line - Doğrulama Kodu',
            html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
              <h2 style="text-align:center;">Doğrulama Kodu</h2>
              <p style="text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0;">${code}</p>
              <p style="text-align:center;color:#666;">Bu kod 8 saat geçerlidir.</p>
            </div>`
          });
        }
      } catch (mailErr) {
        console.error('[Email] Doğrulama kodu gönderim hatası:', mailErr.message);
      }
    } else if (otpType === 'sms') {
      const { phone } = req.body;
      if (phone) {
        const whatsappService = require('../services/whatsappService');
        await whatsappService.sendMessage(phone, `DB Line doğrulama kodunuz: ${code}`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
