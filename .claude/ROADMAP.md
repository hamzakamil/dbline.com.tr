# DB Line - Faz Bazlı Yol Haritası

> Referans site: https://pilatespeople.store/

---

## Faz 1: Temel E-Ticaret İskeleti ✅
**Durum: TAMAMLANDI**

- Backend: Express + MongoDB + Mongoose
- Frontend: Vue 3 + Pinia + Tailwind + Vite
- Auth: JWT (register, login, profil)
- Ürün: CRUD, listeleme, detay, slug
- Kategori: CRUD, hiyerarşi
- Sipariş: Oluşturma, durum yönetimi, kargo takip
- Sepet: Ekle/çıkar, miktar, toplam
- Ödeme: Iyzipay entegrasyonu
- Görsel: Multer + Sharp (WebP, responsive)
- Admin: Dashboard, ürün/kategori/sipariş yönetimi
- Seed: Admin kullanıcı, 8 kategori, 12+ ürün

---

## Faz 2: SEO & Performans ✅
**Durum: TAMAMLANDI**

- Dinamik sitemap.xml
- @unhead/vue meta tag yönetimi
- JSON-LD yapılandırılmış veri
- Gzip compression
- Cache headers (statik dosyalar)
- SEO alanları (metaTitle, metaDescription, canonicalUrl)

---

## Faz 3: Çok Dilli Destek ✅
**Durum: TAMAMLANDI**

- TR/EN dil desteği
- Pinia language store
- Çeviri dosyaları (tr.json, en.json)
- Dil değiştirici bileşen
- Model'lerde çok dilli alanlar

---

## Faz 4: Tema & Tasarım Sistemi ✅
**Durum: TAMAMLANDI**

- CSS Variables dinamik tema
- 9 renk + 2 font + buton stili + header tipi
- Layout: menü pozisyonu, tipi, kategori listesi
- Admin tasarım editörü (4 preset, renk seçici, font)
- Google Fonts dinamik yükleme
- Header: sticky/normal/transparent
- MegaMenu, SideMenu, MobileMenu

---

## Faz 5: Pazarlama & Sosyal Kanıt ✅
**Durum: TAMAMLANDI**

- WhatsApp kupon popup (Twilio)
- Kupon sistemi (source tracking, expiry, limits)
- Yorum & değerlendirme (misafir/üye, fotoğraf, admin yanıt)
- Akıllı arama (debounce, Türkçe fuzzy, popüler aramalar)
- Arama sonuç sayfası

---

## Faz 6: BI & Analytics Dashboard ✅
**Durum: TAMAMLANDI**

- 11 analytics API endpoint
- Chart.js + vue-chartjs grafik bileşenleri (Line, Bar, Pie, Funnel)
- KPI kartları (% değişim karşılaştırma)
- Satış trendi, sipariş/ödeme durumu, satış hunisi
- Ürün performansı, cross-sell, stok analizi
- Müşteri analizi (şehir, LTV, tekrar oranı)
- Sepet, yorum, kupon, arama analizi
- Excel export (XLSX)
- WhatsApp zamanlanmış rapor (günlük/haftalık)
- Tarih filtresi (bugün, 7g, 30g, 90g, özel)

---

## Faz 7: Production Hazırlık ⏳
**Durum: BEKLENİYOR**

- [ ] Gerçek ürün verisi (fotoğraf, açıklama, fiyat)
- [ ] Production API anahtarları (Iyzipay, Twilio)
- [ ] Domain DNS & SSL
- [ ] PM2 / Docker deployment
- [ ] MongoDB Atlas
- [ ] SMTP e-posta ayarları
- [ ] Cloudflare CDN
- [ ] Error monitoring
- [ ] Backup stratejisi

---

## Olası Gelecek Fazlar

### Faz 8: Gelişmiş Özellikler
- Wishlist / favori listesi
- Abandoned cart recovery
- Variant bazlı stok yönetimi
- Blog / CMS
- Loyalty / puan sistemi

### Faz 9: Ölçeklendirme
- Multi-currency
- Push notification (FCM)
- A/B test altyapısı
- Redis cache
- Worker queue (Bull)
