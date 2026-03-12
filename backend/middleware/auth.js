const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT doğrulama
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkilendirme gerekli' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    try {
      req.user = await User.findById(decoded.id).select('-password');
    } catch (dbError) {
      return res.status(500).json({ message: 'Veritabanı bağlantı hatası' });
    }
    if (!req.user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token süresi dolmuş, tekrar giriş yapın' });
    }
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Admin kontrolü
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
};

module.exports = { protect, admin };
