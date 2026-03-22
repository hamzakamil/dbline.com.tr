const rateLimit = require('express-rate-limit');

// Login/register için IP bazlı limit (5dk'da 5 deneme)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 5,
  message: { success: false, message: 'Çok fazla istek. 5dk bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP için daha gevşek (5dk'da 10)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'OTP için çok fazla istek.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, otpLimiter };

