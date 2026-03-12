const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'İsim gerekli'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-posta gerekli'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    district: String,
    zipCode: String,
    country: { type: String, default: 'Türkiye' }
  },
  // Bildirim Tercihleri
  notifications: {
    // Bildirim Kanalları
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    whatsappNumber: { type: String, trim: true },
    // Bildirim Türleri
    preferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      priceDrops: { type: Boolean, default: false },
      stockAlerts: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: false }
    }
  },
  // Zaman Damgası Tercihi
  timestampPreference: {
    scope: { type: String, enum: ['all', 'specific'], default: 'all' },
    specificDocuments: [{
      type: String,
      enum: ['order', 'invoice', 'shipping']
    }]
  }
}, {
  timestamps: true
});

// Şifre hash'leme
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre karşılaştırma
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
