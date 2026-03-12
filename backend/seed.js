require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Settings = require('./models/Settings');

const seed = async () => {
  await connectDB();

  // Mevcut verileri temizle
  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Settings.deleteMany({});

  console.log('Eski veriler temizlendi');

  // Admin kullanıcı
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@dbline.com.tr',
    password: 'admin123',
    role: 'admin',
    phone: '+90 212 000 00 00'
  });
  console.log('Admin oluşturuldu: admin@dbline.com.tr / admin123');

  // Kategoriler
  const categories = await Category.insertMany([
    { name: { tr: 'Taytlar', en: 'Leggings' }, slug: 'taytlar', order: 1 },
    { name: { tr: 'Çoraplar', en: 'Socks' }, slug: 'coraplar', order: 2 },
    { name: { tr: 'Aksesuarlar', en: 'Accessories' }, slug: 'aksesuarlar', order: 3 },
    { name: { tr: 'İçecek', en: 'Drinks' }, slug: 'icecekler', order: 4 },
    { name: { tr: 'Takım', en: 'Sets' }, slug: 'takimlar', order: 5 },
    { name: { tr: 'Kolleksiyonu', en: 'Collection' }, slug: 'kolleksiyon', order: 6 },
    { name: { tr: 'Çantalar ve Daha Fazlası', en: 'Bags & More' }, slug: 'cantalar', order: 7 },
    { name: { tr: 'Kazaklar', en: 'Sweaters' }, slug: 'kazaklar', order: 8 }
  ]);
  console.log('Kategoriler oluşturuldu');

  const [taytlar, coraplar, aksesuarlar] = categories;

  // Ürünler
  const products = await Product.insertMany([
    // Taytlar
    {
      name: { tr: 'Yüksek Bel Spor Tayt', en: 'High Waist Sports Leggings' },
      slug: 'yuksek-bel-spor-tayt',
      description: {
        tr: 'Yüksek bel tasarımı ile karın bölgesini destekleyen, nefes alabilen kumaştan üretilmiş spor tayt. 4 yönlü esneklik özelliği ile hareket serbestisi sağlar.',
        en: 'High waist design sports leggings that support the abdomen, made from breathable fabric. 4-way stretch provides freedom of movement.'
      },
      price: 299,
      images: [],
      category: taytlar._id,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Lacivert', en: 'Navy' }, hex: '#1a237e' },
        { name: { tr: 'Gri', en: 'Gray' }, hex: '#757575' }
      ],
      stock: 50,
      featured: true,
      active: true,
      rating: 4.8,
      reviewCount: 24
    },
    {
      name: { tr: 'Pilates Taytı V-Kesim', en: 'Pilates V-Cut Leggings' },
      slug: 'pilates-tayti-v-kesim',
      description: {
        tr: 'V-kesim bel detayıyla şık görünüm sunan pilates taytı. Yumuşak ve esnek kumaş ile maximum konfor.',
        en: 'Pilates leggings with V-cut waist detail for a stylish look. Maximum comfort with soft and flexible fabric.'
      },
      price: 349,
      images: [],
      category: taytlar._id,
      sizes: ['XS', 'S', 'M', 'L'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Bordo', en: 'Burgundy' }, hex: '#800020' }
      ],
      stock: 35,
      featured: true,
      active: true,
      rating: 4.9,
      reviewCount: 18
    },
    {
      name: { tr: 'Termal Kışlık Tayt', en: 'Thermal Winter Leggings' },
      slug: 'termal-kislik-tayt',
      description: {
        tr: 'İçi tüylü termal kumaştan üretilmiş kışlık tayt. Soğuk havalarda sıcak tutar, spor ve günlük kullanıma uygun.',
        en: 'Winter leggings made from thermal fleece-lined fabric. Keeps warm in cold weather, suitable for sports and daily use.'
      },
      price: 399,
      salePrice: 349,
      images: [],
      category: taytlar._id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Antrasit', en: 'Anthracite' }, hex: '#383838' }
      ],
      stock: 40,
      featured: true,
      active: true,
      rating: 4.7,
      reviewCount: 31
    },
    {
      name: { tr: 'Push-Up Spor Tayt', en: 'Push-Up Sports Leggings' },
      slug: 'push-up-spor-tayt',
      description: {
        tr: 'Özel push-up kesimi ile bacak ve kalça hatlarını ön plana çıkaran spor tayt. Ter atma özellikli kumaş.',
        en: 'Sports leggings with special push-up cut that highlights leg and hip lines. Moisture-wicking fabric.'
      },
      price: 279,
      images: [],
      category: taytlar._id,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Haki', en: 'Khaki' }, hex: '#8B8000' },
        { name: { tr: 'Pembe', en: 'Pink' }, hex: '#E91E63' }
      ],
      stock: 60,
      featured: false,
      active: true,
      rating: 4.5,
      reviewCount: 15
    },
    {
      name: { tr: 'Yüksek Bel Cepli Tayt', en: 'High Waist Pocket Leggings' },
      slug: 'yuksek-bel-cepli-tayt',
      description: {
        tr: 'Yan cep detaylı yüksek bel tayt. Telefon ve anahtar taşımak için pratik cepler. Squat-proof kumaş.',
        en: 'High waist leggings with side pocket detail. Practical pockets for phone and keys. Squat-proof fabric.'
      },
      price: 329,
      images: [],
      category: taytlar._id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Lacivert', en: 'Navy' }, hex: '#1a237e' }
      ],
      stock: 45,
      featured: true,
      active: true,
      rating: 4.6,
      reviewCount: 22
    },

    // Çoraplar
    {
      name: { tr: 'Pilates Kavrama Çorabı', en: 'Pilates Grip Socks' },
      slug: 'pilates-kavrama-corabi',
      description: {
        tr: 'Taban kısmındaki silikon noktalar ile kayma önleyici pilates çorabı. Pamuklu kumaş ile konforlu kullanım.',
        en: 'Anti-slip pilates socks with silicone dots on the sole. Comfortable use with cotton fabric.'
      },
      price: 89,
      images: [],
      category: coraplar._id,
      sizes: ['S (35-37)', 'M (38-40)', 'L (41-43)'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Beyaz', en: 'White' }, hex: '#FFFFFF' },
        { name: { tr: 'Pembe', en: 'Pink' }, hex: '#F48FB1' }
      ],
      stock: 100,
      featured: true,
      active: true,
      rating: 4.9,
      reviewCount: 45
    },
    {
      name: { tr: 'Yoga Parmak Çorabı', en: 'Yoga Toe Socks' },
      slug: 'yoga-parmak-corabi',
      description: {
        tr: 'Parmak ayrımlı yoga çorabı. Hijyenik kullanım ve dengeli duruş için ideal. Organik pamuk.',
        en: 'Toe-separated yoga socks. Ideal for hygienic use and balanced posture. Organic cotton.'
      },
      price: 99,
      images: [],
      category: coraplar._id,
      sizes: ['S (35-37)', 'M (38-40)', 'L (41-43)'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Gri', en: 'Gray' }, hex: '#9E9E9E' }
      ],
      stock: 80,
      featured: false,
      active: true,
      rating: 4.7,
      reviewCount: 28
    },
    {
      name: { tr: 'Spor Bileklik Çorap 3\'lü Paket', en: 'Sports Ankle Socks 3-Pack' },
      slug: 'spor-bileklik-corap-3lu',
      description: {
        tr: '3 çift spor bileklik çorap seti. Ter emici özellikli, antibakteriyel kumaş.',
        en: '3-pair sports ankle socks set. Moisture-wicking, antibacterial fabric.'
      },
      price: 149,
      salePrice: 119,
      images: [],
      category: coraplar._id,
      sizes: ['S (35-37)', 'M (38-40)', 'L (41-43)'],
      colors: [
        { name: { tr: 'Karışık', en: 'Mixed' }, hex: '#607D8B' }
      ],
      stock: 120,
      featured: true,
      active: true,
      rating: 4.4,
      reviewCount: 36
    },
    {
      name: { tr: 'Termal Spor Çorap', en: 'Thermal Sports Socks' },
      slug: 'termal-spor-corap',
      description: {
        tr: 'Soğuk havalarda ayakları sıcak tutan termal spor çorap. Kalın dokuma, dayanıklı yapı.',
        en: 'Thermal sports socks that keep feet warm in cold weather. Thick weave, durable construction.'
      },
      price: 69,
      images: [],
      category: coraplar._id,
      sizes: ['S (35-37)', 'M (38-40)', 'L (41-43)'],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Beyaz', en: 'White' }, hex: '#FFFFFF' }
      ],
      stock: 90,
      featured: false,
      active: true,
      rating: 4.3,
      reviewCount: 19
    },

    // Aksesuarlar
    {
      name: { tr: 'Spor Çanta', en: 'Sports Bag' },
      slug: 'spor-canta',
      description: {
        tr: 'Geniş iç hacimli spor çanta. Ayakkabı bölmesi, su şişesi cebi ve fermuarlı ön cep.',
        en: 'Spacious sports bag. Shoe compartment, water bottle pocket and zippered front pocket.'
      },
      price: 199,
      images: [],
      category: aksesuarlar._id,
      sizes: [],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' }
      ],
      stock: 25,
      featured: false,
      active: true,
      rating: 4.6,
      reviewCount: 12
    },
    {
      name: { tr: 'Matara 750ml', en: 'Water Bottle 750ml' },
      slug: 'matara-750ml',
      description: {
        tr: 'BPA içermeyen 750ml spor matara. Çift cidarlı, sıcak/soğuk koruma özelliği.',
        en: 'BPA-free 750ml sports water bottle. Double-walled, hot/cold insulation.'
      },
      price: 129,
      images: [],
      category: aksesuarlar._id,
      sizes: [],
      colors: [
        { name: { tr: 'Siyah', en: 'Black' }, hex: '#000000' },
        { name: { tr: 'Beyaz', en: 'White' }, hex: '#FAFAFA' }
      ],
      stock: 30,
      featured: false,
      active: true,
      rating: 4.8,
      reviewCount: 8
    },
    {
      name: { tr: 'Pilates Bandı Set', en: 'Pilates Band Set' },
      slug: 'pilates-bandi-set',
      description: {
        tr: '3 farklı direnç seviyesinde pilates bandı seti. Taşıma çantası dahil.',
        en: 'Pilates band set with 3 different resistance levels. Carrying bag included.'
      },
      price: 159,
      salePrice: 129,
      images: [],
      category: aksesuarlar._id,
      sizes: [],
      colors: [
        { name: { tr: 'Karışık', en: 'Mixed' }, hex: '#E91E63' }
      ],
      stock: 40,
      featured: true,
      active: true,
      rating: 4.5,
      reviewCount: 14
    }
  ]);

  console.log(`${products.length} ürün oluşturuldu`);

  // Site ayarları
  await Settings.create({
    siteName: 'DB Line Official',
    topBanner: {
      text: {
        tr: 'Burada olduğun için çok mutluyuz - ₺500 üzeri ücretsiz kargo',
        en: 'So happy you are here - Free shipping over ₺500'
      },
      active: true
    },
    contact: {
      email: 'info@dbline.com.tr',
      phone: '+90 (212) 000 00 00',
      address: 'İstanbul, Türkiye',
      instagram: 'https://www.instagram.com/dblinestudio/'
    },
    shippingFreeLimit: 500,
    shippingCost: 29.90,
    heroBanners: [
      {
        title: { tr: 'Yeni Sezon Koleksiyonu', en: 'New Season Collection' },
        subtitle: { tr: 'Premium kalitede tayt ve spor giyim', en: 'Premium quality leggings & sportswear' },
        link: '/products',
        active: true
      }
    ]
  });

  console.log('Site ayarları oluşturuldu');
  console.log('\n--- Seed tamamlandı ---');
  console.log('Admin giriş: admin@dbline.com.tr / admin123');

  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
