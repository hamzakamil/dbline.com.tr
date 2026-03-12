const express = require('express');
const slugify = require('slugify');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Tüm kategoriler
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kategori ekle (Admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const slug = slugify(req.body.name.tr, { lower: true, strict: true });
    const category = await Category.create({ ...req.body, slug });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kategori güncelle (Admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    if (req.body.name && req.body.name.tr) {
      req.body.slug = slugify(req.body.name.tr, { lower: true, strict: true });
    }
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kategori sil (Admin) - alt kategorileri de siler
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı' });
    }
    // Alt kategorileri de sil
    await Category.deleteMany({ parent: req.params.id });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
