const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    tr: { type: String, required: true },
    en: { type: String, required: true }
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    tr: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  price: {
    type: Number,
    required: [true, 'Fiyat gerekli'],
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0,
    default: null
  },
  images: [{
    type: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  sizes: [{
    type: String
  }],
  colors: [{
    name: { tr: String, en: String },
    hex: String
  }],
  // Varyant seçenekleri (Tasarım, Desen, vb.)
  variants: [{
    label: { tr: { type: String }, en: { type: String } },
    options: [{
      name: { tr: { type: String }, en: { type: String } }
    }]
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // SEO Alanları
  metaTitle: {
    tr: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  metaDescription: {
    tr: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
