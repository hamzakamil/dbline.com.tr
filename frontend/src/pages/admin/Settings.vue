<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import { useThemeStore } from '../../stores/theme'
import api from '../../utils/api'

const { locale } = useLanguage()
const themeStore = useThemeStore()

const activeTab = ref('general')

const settings = ref({
  siteName: 'DB Line Official',
  topBanner: {
    text: { tr: 'burada olduğun için çok mutluyum.', en: "i'm so happy you're here." },
    active: true
  },
  heroSlogan: {
    tr: "Pilates'te denge ayaktan başlar.",
    en: 'Balance in Pilates starts from the feet.'
  },
  heroImage: '',
  contact: { email: '', phone: '', address: '', instagram: '', facebook: '' },
  shippingFreeLimit: 500,
  shippingCost: 29.90,
  themeConfig: {
    colors: {
      primary: '#121212', secondary: '#ffffff', accent: '#CA9C53',
      accentDark: '#A67D3D', background: '#FFF6E6', headerBg: '#FFF6E6',
      footerBg: '#242833', bannerBg: '#FFE8FF', bannerText: '#5C3D3D',
      navText: '#121212', navHover: '#CA9C53', dropdownBg: '#FFFAF2'
    },
    fonts: { primary: 'Inter', heading: 'Inter' },
    buttonStyle: 'sharp',
    headerType: 'sticky',
    typography: { bodyFontSize: 16, navFontSize: 15, headingFontSize: 30, letterSpacing: 0.06 },
    logo: { headerHeight: 80, footerHeight: 56 },
    spacing: { headerPadding: 32, navSpacing: 28, sectionPadding: 64, productGridGap: 24, dropdownPaddingTop: 35, dropdownPaddingBottom: 30 },
    layout: { pageWidth: 1248, productGridCols: 4, heroMaxHeight: 85, categoryGridCols: 3 }
  },
  layoutConfig: {
    menuPosition: 'top', menuType: 'standard',
    categoryListStyle: 'grid', showPromoBars: true, showTopBanner: true,
    showCategoriesOnHome: false
  },
  paymentConfig: {
    provider: 'iyzico',
    testMode: true,
    iyzico: { apiKey: '', secretKey: '', baseUrl: '' },
    paytr: { merchantId: '', merchantKey: '', merchantSalt: '' },
    paynkolay: { apiKey: '', secretKey: '', merchantId: '' }
  },
  whatsapp: {
    enabled: false,
    provider: 'twilio',
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    templateOrderUpdate: '',
    templatePromotion: ''
  },
  reportSchedule: {
    enabled: false,
    frequency: 'daily',
    whatsappNumber: '',
    sendTime: '09:00'
  },
  notificationSettings: {
    emailEnabled: true,
    pushEnabled: false,
    whatsappEnabled: false,
    smtp: { host: '', port: 587, user: '', pass: '' }
  },
  oauthConfig: {
    google: {
      enabled: false,
      clientId: ''
    }
  },
  invoiceConfig: {
    companyName: '',
    taxId: '',
    taxOffice: '',
    address: '',
    phone: '',
    email: '',
    defaultTaxRate: 20,
    numberPrefix: 'INV',
    autoGenerate: false
  },
  eInvoiceConfig: {
    enabled: false,
    provider: 'none',
    testMode: true,
    defaultInvoiceType: 'SATIS',
    defaultInvoiceProfile: 'EARSIVFATURA',
    autoSubmit: false,
    bimasraf: { tenantId: '', username: '', password: '', testBaseUrl: 'https://testapi.bimasraf.com', prodBaseUrl: 'https://api.bimasraf.com' },
    nes: { username: '', password: '', testBaseUrl: 'https://apitest.nes.com.tr', prodBaseUrl: 'https://api.nes.com.tr' },
    edm: { username: '', password: '', testWsdlUrl: 'https://test.edmbilisim.com.tr/EFaturaEDM21ea/EFaturaEDM.svc?wsdl', prodWsdlUrl: '' }
  },
  cargoConfig: {
    defaultProvider: 'manual',
    yurtici: { username: '', password: '', customerCode: '' },
    aras: { username: '', password: '', customerCode: '' },
    autoCreateShipment: false
  }
})
const loading = ref(false)
const saved = ref(false)
const uploading = ref(false)

// Hazır paletler
const presets = [
  {
    name: { tr: 'Varsayılan', en: 'Default' },
    colors: { primary: '#121212', secondary: '#ffffff', accent: '#CA9C53', accentDark: '#A67D3D', background: '#FFF6E6', headerBg: '#FFF6E6', footerBg: '#242833', bannerBg: '#FFE8FF', bannerText: '#5C3D3D' }
  },
  {
    name: { tr: 'Minimalist', en: 'Minimalist' },
    colors: { primary: '#111111', secondary: '#ffffff', accent: '#333333', accentDark: '#000000', background: '#ffffff', headerBg: '#ffffff', footerBg: '#111111', bannerBg: '#f5f5f5', bannerText: '#333333' }
  },
  {
    name: { tr: 'Pembe Butik', en: 'Pink Boutique' },
    colors: { primary: '#2d2d2d', secondary: '#ffffff', accent: '#d4789c', accentDark: '#b8607e', background: '#fff5f8', headerBg: '#fff5f8', footerBg: '#2d2d2d', bannerBg: '#fce4ec', bannerText: '#6d3a4a' }
  },
  {
    name: { tr: 'Koyu', en: 'Dark' },
    colors: { primary: '#e0e0e0', secondary: '#1a1a2e', accent: '#e94560', accentDark: '#c73e55', background: '#16213e', headerBg: '#0f3460', footerBg: '#1a1a2e', bannerBg: '#0f3460', bannerText: '#e0e0e0' }
  }
]

const fontOptions = ['Inter', 'Nunito Sans', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Playfair Display', 'Cormorant Garamond']

function applyPreset(preset) {
  settings.value.themeConfig.colors = { ...preset.colors }
  previewTheme()
}

function previewTheme() {
  themeStore.applyTheme(settings.value.themeConfig)
}

// Canlı önizleme watcher'ları
watch(() => settings.value.themeConfig?.fonts, () => { previewTheme() }, { deep: true })
watch(() => settings.value.themeConfig?.buttonStyle, () => { previewTheme() })
watch(() => settings.value.themeConfig?.colors, () => { previewTheme() }, { deep: true })
watch(() => settings.value.themeConfig?.typography, () => { previewTheme() }, { deep: true })
watch(() => settings.value.themeConfig?.logo, () => { previewTheme() }, { deep: true })
watch(() => settings.value.themeConfig?.spacing, () => { previewTheme() }, { deep: true })
watch(() => settings.value.themeConfig?.layout, () => { previewTheme() }, { deep: true })

async function fetchSettings() {
  try {
    const { data } = await api.get(`/admin/settings`)
    if (!data.topBanner) data.topBanner = { text: { tr: '', en: '' }, active: true }
    if (!data.topBanner.text) data.topBanner.text = { tr: '', en: '' }
    if (!data.heroSlogan) data.heroSlogan = { tr: '', en: '' }
    if (!data.heroImage) data.heroImage = ''
    if (!data.themeConfig) data.themeConfig = settings.value.themeConfig
    if (!data.themeConfig.colors) data.themeConfig.colors = settings.value.themeConfig.colors
    if (!data.themeConfig.colors.navText) data.themeConfig.colors.navText = '#121212'
    if (!data.themeConfig.colors.navHover) data.themeConfig.colors.navHover = '#CA9C53'
    if (!data.themeConfig.colors.dropdownBg) data.themeConfig.colors.dropdownBg = '#FFFAF2'
    if (!data.themeConfig.fonts) data.themeConfig.fonts = settings.value.themeConfig.fonts
    if (!data.themeConfig.typography) data.themeConfig.typography = settings.value.themeConfig.typography
    if (!data.themeConfig.logo) data.themeConfig.logo = settings.value.themeConfig.logo
    if (!data.themeConfig.spacing) data.themeConfig.spacing = settings.value.themeConfig.spacing
    if (!data.themeConfig.layout) data.themeConfig.layout = settings.value.themeConfig.layout
    if (!data.layoutConfig) data.layoutConfig = settings.value.layoutConfig
    if (!data.paymentConfig) data.paymentConfig = settings.value.paymentConfig
    if (!data.paymentConfig.iyzico) data.paymentConfig.iyzico = { apiKey: '', secretKey: '', baseUrl: '' }
    if (!data.paymentConfig.paytr) data.paymentConfig.paytr = { merchantId: '', merchantKey: '', merchantSalt: '' }
    if (!data.paymentConfig.paynkolay) data.paymentConfig.paynkolay = { apiKey: '', secretKey: '', merchantId: '' }
    if (!data.whatsapp) data.whatsapp = settings.value.whatsapp
    if (!data.reportSchedule) data.reportSchedule = settings.value.reportSchedule
    if (!data.notificationSettings) data.notificationSettings = settings.value.notificationSettings
    if (!data.notificationSettings.smtp) data.notificationSettings.smtp = { host: '', port: 587, user: '', pass: '' }
    if (!data.oauthConfig) data.oauthConfig = settings.value.oauthConfig
    if (!data.oauthConfig.google) data.oauthConfig.google = { enabled: false, clientId: '' }
    if (!data.invoiceConfig) data.invoiceConfig = settings.value.invoiceConfig
    if (!data.eInvoiceConfig) data.eInvoiceConfig = settings.value.eInvoiceConfig
    if (data.eInvoiceConfig && !data.eInvoiceConfig.bimasraf) data.eInvoiceConfig.bimasraf = settings.value.eInvoiceConfig.bimasraf
    if (data.eInvoiceConfig && !data.eInvoiceConfig.nes) data.eInvoiceConfig.nes = settings.value.eInvoiceConfig.nes
    if (data.eInvoiceConfig && !data.eInvoiceConfig.edm) data.eInvoiceConfig.edm = settings.value.eInvoiceConfig.edm
    if (!data.cargoConfig) data.cargoConfig = settings.value.cargoConfig
    if (!data.cargoConfig.yurtici) data.cargoConfig.yurtici = { username: '', password: '', customerCode: '' }
    if (!data.cargoConfig.aras) data.cargoConfig.aras = { username: '', password: '', customerCode: '' }
    settings.value = data
  } catch (error) {
    console.error(error)
  }
}

async function uploadHeroImage(event) {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  const formData = new FormData()
  formData.append('image', file)
  try {
    const { data } = await api.post(`/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    settings.value.heroImage = data.url || data.path
  } catch (err) { console.error('Upload error:', err.response?.status, err.response?.data, err.message); alert((locale.value === 'tr' ? 'Görsel yüklenemedi: ' : 'Image upload failed: ') + (err.response?.data?.message || err.message)) }
  finally { uploading.value = false }
}

async function saveSettings() {
  loading.value = true
  saved.value = false
  try {
    await api.put(`/admin/settings`, settings.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (error) { alert(error.response?.data?.message || 'Hata') }
  finally { loading.value = false }
}

// E-Fatura bağlantı testi
const testingEInvoice = ref(false)
const eInvoiceTestResult = ref(null)

async function testEInvoiceConnection() {
  testingEInvoice.value = true
  eInvoiceTestResult.value = null
  try {
    // Önce ayarları kaydet
    await api.put('/admin/settings', settings.value)
    const { data } = await api.get('/invoices/e-invoice/test-connection')
    eInvoiceTestResult.value = { success: true, message: data.message }
  } catch (error) {
    eInvoiceTestResult.value = { success: false, message: error.response?.data?.message || 'Bağlantı hatası' }
  } finally {
    testingEInvoice.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Site Ayarları' : 'Site Settings' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Admin navigasyon -->
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <!-- Tab sistemi -->
      <div class="flex border-b mb-6">
        <button
          @click="activeTab = 'general'"
          class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'general' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >{{ locale === 'tr' ? 'Genel Ayarlar' : 'General Settings' }}</button>
        <button
          @click="activeTab = 'design'"
          class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'design' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >{{ locale === 'tr' ? 'Tasarım Editörü' : 'Design Editor' }}</button>
        <button
          @click="activeTab = 'payment'"
          class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'payment' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >{{ locale === 'tr' ? 'Ödeme' : 'Payment' }}</button>
        <button
          @click="activeTab = 'notifications'"
          class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'notifications' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >{{ locale === 'tr' ? 'Bildirimler' : 'Notifications' }}</button>
        <button
          @click="activeTab = 'invoice'"
          class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'invoice' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >{{ locale === 'tr' ? 'Fatura' : 'Invoice' }}</button>
        <button
          @click="activeTab = 'cargo'"
          class="px-5 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'cargo' ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >{{ locale === 'tr' ? 'Kargo' : 'Cargo' }}</button>
      </div>

      <div v-if="saved" class="bg-green-50 border border-green-200 text-green-700 p-3 text-sm mb-6">
        {{ locale === 'tr' ? 'Ayarlar kaydedildi!' : 'Settings saved!' }}
      </div>

      <form @submit.prevent="saveSettings">
        <!-- ==================== GENEL AYARLAR TAB ==================== -->
        <div v-show="activeTab === 'general'" class="space-y-6">
          <!-- Genel -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Genel' : 'General' }}</h3>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Site Adı' : 'Site Name' }}</label>
              <input v-model="settings.siteName" type="text" class="input-field max-w-md" />
            </div>
          </div>

          <!-- Üst Banner -->
          <div class="bg-white border p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'Üst Banner' : 'Top Banner' }}</h3>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="settings.topBanner.active" class="w-4 h-4 accent-accent" />
                <span class="text-xs text-gray-500">{{ locale === 'tr' ? 'Aktif' : 'Active' }}</span>
              </label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Türkçe Metin' : 'Turkish Text' }}</label>
                <input v-model="settings.topBanner.text.tr" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'İngilizce Metin' : 'English Text' }}</label>
                <input v-model="settings.topBanner.text.en" type="text" class="input-field" />
              </div>
            </div>
          </div>

          <!-- Hero -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Ana Sayfa Hero' : 'Homepage Hero' }}</h3>
            <div class="mb-6">
              <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Hero Görseli' : 'Hero Image' }}</label>
              <div class="flex items-start gap-4">
                <div v-if="settings.heroImage" class="w-48 h-32 bg-gray-100 overflow-hidden flex-shrink-0">
                  <img :src="settings.heroImage" alt="Hero" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-48 h-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span class="text-xs text-gray-400">{{ locale === 'tr' ? 'Görsel yok' : 'No image' }}</span>
                </div>
                <div>
                  <label class="btn-outline cursor-pointer text-xs inline-block">
                    {{ uploading ? '...' : (locale === 'tr' ? 'Görsel Yükle' : 'Upload Image') }}
                    <input type="file" accept="image/*" class="hidden" @change="uploadHeroImage" :disabled="uploading" />
                  </label>
                  <button v-if="settings.heroImage" type="button" @click="settings.heroImage = ''" class="text-xs text-red-500 mt-1 hover:underline block">
                    {{ locale === 'tr' ? 'Görseli Kaldır' : 'Remove Image' }}
                  </button>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Slogan (TR)' : 'Slogan (TR)' }}</label>
                <input v-model="settings.heroSlogan.tr" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Slogan (EN)' : 'Slogan (EN)' }}</label>
                <input v-model="settings.heroSlogan.en" type="text" class="input-field" />
              </div>
            </div>
          </div>

          <!-- İletişim -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'İletişim' : 'Contact' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">E-posta</label>
                <input v-model="settings.contact.email" type="email" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Telefon' : 'Phone' }}</label>
                <input v-model="settings.contact.phone" type="text" class="input-field" />
              </div>
              <div class="md:col-span-2">
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Adres' : 'Address' }}</label>
                <input v-model="settings.contact.address" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Instagram</label>
                <input v-model="settings.contact.instagram" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Facebook</label>
                <input v-model="settings.contact.facebook" type="text" class="input-field" />
              </div>
            </div>
          </div>

          <!-- Kargo -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Kargo' : 'Shipping' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Ücretsiz Kargo Limiti' : 'Free Shipping Limit' }}</label>
                <input v-model.number="settings.shippingFreeLimit" type="number" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kargo Ücreti' : 'Shipping Cost' }}</label>
                <input v-model.number="settings.shippingCost" type="number" step="0.01" class="input-field" />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== TASARIM EDITÖRÜ TAB ==================== -->
        <div v-show="activeTab === 'design'" class="space-y-6">
          <!-- Hazır Paletler -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Hazır Paletler' : 'Presets' }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                v-for="preset in presets"
                :key="preset.name.en"
                type="button"
                @click="applyPreset(preset)"
                class="border p-3 text-center hover:border-accent transition-colors"
              >
                <div class="flex gap-1 mb-2 justify-center">
                  <span v-for="(color, key) in { p: preset.colors.primary, a: preset.colors.accent, b: preset.colors.background }" :key="key"
                    class="w-5 h-5 rounded-full border border-gray-200"
                    :style="{ backgroundColor: color }"
                  ></span>
                </div>
                <span class="text-xs">{{ locale === 'tr' ? preset.name.tr : preset.name.en }}</span>
              </button>
            </div>
          </div>

          <!-- Logo Ayarları -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Logo Ayarları' : 'Logo Settings' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Header Logo Boyutu' : 'Header Logo Size' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="40" max="120" step="1" v-model.number="settings.themeConfig.logo.headerHeight" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.logo.headerHeight }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Footer Logo Boyutu' : 'Footer Logo Size' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="30" max="80" step="1" v-model.number="settings.themeConfig.logo.footerHeight" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.logo.footerHeight }}px</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Renk Paleti -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Renk Paleti' : 'Color Palette' }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div v-for="(label, key) in {
                primary: locale === 'tr' ? 'Ana Renk' : 'Primary',
                secondary: locale === 'tr' ? 'İkincil Renk' : 'Secondary',
                accent: locale === 'tr' ? 'Vurgu Rengi' : 'Accent',
                accentDark: locale === 'tr' ? 'Vurgu (Koyu)' : 'Accent Dark',
                background: locale === 'tr' ? 'Arka Plan' : 'Background',
                headerBg: locale === 'tr' ? 'Header Arka Plan' : 'Header BG',
                footerBg: locale === 'tr' ? 'Footer Arka Plan' : 'Footer BG',
                bannerBg: locale === 'tr' ? 'Banner Arka Plan' : 'Banner BG',
                bannerText: locale === 'tr' ? 'Banner Metin' : 'Banner Text',
                navText: locale === 'tr' ? 'Navigasyon Metin' : 'Nav Text',
                navHover: locale === 'tr' ? 'Navigasyon Hover' : 'Nav Hover',
                dropdownBg: locale === 'tr' ? 'Alt Menü Arkaplan' : 'Dropdown BG'
              }" :key="key">
                <label class="text-xs text-gray-500 mb-1 block">{{ label }}</label>
                <div class="flex items-center gap-2">
                  <input type="color" v-model="settings.themeConfig.colors[key]" class="w-10 h-10 cursor-pointer border-0 p-0" />
                  <input type="text" v-model="settings.themeConfig.colors[key]" class="input-field flex-1 text-xs" maxlength="7" />
                </div>
              </div>
            </div>
          </div>

          <!-- Yazı Tipi & Boyutlar -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Yazı Tipi & Boyutlar' : 'Fonts & Sizes' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Ana Font' : 'Primary Font' }}</label>
                <select v-model="settings.themeConfig.fonts.primary" class="input-field">
                  <option v-for="f in fontOptions" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Başlık Fontu' : 'Heading Font' }}</label>
                <select v-model="settings.themeConfig.fonts.heading" class="input-field">
                  <option v-for="f in fontOptions" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Gövde Yazı Boyutu' : 'Body Font Size' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="12" max="20" step="1" v-model.number="settings.themeConfig.typography.bodyFontSize" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.typography.bodyFontSize }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Navigasyon Yazı Boyutu' : 'Nav Font Size' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="12" max="20" step="1" v-model.number="settings.themeConfig.typography.navFontSize" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.typography.navFontSize }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Başlık Yazı Boyutu' : 'Heading Font Size' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="20" max="48" step="1" v-model.number="settings.themeConfig.typography.headingFontSize" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.typography.headingFontSize }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Harf Aralığı' : 'Letter Spacing' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="0" max="0.15" step="0.01" v-model.number="settings.themeConfig.typography.letterSpacing" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-16 text-right">{{ settings.themeConfig.typography.letterSpacing }}rem</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Buton Stili -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Buton Stili' : 'Button Style' }}</h3>
            <div class="flex flex-wrap gap-4 items-center">
              <label v-for="(style, i) in [
                { value: 'sharp', label: locale === 'tr' ? 'Keskin' : 'Sharp', radius: '0px' },
                { value: 'rounded', label: locale === 'tr' ? 'Yuvarlak' : 'Rounded', radius: '8px' },
                { value: 'pill', label: locale === 'tr' ? 'Hap' : 'Pill', radius: '9999px' }
              ]" :key="i" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="settings.themeConfig.buttonStyle" :value="style.value" class="accent-accent" />
                <span class="text-sm">{{ style.label }}</span>
              </label>
            </div>
            <!-- Önizleme -->
            <div class="mt-4 flex gap-3">
              <button type="button" class="btn-primary text-xs" :style="{ borderRadius: settings.themeConfig.buttonStyle === 'sharp' ? '0' : settings.themeConfig.buttonStyle === 'rounded' ? '8px' : '9999px' }">
                {{ locale === 'tr' ? 'Önizleme' : 'Preview' }}
              </button>
              <button type="button" class="btn-accent text-xs" :style="{ borderRadius: settings.themeConfig.buttonStyle === 'sharp' ? '0' : settings.themeConfig.buttonStyle === 'rounded' ? '8px' : '9999px' }">
                {{ locale === 'tr' ? 'Sepete Ekle' : 'Add to Cart' }}
              </button>
            </div>
          </div>

          <!-- Header & Navigasyon -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Header & Navigasyon' : 'Header & Navigation' }}</h3>
            <div class="mb-4">
              <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Header Tipi' : 'Header Type' }}</label>
              <div class="flex flex-wrap gap-4">
                <label v-for="opt in [
                  { value: 'sticky', label: locale === 'tr' ? 'Yapışkan' : 'Sticky' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'transparent', label: locale === 'tr' ? 'Şeffaf' : 'Transparent' }
                ]" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="settings.themeConfig.headerType" :value="opt.value" class="accent-accent" />
                  <span class="text-sm">{{ opt.label }}</span>
                </label>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Header Boşluğu' : 'Header Padding' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="16" max="64" step="1" v-model.number="settings.themeConfig.spacing.headerPadding" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.spacing.headerPadding }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Nav Link Aralığı' : 'Nav Link Spacing' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="12" max="48" step="1" v-model.number="settings.themeConfig.spacing.navSpacing" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.spacing.navSpacing }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Alt Menü Üst Boşluk' : 'Dropdown Top Padding' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="10" max="60" step="1" v-model.number="settings.themeConfig.spacing.dropdownPaddingTop" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.spacing.dropdownPaddingTop }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Alt Menü Alt Boşluk' : 'Dropdown Bottom Padding' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="10" max="60" step="1" v-model.number="settings.themeConfig.spacing.dropdownPaddingBottom" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.spacing.dropdownPaddingBottom }}px</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Sayfa Düzeni -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Sayfa Düzeni' : 'Page Layout' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Sayfa Genişliği' : 'Page Width' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="960" max="1600" step="8" v-model.number="settings.themeConfig.layout.pageWidth" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-14 text-right">{{ settings.themeConfig.layout.pageWidth }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Bölüm Boşluğu' : 'Section Padding' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="32" max="128" step="4" v-model.number="settings.themeConfig.spacing.sectionPadding" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.spacing.sectionPadding }}px</span>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Hero Yüksekliği' : 'Hero Height' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="50" max="100" step="5" v-model.number="settings.themeConfig.layout.heroMaxHeight" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.layout.heroMaxHeight }}vh</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ürün & Kategori Grid -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Ürün & Kategori Grid' : 'Product & Category Grid' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Ürün Sütun Sayısı' : 'Product Columns' }}</label>
                <div class="flex flex-wrap gap-4">
                  <label v-for="n in [2, 3, 4]" :key="n" class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model.number="settings.themeConfig.layout.productGridCols" :value="n" class="accent-accent" />
                    <span class="text-sm">{{ n }}</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Kategori Sütun Sayısı' : 'Category Columns' }}</label>
                <div class="flex flex-wrap gap-4">
                  <label v-for="n in [2, 3, 4]" :key="n" class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model.number="settings.themeConfig.layout.categoryGridCols" :value="n" class="accent-accent" />
                    <span class="text-sm">{{ n }}</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Kart Aralığı' : 'Grid Gap' }}</label>
                <div class="flex items-center gap-3">
                  <input type="range" min="12" max="48" step="2" v-model.number="settings.themeConfig.spacing.productGridGap" class="flex-1 accent-accent" />
                  <span class="text-xs text-gray-500 w-12 text-right">{{ settings.themeConfig.spacing.productGridGap }}px</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Menü Yerleşimi -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Menü Yerleşimi' : 'Menu Position' }}</h3>
            <div class="flex flex-wrap gap-4">
              <label v-for="opt in [
                { value: 'top', label: locale === 'tr' ? 'Üst Menü' : 'Top Menu' },
                { value: 'side', label: locale === 'tr' ? 'Yan Menü' : 'Side Menu' },
                { value: 'hamburger', label: 'Hamburger' }
              ]" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="settings.layoutConfig.menuPosition" :value="opt.value" class="accent-accent" />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <!-- Menü Türü -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Menü Türü' : 'Menu Type' }}</h3>
            <div class="flex flex-wrap gap-4">
              <label v-for="opt in [
                { value: 'standard', label: locale === 'tr' ? 'Standart' : 'Standard' },
                { value: 'mega', label: 'Mega Menu' },
                { value: 'slideout', label: locale === 'tr' ? 'Kayar Menü' : 'Slideout' }
              ]" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="settings.layoutConfig.menuType" :value="opt.value" class="accent-accent" />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <!-- Kategori Listeleme -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Kategori Listeleme' : 'Category Listing' }}</h3>
            <div class="flex flex-wrap gap-4">
              <label v-for="opt in [
                { value: 'grid', label: 'Grid' },
                { value: 'list', label: locale === 'tr' ? 'Liste' : 'List' },
                { value: 'carousel', label: locale === 'tr' ? 'Karusel' : 'Carousel' }
              ]" :key="opt.value" class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="settings.layoutConfig.categoryListStyle" :value="opt.value" class="accent-accent" />
                <span class="text-sm">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <!-- Görünüm toggleları -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Görünüm' : 'Visibility' }}</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.layoutConfig.showTopBanner" class="w-4 h-4 accent-accent" />
                <span class="text-sm">{{ locale === 'tr' ? 'Üst Banneri Göster' : 'Show Top Banner' }}</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.layoutConfig.showPromoBars" class="w-4 h-4 accent-accent" />
                <span class="text-sm">{{ locale === 'tr' ? 'Promosyon Barlarını Göster' : 'Show Promo Bars' }}</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.layoutConfig.showCategoriesOnHome" class="w-4 h-4 accent-accent" />
                <span class="text-sm">{{ locale === 'tr' ? 'Ana Sayfada Kategorileri Göster' : 'Show Categories on Homepage' }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- ==================== ÖDEME TAB ==================== -->
        <div v-show="activeTab === 'payment'" class="space-y-6">
          <!-- Ödeme Sağlayıcı Seçimi -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Ödeme Sağlayıcı' : 'Payment Provider' }}</h3>
            <div class="flex flex-wrap gap-4 mb-4">
              <label v-for="opt in [
                { value: 'iyzico', label: 'Iyzico' },
                { value: 'paytr', label: 'PayTR' },
                { value: 'paynkolay', label: 'Paynkolay' }
              ]" :key="opt.value" class="flex items-center gap-3 cursor-pointer border p-4 min-w-[140px] transition-colors"
                :class="settings.paymentConfig.provider === opt.value ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'"
              >
                <input type="radio" v-model="settings.paymentConfig.provider" :value="opt.value" class="accent-accent" />
                <span class="text-sm font-medium">{{ opt.label }}</span>
              </label>
            </div>
          </div>

          <!-- Test Modu -->
          <div class="bg-white border p-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'Test Modu' : 'Test Mode' }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ locale === 'tr' ? 'Test modunda gerçek ödeme alınmaz' : 'No real payments are processed in test mode' }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.paymentConfig.testMode" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>

          <!-- Iyzico Ayarları -->
          <div v-show="settings.paymentConfig.provider === 'iyzico'" class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">Iyzico API</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">API Key</label>
                <input v-model="settings.paymentConfig.iyzico.apiKey" type="text" class="input-field" placeholder="sandbox-..." />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Secret Key</label>
                <input v-model="settings.paymentConfig.iyzico.secretKey" type="password" class="input-field" placeholder="sandbox-..." />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Base URL</label>
                <input v-model="settings.paymentConfig.iyzico.baseUrl" type="text" class="input-field" placeholder="https://sandbox-api.iyzipay.com" />
                <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Test: https://sandbox-api.iyzipay.com | Canlı: https://api.iyzipay.com' : 'Test: https://sandbox-api.iyzipay.com | Live: https://api.iyzipay.com' }}</p>
              </div>
            </div>
          </div>

          <!-- PayTR Ayarları -->
          <div v-show="settings.paymentConfig.provider === 'paytr'" class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">PayTR API</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Merchant ID</label>
                <input v-model="settings.paymentConfig.paytr.merchantId" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Merchant Key</label>
                <input v-model="settings.paymentConfig.paytr.merchantKey" type="password" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Merchant Salt</label>
                <input v-model="settings.paymentConfig.paytr.merchantSalt" type="password" class="input-field" />
              </div>
            </div>
          </div>

          <!-- Paynkolay Ayarları -->
          <div v-show="settings.paymentConfig.provider === 'paynkolay'" class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">Paynkolay API</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">API Key</label>
                <input v-model="settings.paymentConfig.paynkolay.apiKey" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Secret Key</label>
                <input v-model="settings.paymentConfig.paynkolay.secretKey" type="password" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Merchant ID</label>
                <input v-model="settings.paymentConfig.paynkolay.merchantId" type="text" class="input-field" />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== BİLDİRİMLER TAB ==================== -->
        <!-- ==================== FATURA TAB ==================== -->
        <div v-show="activeTab === 'invoice'" class="space-y-6">
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Firma Bilgileri' : 'Company Info' }}</h3>
            <p class="text-xs text-gray-400 mb-4">{{ locale === 'tr' ? 'Faturalarda görünecek firma bilgileri' : 'Company info displayed on invoices' }}</p>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Firma Adı' : 'Company Name' }}</label>
                  <input v-model="settings.invoiceConfig.companyName" type="text" class="input-field" :placeholder="locale === 'tr' ? 'DB Line Official' : 'DB Line Official'" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Vergi Numarası' : 'Tax ID' }}</label>
                  <input v-model="settings.invoiceConfig.taxId" type="text" class="input-field" placeholder="1234567890" />
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Vergi Dairesi' : 'Tax Office' }}</label>
                  <input v-model="settings.invoiceConfig.taxOffice" type="text" class="input-field" :placeholder="locale === 'tr' ? 'Kadıköy Vergi Dairesi' : 'Tax Office'" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Telefon' : 'Phone' }}</label>
                  <input v-model="settings.invoiceConfig.phone" type="text" class="input-field" placeholder="+90 5XX XXX XX XX" />
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Adres' : 'Address' }}</label>
                <textarea v-model="settings.invoiceConfig.address" rows="2" class="input-field" :placeholder="locale === 'tr' ? 'Firma adresi' : 'Company address'"></textarea>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'E-posta' : 'Email' }}</label>
                <input v-model="settings.invoiceConfig.email" type="email" class="input-field max-w-md" placeholder="info@dbline.com.tr" />
              </div>
            </div>
          </div>

          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Fatura Ayarları' : 'Invoice Settings' }}</h3>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Varsayılan KDV Oranı (%)' : 'Default Tax Rate (%)' }}</label>
                  <input v-model.number="settings.invoiceConfig.defaultTaxRate" type="number" class="input-field" min="0" max="50" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Fatura No Öneki' : 'Invoice Number Prefix' }}</label>
                  <input v-model="settings.invoiceConfig.numberPrefix" type="text" class="input-field" placeholder="INV" />
                  <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Örn: INV-2026-0001' : 'Ex: INV-2026-0001' }}</p>
                </div>
              </div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.invoiceConfig.autoGenerate" class="w-4 h-4 accent-accent" />
                <span class="text-sm">{{ locale === 'tr' ? 'Ödeme onaylandığında otomatik fatura oluştur' : 'Auto-generate invoice when payment is confirmed' }}</span>
              </label>
            </div>
          </div>

          <!-- E-Fatura Entegrasyonu -->
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-2">{{ locale === 'tr' ? 'E-Fatura Entegrasyonu' : 'E-Invoice Integration' }}</h3>
            <p class="text-xs text-gray-400 mb-4">{{ locale === 'tr' ? 'GİB e-fatura/e-arşiv entegrasyonu' : 'GIB e-invoice/e-archive integration' }}</p>

            <!-- Aktif/Pasif -->
            <label class="flex items-center gap-3 cursor-pointer mb-6">
              <input type="checkbox" v-model="settings.eInvoiceConfig.enabled" class="w-4 h-4 accent-accent" />
              <span class="text-sm font-medium">{{ locale === 'tr' ? 'E-Fatura entegrasyonunu aktif et' : 'Enable e-invoice integration' }}</span>
            </label>

            <div v-if="settings.eInvoiceConfig.enabled" class="space-y-6">
              <!-- Provider seçimi -->
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'E-Fatura Sağlayıcı' : 'E-Invoice Provider' }}</label>
                <div class="flex flex-wrap gap-3">
                  <label v-for="opt in [
                    { value: 'bimasraf', label: 'Bimasraf', desc: 'REST API' },
                    { value: 'nes', label: 'NES Bilgi', desc: 'REST API' },
                    { value: 'edm', label: 'EDM Bilişim', desc: 'SOAP/WSDL' }
                  ]" :key="opt.value" class="flex items-center gap-3 cursor-pointer border p-4 min-w-[160px] rounded-lg transition-colors"
                    :class="settings.eInvoiceConfig.provider === opt.value ? 'border-accent bg-amber-50' : 'border-gray-200 hover:border-gray-300'"
                  >
                    <input type="radio" v-model="settings.eInvoiceConfig.provider" :value="opt.value" class="accent-accent" />
                    <div>
                      <span class="text-sm font-medium block">{{ opt.label }}</span>
                      <span class="text-xs text-gray-400">{{ opt.desc }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Test Modu -->
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.eInvoiceConfig.testMode" class="w-4 h-4 accent-accent" />
                <div>
                  <span class="text-sm">{{ locale === 'tr' ? 'Test Modu' : 'Test Mode' }}</span>
                  <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Test modunda gerçek fatura gönderilmez' : 'No real invoices sent in test mode' }}</p>
                </div>
              </label>

              <!-- Bimasraf Credentials -->
              <div v-if="settings.eInvoiceConfig.provider === 'bimasraf'" class="border border-gray-100 rounded-lg p-4 space-y-3">
                <h4 class="text-xs font-semibold text-gray-600 uppercase">Bimasraf {{ locale === 'tr' ? 'Kimlik Bilgileri' : 'Credentials' }}</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">Tenant ID</label>
                    <input v-model="settings.eInvoiceConfig.bimasraf.tenantId" type="text" class="input-field" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kullanıcı Adı' : 'Username' }}</label>
                    <input v-model="settings.eInvoiceConfig.bimasraf.username" type="text" class="input-field" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Şifre' : 'Password' }}</label>
                    <input v-model="settings.eInvoiceConfig.bimasraf.password" type="password" class="input-field" />
                  </div>
                </div>
              </div>

              <!-- NES Credentials -->
              <div v-if="settings.eInvoiceConfig.provider === 'nes'" class="border border-gray-100 rounded-lg p-4 space-y-3">
                <h4 class="text-xs font-semibold text-gray-600 uppercase">NES Bilgi {{ locale === 'tr' ? 'Kimlik Bilgileri' : 'Credentials' }}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kullanıcı Adı' : 'Username' }}</label>
                    <input v-model="settings.eInvoiceConfig.nes.username" type="text" class="input-field" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Şifre' : 'Password' }}</label>
                    <input v-model="settings.eInvoiceConfig.nes.password" type="password" class="input-field" />
                  </div>
                </div>
              </div>

              <!-- EDM Credentials -->
              <div v-if="settings.eInvoiceConfig.provider === 'edm'" class="border border-gray-100 rounded-lg p-4 space-y-3">
                <h4 class="text-xs font-semibold text-gray-600 uppercase">EDM Bilişim {{ locale === 'tr' ? 'Kimlik Bilgileri' : 'Credentials' }}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kullanıcı Adı' : 'Username' }}</label>
                    <input v-model="settings.eInvoiceConfig.edm.username" type="text" class="input-field" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Şifre' : 'Password' }}</label>
                    <input v-model="settings.eInvoiceConfig.edm.password" type="password" class="input-field" />
                  </div>
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">WSDL URL ({{ locale === 'tr' ? 'Prod' : 'Prod' }})</label>
                  <input v-model="settings.eInvoiceConfig.edm.prodWsdlUrl" type="text" class="input-field" :placeholder="locale === 'tr' ? 'Prodüksiyon WSDL URL (boş = test)' : 'Production WSDL URL (empty = test)'" />
                </div>
              </div>

              <!-- Fatura Tipi / Profil -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Fatura Tipi' : 'Invoice Type' }}</label>
                  <select v-model="settings.eInvoiceConfig.defaultInvoiceType" class="input-field">
                    <option value="SATIS">{{ locale === 'tr' ? 'Satış Faturası' : 'Sales Invoice' }}</option>
                    <option value="IADE">{{ locale === 'tr' ? 'İade Faturası' : 'Return Invoice' }}</option>
                    <option value="ISTISNA">{{ locale === 'tr' ? 'İstisna Faturası' : 'Exception Invoice' }}</option>
                    <option value="TEVKIFAT">{{ locale === 'tr' ? 'Tevkifat Faturası' : 'Withholding Invoice' }}</option>
                    <option value="OZELMATRAH">{{ locale === 'tr' ? 'Özel Matrah' : 'Special Base' }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Fatura Profili' : 'Invoice Profile' }}</label>
                  <select v-model="settings.eInvoiceConfig.defaultInvoiceProfile" class="input-field">
                    <option value="EARSIVFATURA">e-Arşiv Fatura</option>
                    <option value="TEMELFATURA">{{ locale === 'tr' ? 'Temel Fatura' : 'Basic Invoice' }}</option>
                    <option value="TICARIFATURA">{{ locale === 'tr' ? 'Ticari Fatura' : 'Commercial Invoice' }}</option>
                  </select>
                </div>
              </div>

              <!-- Otomatik gönderim -->
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" v-model="settings.eInvoiceConfig.autoSubmit" class="w-4 h-4 accent-accent" />
                <div>
                  <span class="text-sm">{{ locale === 'tr' ? 'Otomatik e-fatura gönderimi' : 'Auto-submit e-invoice' }}</span>
                  <p class="text-xs text-gray-400">{{ locale === 'tr' ? 'Fatura oluşturulduğunda otomatik olarak e-fatura sağlayıcısına gönder' : 'Automatically submit to e-invoice provider when invoice is generated' }}</p>
                </div>
              </label>

              <!-- Bağlantı Testi -->
              <div class="flex items-center gap-3">
                <button type="button" @click="testEInvoiceConnection" :disabled="testingEInvoice || settings.eInvoiceConfig.provider === 'none'"
                  class="px-4 py-2 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  <span v-if="testingEInvoice">{{ locale === 'tr' ? 'Test ediliyor...' : 'Testing...' }}</span>
                  <span v-else>{{ locale === 'tr' ? 'Bağlantı Testi' : 'Test Connection' }}</span>
                </button>
                <span v-if="eInvoiceTestResult" class="text-xs" :class="eInvoiceTestResult.success ? 'text-green-600' : 'text-red-600'">
                  {{ eInvoiceTestResult.message }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== KARGO TAB ==================== -->
        <div v-show="activeTab === 'cargo'" class="space-y-6">
          <div class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Kargo Sağlayıcı' : 'Cargo Provider' }}</h3>
            <p class="text-xs text-gray-400 mb-4">{{ locale === 'tr' ? 'Varsayılan kargo firmasını seçin' : 'Select default cargo provider' }}</p>

            <div class="flex flex-wrap gap-3 mb-6">
              <label v-for="opt in [
                { value: 'manual', label: { tr: 'Manuel', en: 'Manual' }, desc: { tr: 'Takip no elle girilir', en: 'Tracking number entered manually' } },
                { value: 'yurtici', label: { tr: 'Yurtiçi Kargo', en: 'Yurtiçi Kargo' }, desc: { tr: 'API entegrasyonu', en: 'API integration' } },
                { value: 'aras', label: { tr: 'Aras Kargo', en: 'Aras Kargo' }, desc: { tr: 'API entegrasyonu', en: 'API integration' } },
                { value: 'mng', label: { tr: 'MNG Kargo', en: 'MNG Kargo' }, desc: { tr: 'Yakında', en: 'Coming soon' } },
                { value: 'ptt', label: { tr: 'PTT Kargo', en: 'PTT Kargo' }, desc: { tr: 'Yakında', en: 'Coming soon' } }
              ]" :key="opt.value" class="flex items-center gap-3 cursor-pointer border p-4 min-w-[160px] rounded-lg transition-colors"
                :class="settings.cargoConfig.defaultProvider === opt.value ? 'border-accent bg-amber-50' : 'border-gray-200 hover:border-gray-300'"
              >
                <input type="radio" v-model="settings.cargoConfig.defaultProvider" :value="opt.value" class="accent-accent" />
                <div>
                  <span class="text-sm font-medium block">{{ opt.label[locale] }}</span>
                  <span class="text-xs text-gray-400">{{ opt.desc[locale] }}</span>
                </div>
              </label>
            </div>

            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="settings.cargoConfig.autoCreateShipment" class="w-4 h-4 accent-accent" />
              <span class="text-sm">{{ locale === 'tr' ? 'Sipariş kargoya verilince otomatik gönderi oluştur' : 'Auto-create shipment when order is shipped' }}</span>
            </label>
          </div>

          <!-- Yurtiçi Kargo API -->
          <div v-show="settings.cargoConfig.defaultProvider === 'yurtici'" class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Yurtiçi Kargo API Bilgileri' : 'Yurtiçi Kargo API Credentials' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kullanıcı Adı' : 'Username' }}</label>
                <input v-model="settings.cargoConfig.yurtici.username" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Şifre' : 'Password' }}</label>
                <input v-model="settings.cargoConfig.yurtici.password" type="password" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Müşteri Kodu' : 'Customer Code' }}</label>
                <input v-model="settings.cargoConfig.yurtici.customerCode" type="text" class="input-field" />
              </div>
            </div>
          </div>

          <!-- Aras Kargo API -->
          <div v-show="settings.cargoConfig.defaultProvider === 'aras'" class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Aras Kargo API Bilgileri' : 'Aras Kargo API Credentials' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kullanıcı Adı' : 'Username' }}</label>
                <input v-model="settings.cargoConfig.aras.username" type="text" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Şifre' : 'Password' }}</label>
                <input v-model="settings.cargoConfig.aras.password" type="password" class="input-field" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Müşteri Kodu' : 'Customer Code' }}</label>
                <input v-model="settings.cargoConfig.aras.customerCode" type="text" class="input-field" />
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== BİLDİRİMLER TAB ==================== -->
        <div v-show="activeTab === 'notifications'" class="space-y-6">

          <!-- Sosyal Giriş (Google OAuth) -->
          <div class="bg-white border p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'Sosyal Giriş' : 'Social Login' }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ locale === 'tr' ? 'Google ile giriş özelliğini yönetin' : 'Manage Google sign-in feature' }}</p>
              </div>
            </div>

            <!-- Google -->
            <div class="border p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span class="text-sm font-medium">Google</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="settings.oauthConfig.google.enabled" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div v-show="settings.oauthConfig.google.enabled" class="space-y-3 pt-3 border-t">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Google Client ID</label>
                  <input v-model="settings.oauthConfig.google.clientId" type="text" class="input-field" placeholder="XXXXX.apps.googleusercontent.com" />
                </div>
                <p class="text-xs text-gray-400">
                  {{ locale === 'tr'
                    ? 'Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID oluşturun. Authorized JavaScript origins alanına sitenizin URL\'sini ekleyin.'
                    : 'Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID. Add your site URL to Authorized JavaScript origins.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- WhatsApp Entegrasyonu -->
          <div class="bg-white border p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'WhatsApp Entegrasyonu' : 'WhatsApp Integration' }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ locale === 'tr' ? 'Müşterilere WhatsApp üzerinden bildirim gönderin' : 'Send notifications to customers via WhatsApp' }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.whatsapp.enabled" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            <div v-show="settings.whatsapp.enabled" class="space-y-4 mt-4 pt-4 border-t">
              <!-- Sağlayıcı Seçimi -->
              <div>
                <label class="text-xs text-gray-500 mb-2 block">{{ locale === 'tr' ? 'Sağlayıcı' : 'Provider' }}</label>
                <div class="flex flex-wrap gap-4">
                  <label v-for="opt in [
                    { value: 'twilio', label: 'Twilio' },
                    { value: 'whatsapp-business', label: 'WhatsApp Business' },
                    { value: 'wati', label: 'WATI' }
                  ]" :key="opt.value" class="flex items-center gap-3 cursor-pointer border p-3 min-w-[140px] transition-colors"
                    :class="settings.whatsapp.provider === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'"
                  >
                    <input type="radio" v-model="settings.whatsapp.provider" :value="opt.value" class="accent-green-500" />
                    <span class="text-sm font-medium">{{ opt.label }}</span>
                  </label>
                </div>
              </div>

              <!-- API Bilgileri -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Account SID</label>
                  <input v-model="settings.whatsapp.accountSid" type="text" class="input-field" placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">Auth Token</label>
                  <input v-model="settings.whatsapp.authToken" type="password" class="input-field" placeholder="*****" />
                </div>
              </div>

              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Gönderici Telefon Numarası' : 'Sender Phone Number' }}</label>
                <input v-model="settings.whatsapp.phoneNumber" type="text" class="input-field max-w-md" placeholder="+90 5XX XXX XX XX" />
                <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Twilio WhatsApp numaranız (whatsapp: prefix olmadan)' : 'Your Twilio WhatsApp number (without whatsapp: prefix)' }}</p>
              </div>
            </div>
          </div>

          <!-- Mesaj Şablonları -->
          <div v-show="settings.whatsapp.enabled" class="bg-white border p-6">
            <h3 class="text-sm uppercase tracking-widest mb-4">{{ locale === 'tr' ? 'Mesaj Şablonları' : 'Message Templates' }}</h3>
            <div class="space-y-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Sipariş Güncelleme Şablonu' : 'Order Update Template' }}</label>
                <textarea v-model="settings.whatsapp.templateOrderUpdate" rows="3" class="input-field" :placeholder="locale === 'tr' ? 'Merhaba {name}, siparişiniz {status} durumunda. Sipariş No: {orderNo}' : 'Hello {name}, your order is {status}. Order No: {orderNo}'"></textarea>
                <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Değişkenler: {name}, {status}, {orderNo}, {total}' : 'Variables: {name}, {status}, {orderNo}, {total}' }}</p>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Promosyon Şablonu' : 'Promotion Template' }}</label>
                <textarea v-model="settings.whatsapp.templatePromotion" rows="3" class="input-field" :placeholder="locale === 'tr' ? 'Merhaba {name}! DB Line\'da %{discount} indirim! Kod: {code}. Geçerlilik: {expiry}' : 'Hello {name}! {discount}% off at DB Line! Code: {code}. Valid until: {expiry}'"></textarea>
                <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Değişkenler: {name}, {code}, {discount}, {expiry}' : 'Variables: {name}, {code}, {discount}, {expiry}' }}</p>
              </div>
            </div>
          </div>

          <!-- E-posta Ayarları (SMTP) -->
          <div class="bg-white border p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'E-posta Bildirimleri' : 'Email Notifications' }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ locale === 'tr' ? 'SMTP sunucu ayarları' : 'SMTP server settings' }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.notificationSettings.emailEnabled" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            <div v-show="settings.notificationSettings.emailEnabled" class="space-y-4 mt-4 pt-4 border-t">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">SMTP Host</label>
                  <input v-model="settings.notificationSettings.smtp.host" type="text" class="input-field" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">SMTP Port</label>
                  <input v-model.number="settings.notificationSettings.smtp.port" type="number" class="input-field" placeholder="587" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Kullanıcı Adı' : 'Username' }}</label>
                  <input v-model="settings.notificationSettings.smtp.user" type="text" class="input-field" placeholder="email@example.com" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Şifre' : 'Password' }}</label>
                  <input v-model="settings.notificationSettings.smtp.pass" type="password" class="input-field" />
                </div>
              </div>
            </div>
          </div>

          <!-- Zamanlanmış Raporlar -->
          <div class="bg-white border p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm uppercase tracking-widest">{{ locale === 'tr' ? 'Zamanlanmış Raporlar' : 'Scheduled Reports' }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ locale === 'tr' ? 'Otomatik satış raporları WhatsApp ile gönderilir' : 'Automatic sales reports sent via WhatsApp' }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settings.reportSchedule.enabled" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            <div v-show="settings.reportSchedule.enabled" class="space-y-4 mt-4 pt-4 border-t">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Sıklık' : 'Frequency' }}</label>
                  <select v-model="settings.reportSchedule.frequency" class="input-field">
                    <option value="daily">{{ locale === 'tr' ? 'Günlük' : 'Daily' }}</option>
                    <option value="weekly">{{ locale === 'tr' ? 'Haftalık' : 'Weekly' }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'Gönderim Saati' : 'Send Time' }}</label>
                  <input v-model="settings.reportSchedule.sendTime" type="time" class="input-field" />
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">{{ locale === 'tr' ? 'WhatsApp Numarası' : 'WhatsApp Number' }}</label>
                <input v-model="settings.reportSchedule.whatsappNumber" type="text" class="input-field max-w-md" placeholder="+90 5XX XXX XX XX" />
                <p class="text-xs text-gray-400 mt-1">{{ locale === 'tr' ? 'Raporların gönderileceği numara' : 'Number to send reports to' }}</p>
              </div>
            </div>
          </div>

        </div>

        <div class="mt-6">
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? '...' : (locale === 'tr' ? 'Kaydet' : 'Save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
