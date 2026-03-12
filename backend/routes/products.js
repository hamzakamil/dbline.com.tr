const express = require('express');
const slugify = require('slugify');
const Product = require('../models/Product');
const Category = require('../models/Category');
const SearchLog = require('../models/SearchLog');
const Settings = require('../models/Settings');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Türkçe karakter normalizasyonu (fuzzy search)
function normalizeTurkish(str) {
  return str
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/Ç/g, 'c').replace(/Ğ/g, 'g').replace(/İ/g, 'i')
    .replace(/Ö/g, 'o').replace(/Ş/g, 's').replace(/Ü/g, 'u');
}

// Akıllı Arama - search-as-you-type
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ products: [], categories: [], total: 0 });
    }

    const term = q.trim();
    const normalized = normalizeTurkish(term);

    // Regex ile hem orijinal hem normalize arama
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexOriginal = new RegExp(escapeRegex(term), 'i');
    const regexNormalized = new RegExp(escapeRegex(normalized), 'i');

    // Ürün arama
    const productQuery = {
      active: true,
      $or: [
        { 'name.tr': regexOriginal },
        { 'name.en': regexOriginal },
        { 'description.tr': regexOriginal },
        { 'description.en': regexOriginal },
        { tags: regexOriginal }
      ]
    };

    const total = await Product.countDocuments(productQuery);
    const products = await Product.find(productQuery)
      .select('name slug images price salePrice category')
      .populate('category', 'name slug')
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Kategori eşleşmesi
    const categories = await Category.find({
      active: true,
      $or: [
        { 'name.tr': regexOriginal },
        { 'name.en': regexOriginal }
      ]
    }).select('name slug image').limit(5);

    // Arama logla
    SearchLog.create({
      term,
      normalizedTerm: normalized,
      resultCount: total,
      userId: req.user?._id
    }).catch(() => {});

    res.json({
      products,
      categories,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Popüler aramalar
router.get('/search/popular', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const manualPopular = settings?.searchConfig?.popularSearches || [];

    if (manualPopular.length > 0 && !settings?.searchConfig?.autoPopular) {
      return res.json({ popular: manualPopular });
    }

    // Otomatik popüler: Son 30 günde en çok aranan terimler
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const autoPopular = await SearchLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, resultCount: { $gt: 0 } } },
      { $group: { _id: '$normalizedTerm', term: { $first: '$term' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: settings?.searchConfig?.maxSuggestions || 8 }
    ]);

    const popular = manualPopular.length > 0
      ? [...manualPopular, ...autoPopular.map(a => a.term)].slice(0, 8)
      : autoPopular.map(a => a.term);

    res.json({ popular });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tüm ürünleri getir (filtreleme + sayfalama)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12, featured } = req.query;
    const query = { active: true };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { 'name.tr': { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name') sortOption = { 'name.tr': 1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tek ürün getir (slug veya ID ile)
router.get('/:slugOrId', async (req, res) => {
  try {
    const param = req.params.slugOrId;
    let product;
    // MongoDB ObjectId formatında mı kontrol et
    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(param).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: param, active: true }).populate('category', 'name slug');
    }
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ürün ekle (Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const slug = slugify(req.body.name.tr, { lower: true, strict: true });
    const product = await Product.create({ ...req.body, slug });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ürün güncelle (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    if (req.body.name && req.body.name.tr) {
      req.body.slug = slugify(req.body.name.tr, { lower: true, strict: true });
    }
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ürün sil (Admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
