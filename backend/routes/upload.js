const express = require('express');
const { upload, processImage } = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Tekli resim yükleme (WebP dönüşümü + responsive boyutlar)
router.post('/', protect, admin, upload.single('image'), processImage, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Dosya yüklenmedi' });
  }
  res.json({
    url: req.file.processedUrl || `/uploads/${req.file.filename}`,
    sizes: req.file.processedSizes || {},
    filename: req.file.filename
  });
});

// Çoklu resim yükleme (max 5)
router.post('/multiple', protect, admin, upload.array('images', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Dosya yüklenmedi' });
  }

  const sharp = require('sharp');
  const path = require('path');
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../uploads');

  const urls = [];
  for (const file of req.files) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${uniqueSuffix}.webp`;
    const filePath = path.join(uploadsDir, fileName);

    try {
      await sharp(file.buffer)
        .resize(1920, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(filePath);

      urls.push({
        url: `/uploads/${fileName}`,
        filename: fileName
      });
    } catch (err) {
      // Fallback: orijinal kaydet
      const fallbackName = `${uniqueSuffix}${path.extname(file.originalname)}`;
      fs.writeFileSync(path.join(uploadsDir, fallbackName), file.buffer);
      urls.push({
        url: `/uploads/${fallbackName}`,
        filename: fallbackName
      });
    }
  }

  res.json(urls);
});

module.exports = router;
