const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'DB Line Official'
  },
  logo: String,
  topBanner: {
    text: { tr: { type: String, default: 'burada olduğun için çok mutluyum.' }, en: { type: String, default: "i'm so happy you're here." } },
    active: { type: Boolean, default: true }
  },
  heroSlogan: {
    tr: { type: String, default: "Pilates'te denge ayaktan başlar." },
    en: { type: String, default: 'Balance in Pilates starts from the feet.' }
  },
  heroImage: {
    type: String,
    default: ''
  },
  heroBanners: [{
    image: String,
    title: { tr: String, en: String },
    subtitle: { tr: String, en: String },
    link: String,
    active: { type: Boolean, default: true }
  }],
  contact: {
    email: String,
    phone: String,
    address: String,
    instagram: String,
    facebook: String,
    twitter: String
  },
  shippingFreeLimit: {
    type: Number,
    default: 500
  },
  shippingCost: {
    type: Number,
    default: 29.90
  },
  // WhatsApp Entegrasyonu (Twilio)
  whatsapp: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['twilio', 'whatsapp-business', 'wati'], default: 'twilio' },
    accountSid: { type: String, default: '' },
    authToken: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    templateOrderUpdate: { type: String, default: '' },
    templatePromotion: { type: String, default: '' }
  },
  // Tema Konfigürasyonu
  themeConfig: {
    colors: {
      primary: { type: String, default: '#121212' },
      secondary: { type: String, default: '#ffffff' },
      accent: { type: String, default: '#CA9C53' },
      accentDark: { type: String, default: '#A67D3D' },
      background: { type: String, default: '#FFF6E6' },
      headerBg: { type: String, default: '#FFF6E6' },
      footerBg: { type: String, default: '#242833' },
      bannerBg: { type: String, default: '#FFE8FF' },
      bannerText: { type: String, default: '#5C3D3D' },
      navText: { type: String, default: '#121212' },
      navHover: { type: String, default: '#CA9C53' },
      dropdownBg: { type: String, default: '#FFFAF2' }
    },
    fonts: {
      primary: { type: String, default: 'Inter' },
      heading: { type: String, default: 'Inter' }
    },
    buttonStyle: { type: String, enum: ['sharp', 'rounded', 'pill'], default: 'sharp' },
    headerType: { type: String, enum: ['sticky', 'normal', 'transparent'], default: 'sticky' },
    typography: {
      bodyFontSize: { type: Number, default: 16 },
      navFontSize: { type: Number, default: 15 },
      headingFontSize: { type: Number, default: 30 },
      letterSpacing: { type: Number, default: 0.06 }
    },
    logo: {
      headerHeight: { type: Number, default: 80 },
      footerHeight: { type: Number, default: 56 }
    },
    spacing: {
      headerPadding: { type: Number, default: 32 },
      navSpacing: { type: Number, default: 28 },
      sectionPadding: { type: Number, default: 64 },
      productGridGap: { type: Number, default: 24 },
      dropdownPaddingTop: { type: Number, default: 35 },
      dropdownPaddingBottom: { type: Number, default: 30 }
    },
    layout: {
      pageWidth: { type: Number, default: 1248 },
      productGridCols: { type: Number, default: 4 },
      heroMaxHeight: { type: Number, default: 85 },
      categoryGridCols: { type: Number, default: 3 }
    }
  },
  // Yerleşim Konfigürasyonu
  layoutConfig: {
    menuPosition: { type: String, enum: ['top', 'side', 'hamburger'], default: 'top' },
    menuType: { type: String, enum: ['standard', 'mega', 'slideout'], default: 'standard' },
    categoryListStyle: { type: String, enum: ['grid', 'list', 'carousel'], default: 'grid' },
    showPromoBars: { type: Boolean, default: true },
    showTopBanner: { type: Boolean, default: true },
    showCategoriesOnHome: { type: Boolean, default: false }
  },
  // Marketing Popup (WhatsApp Growth & Coupon)
  marketingPopup: {
    active: { type: Boolean, default: true },
    delaySeconds: { type: Number, default: 3 },
    image: { type: String, default: '' },
    title: {
      tr: { type: String, default: 'İlk Alışverişinde %10 İndirim' },
      en: { type: String, default: 'Get 10% Off Your First Order' }
    },
    subtitle: {
      tr: { type: String, default: 'Hoşgeldin indirimi için bilgilerini gir' },
      en: { type: String, default: 'Enter your details for a welcome discount' }
    },
    discountPercent: { type: Number, default: 10 },
    couponValidDays: { type: Number, default: 7 },
    minOrderAmount: { type: Number, default: 0 },
    whatsappMessageTemplate: { type: String, default: 'Merhaba {name}! DB Line\'a hoşgeldiniz. İndirim kodunuz: {code}. Geçerlilik: {expiry}. Alışverişe başla: https://dbline.com.tr' }
  },
  // Tasarım güncelleme geçmişi
  designUpdatedAt: Date,
  designUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Yorum Ayarları
  reviewConfig: {
    requireApproval: { type: Boolean, default: true },
    allowGuestReviews: { type: Boolean, default: true },
    requirePhoto: { type: Boolean, default: false },
    displayStyle: { type: String, enum: ['card', 'list'], default: 'card' },
    starColor: { type: String, default: '#f59e0b' },
    maxPhotosPerReview: { type: Number, default: 3 },
    notifyAdminOnNewReview: { type: Boolean, default: true }
  },
  // Arama Ayarları
  searchConfig: {
    popularSearches: [String],
    autoPopular: { type: Boolean, default: true },
    minChars: { type: Number, default: 3 },
    maxSuggestions: { type: Number, default: 8 }
  },
  // Zamanlanmış Rapor Ayarları
  reportSchedule: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    whatsappNumber: { type: String, default: '' },
    sendTime: { type: String, default: '09:00' }
  },
  // Ödeme Sistemi Ayarları
  paymentConfig: {
    provider: { type: String, enum: ['iyzico', 'paytr', 'paynkolay'], default: 'iyzico' },
    testMode: { type: Boolean, default: true },
    iyzico: {
      apiKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
      baseUrl: { type: String, default: 'https://sandbox-api.iyzipay.com' }
    },
    paytr: {
      merchantId: { type: String, default: '' },
      merchantKey: { type: String, default: '' },
      merchantSalt: { type: String, default: '' }
    },
    paynkolay: {
      apiKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
      merchantId: { type: String, default: '' }
    }
  },
  // OAuth Ayarları
  oauthConfig: {
    google: {
      enabled: { type: Boolean, default: false },
      clientId: { type: String, default: '' }
    }
  },
  // Fatura Ayarları
  invoiceConfig: {
    companyName: { type: String, default: '' },
    taxId: { type: String, default: '' },
    taxOffice: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    defaultTaxRate: { type: Number, default: 20 },
    numberPrefix: { type: String, default: 'INV' },
    autoGenerate: { type: Boolean, default: false }
  },
  // E-Fatura Entegrasyon Ayarları
  eInvoiceConfig: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, enum: ['bimasraf', 'nes', 'edm', 'none'], default: 'none' },
    testMode: { type: Boolean, default: true },
    defaultInvoiceType: { type: String, default: 'SATIS' },
    defaultInvoiceProfile: { type: String, default: 'EARSIVFATURA' },
    autoSubmit: { type: Boolean, default: false },
    bimasraf: {
      tenantId: { type: String, default: '' },
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      testBaseUrl: { type: String, default: 'https://testapi.bimasraf.com' },
      prodBaseUrl: { type: String, default: 'https://api.bimasraf.com' }
    },
    nes: {
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      testBaseUrl: { type: String, default: 'https://apitest.nes.com.tr' },
      prodBaseUrl: { type: String, default: 'https://api.nes.com.tr' }
    },
    edm: {
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      testWsdlUrl: { type: String, default: 'https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc?wsdl' },
      prodWsdlUrl: { type: String, default: '' }
    }
  },
  // Kargo Ayarları
  cargoConfig: {
    defaultProvider: { type: String, enum: ['yurtici', 'aras', 'mng', 'ptt', 'manual'], default: 'manual' },
    yurtici: {
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      customerCode: { type: String, default: '' }
    },
    aras: {
      username: { type: String, default: '' },
      password: { type: String, default: '' },
      customerCode: { type: String, default: '' }
    },
    autoCreateShipment: { type: Boolean, default: false }
  },
  // Bildirim Sistemi Ayarları
  notificationSettings: {
    emailEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: false },
    whatsappEnabled: { type: Boolean, default: false },
    smtp: {
      host: { type: String, default: '' },
      port: { type: Number, default: 587 },
      user: { type: String, default: '' },
      pass: { type: String, default: '' }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
