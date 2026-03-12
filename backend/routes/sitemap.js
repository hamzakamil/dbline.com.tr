const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');

const router = express.Router();

const SITE_URL = 'https://dbline.com.tr';

/**
 * Dinamik sitemap.xml üretimi
 * Tüm aktif ürün ve kategorileri içerir
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ active: true }).select('slug updatedAt').lean(),
      Category.find({ active: true }).select('slug updatedAt').lean()
    ]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Ana sayfa
    xml += buildUrl(SITE_URL + '/', 'daily', '1.0');

    // Tüm ürünler sayfası
    xml += buildUrl(SITE_URL + '/products', 'daily', '0.9');

    // Statik sayfalar
    const staticPages = [
      { path: '/about', freq: 'monthly', priority: '0.6' },
      { path: '/contact', freq: 'monthly', priority: '0.6' },
      { path: '/privacy-policy', freq: 'yearly', priority: '0.3' },
      { path: '/refund-policy', freq: 'yearly', priority: '0.3' },
      { path: '/shipping-policy', freq: 'yearly', priority: '0.3' },
      { path: '/terms-of-service', freq: 'yearly', priority: '0.3' },
    ];

    for (const page of staticPages) {
      xml += buildUrl(SITE_URL + page.path, page.freq, page.priority);
    }

    // Kategoriler
    for (const cat of categories) {
      const lastmod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split('T')[0] : '';
      xml += buildUrl(SITE_URL + '/category/' + cat.slug, 'weekly', '0.8', lastmod);
    }

    // Ürünler
    for (const product of products) {
      const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : '';
      xml += buildUrl(SITE_URL + '/products/' + product.slug, 'weekly', '0.7', lastmod);
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 saat cache
    res.send(xml);
  } catch (error) {
    console.error('Sitemap hatası:', error);
    res.status(500).send('Sitemap oluşturulamadı');
  }
});

function buildUrl(loc, changefreq, priority, lastmod) {
  let xml = '  <url>\n';
  xml += `    <loc>${loc}</loc>\n`;
  if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>\n';
  return xml;
}

module.exports = router;
