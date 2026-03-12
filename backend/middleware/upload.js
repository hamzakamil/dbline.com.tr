const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Multer: belleğe yükleme (sonra Sharp ile işlenecek)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * Sharp ile WebP dönüşümü + responsive boyutlar
 * Middleware: multer'dan sonra kullanılır
 */
async function processImage(req, res, next) {
  if (!req.file) return next();

  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const baseName = uniqueSuffix;

  try {
    const sizes = [
      { suffix: '-thumb', width: 300 },
      { suffix: '-medium', width: 600 },
      { suffix: '-large', width: 1200 },
      { suffix: '', width: 1920 }  // Orijinal (max genişlik)
    ];

    const results = {};

    for (const size of sizes) {
      const fileName = `${baseName}${size.suffix}.webp`;
      const filePath = path.join(uploadsDir, fileName);

      await sharp(req.file.buffer)
        .resize(size.width, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(filePath);

      results[size.suffix || '-original'] = `/uploads/${fileName}`;
    }

    // Ana URL (en büyük boyut)
    req.file.processedUrl = results['-original'];
    req.file.processedSizes = results;
    req.file.filename = `${baseName}.webp`;

    next();
  } catch (error) {
    console.error('Görsel işleme hatası:', error);
    // Fallback: orijinal dosyayı kaydet
    const fallbackName = `${baseName}${path.extname(req.file.originalname)}`;
    const fallbackPath = path.join(uploadsDir, fallbackName);
    fs.writeFileSync(fallbackPath, req.file.buffer);
    req.file.processedUrl = `/uploads/${fallbackName}`;
    req.file.filename = fallbackName;
    next();
  }
}

module.exports = { upload, processImage };
