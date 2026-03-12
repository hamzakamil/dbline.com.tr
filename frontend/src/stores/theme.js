import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useThemeStore = defineStore('theme', () => {
  const themeConfig = ref({
    colors: {
      primary: '#121212',
      secondary: '#ffffff',
      accent: '#CA9C53',
      accentDark: '#A67D3D',
      background: '#FFF6E6',
      headerBg: '#FFF6E6',
      footerBg: '#242833',
      bannerBg: '#FFE8FF',
      bannerText: '#5C3D3D'
    },
    fonts: {
      primary: 'Inter',
      heading: 'Inter'
    },
    buttonStyle: 'sharp',
    headerType: 'sticky'
  })

  const layoutConfig = ref({
    menuPosition: 'top',
    menuType: 'standard',
    categoryListStyle: 'grid',
    showPromoBars: true,
    showTopBanner: true
  })

  const loaded = ref(false)

  // Getters
  const buttonRadius = computed(() => {
    const map = { sharp: '0px', rounded: '8px', pill: '9999px' }
    return map[themeConfig.value.buttonStyle] || '0px'
  })

  const isSticky = computed(() => themeConfig.value.headerType === 'sticky')
  const isTransparent = computed(() => themeConfig.value.headerType === 'transparent')
  const menuPosition = computed(() => layoutConfig.value.menuPosition)
  const menuType = computed(() => layoutConfig.value.menuType)

  // CSS Variables uygula
  function applyTheme(config) {
    const root = document.documentElement
    const c = config.colors || themeConfig.value.colors

    // Temel renkler
    root.style.setProperty('--color-primary', c.primary)
    root.style.setProperty('--color-secondary', c.secondary)
    root.style.setProperty('--color-accent', c.accent)
    root.style.setProperty('--color-accent-dark', c.accentDark)
    root.style.setProperty('--color-background', c.background)
    root.style.setProperty('--color-header-bg', c.headerBg)
    root.style.setProperty('--color-footer-bg', c.footerBg)
    root.style.setProperty('--color-banner-bg', c.bannerBg)
    root.style.setProperty('--color-banner-text', c.bannerText)

    // Navigasyon renkleri
    root.style.setProperty('--color-nav-text', c.navText || c.primary)
    root.style.setProperty('--color-nav-hover', c.navHover || c.accent)
    root.style.setProperty('--color-dropdown-bg', c.dropdownBg || '#FFFAF2')

    // Fontlar
    const f = config.fonts || themeConfig.value.fonts
    const fontStack = (name) => `'${name}', 'Helvetica Neue', Arial, sans-serif`
    root.style.setProperty('--font-primary', fontStack(f.primary))
    root.style.setProperty('--font-heading', fontStack(f.heading))

    // Buton
    const map = { sharp: '0px', rounded: '8px', pill: '9999px' }
    root.style.setProperty('--btn-radius', map[config.buttonStyle] || '0px')

    // Yazı boyutları
    const typo = config.typography || {}
    root.style.setProperty('--font-size-body', (typo.bodyFontSize || 16) + 'px')
    root.style.setProperty('--font-size-nav', (typo.navFontSize || 15) + 'px')
    root.style.setProperty('--font-size-heading', (typo.headingFontSize || 30) + 'px')
    root.style.setProperty('--letter-spacing', (typo.letterSpacing || 0.06) + 'rem')

    // Logo boyutları
    const logo = config.logo || {}
    root.style.setProperty('--logo-header-height', (logo.headerHeight || 80) + 'px')
    root.style.setProperty('--logo-footer-height', (logo.footerHeight || 56) + 'px')

    // Boşluklar
    const sp = config.spacing || {}
    root.style.setProperty('--header-padding', (sp.headerPadding || 32) + 'px')
    root.style.setProperty('--nav-spacing', (sp.navSpacing || 28) + 'px')
    root.style.setProperty('--section-padding', (sp.sectionPadding || 64) + 'px')
    root.style.setProperty('--product-grid-gap', (sp.productGridGap || 24) + 'px')
    root.style.setProperty('--dropdown-padding-top', (sp.dropdownPaddingTop || 35) + 'px')
    root.style.setProperty('--dropdown-padding-bottom', (sp.dropdownPaddingBottom || 30) + 'px')

    // Düzen
    const lay = config.layout || {}
    root.style.setProperty('--page-width', (lay.pageWidth || 1248) + 'px')
    root.style.setProperty('--product-grid-cols', lay.productGridCols || 4)
    root.style.setProperty('--hero-max-height', (lay.heroMaxHeight || 85) + 'vh')
    root.style.setProperty('--category-grid-cols', lay.categoryGridCols || 3)

    root.style.setProperty('--color-bg', c.background)
    document.body.style.backgroundColor = c.background
    document.body.style.color = c.primary

    // Google Fonts dinamik yükleme
    updateGoogleFonts(f.primary, f.heading)
  }

  function updateGoogleFonts(primary, heading) {
    const fonts = new Set([primary, heading])
    const existing = document.getElementById('dynamic-google-fonts')
    if (existing) existing.remove()

    const families = [...fonts].map(f => `family=${f}:wght@300;400;500;600;700`).join('&')
    const link = document.createElement('link')
    link.id = 'dynamic-google-fonts'
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }

  // API'den al ve uygula
  async function fetchAndApply() {
    try {
      const { data } = await api.get('/admin/settings')
      if (data.themeConfig) {
        themeConfig.value = { ...themeConfig.value, ...data.themeConfig }
      }
      if (data.layoutConfig) {
        layoutConfig.value = { ...layoutConfig.value, ...data.layoutConfig }
      }
      applyTheme(themeConfig.value)
      loaded.value = true
    } catch {
      // Varsayılan tema ile devam et
      applyTheme(themeConfig.value)
      loaded.value = true
    }
  }

  return {
    themeConfig,
    layoutConfig,
    loaded,
    buttonRadius,
    isSticky,
    isTransparent,
    menuPosition,
    menuType,
    applyTheme,
    fetchAndApply
  }
})
