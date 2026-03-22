const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    serverSelectionTimeoutMS: 10000, // 10s timeout
    socketTimeoutMS: 45000,
    bufferCommands: false,
    retryWrites: true,
    w: 'majority'
  };

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB bağlandı: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB bağlantısı kesildi');
  });

  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('🚀 MongoDB başarıyla bağlandı!');
      return;
    } catch (error) {
      retries -= 1;
      console.error(`Bağlantı denemesi ${6-retries}/5 başarısız:`, error.message);
      if (!retries) {
        console.error('❌ Tüm bağlantı denemeleri başarısız. Sunucu devam edecek ama DB yok.');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s bekle
    }
  }
};

module.exports = connectDB;
