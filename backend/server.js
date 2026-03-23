const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config({ path: process.env.NODE_ENV === 'local' ? '.env.local' : '.env' });

const connectDB = require('./config/db');

const app = express();

// DB bağlantısı (async)
const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('⚠️ DB bağlantısı başarısız, API devam ediyor (sadece statik rotalar çalışacak)');
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
  });
};

startServer();

// Compression middleware

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyalar (yüklenen resimler) - cache headers ile
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d',
  immutable: true,
  etag: true
}));

// SEO: Dinamik sitemap.xml
app.use('/', require('./routes/sitemap'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/shipments', require('./routes/shipments'));

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DB Line API çalışıyor' });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('🚨 Global Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Sunucu hatası' 
      : err.message
  });
});
