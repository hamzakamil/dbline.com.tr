const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    tr: { type: String, required: true },
    en: { type: String, required: true }
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  image: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  // Alt kategori desteği
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  // Kategori açıklaması
  description: {
    tr: { type: String, default: '' },
    en: { type: String, default: '' }
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
  // Kategori sayfası alt SEO metni
  seoText: {
    tr: { type: String, default: '' },
    en: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
