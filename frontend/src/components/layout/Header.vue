<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import { useCartStore } from '../../stores/cart'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'
import CountrySelector from '../common/CountrySelector.vue'
import SmartSearch from '../common/SmartSearch.vue'
import MobileMenu from './MobileMenu.vue'
import SideMenu from './SideMenu.vue'
import MegaMenu from './MegaMenu.vue'
import api from '../../utils/api'

const { t, locale, localized } = useLanguage()
const cart = useCartStore()
const auth = useAuthStore()
const theme = useThemeStore()

const mobileMenuOpen = ref(false)
const searchOpen = ref(false)
const userMenuOpen = ref(false)
const bannerText = ref({ tr: '', en: '' })
const bannerActive = ref(true)
const megaMenuCategory = ref(null)
const categories = ref([])
const openDropdown = ref(null)


const headerHidden = ref(false)
let lastScrollY = 0

// Theme-based computed
const headerType = computed(() => theme.themeConfig.headerType || 'sticky')
const menuPosition = computed(() => theme.layoutConfig.menuPosition || 'top')
const menuType = computed(() => theme.layoutConfig.menuType || 'standard')
const showPromoBars = computed(() => theme.layoutConfig.showPromoBars !== false)
const showTopBanner = computed(() => theme.layoutConfig.showTopBanner !== false)

// Dinamik kategoriler: üst kategoriler (parent yok)
const parentCategories = computed(() => categories.value.filter(c => !c.parent))
// Alt kategorileri slug'a göre grupla
const childrenByParent = computed(() => {
  const map = {}
  categories.value.filter(c => c.parent).forEach(c => {
    const parentId = typeof c.parent === 'object' ? c.parent._id : c.parent
    if (!map[parentId]) map[parentId] = []
    map[parentId].push(c)
  })
  return map
})

function hasChildren(cat) {
  return (childrenByParent.value[cat._id] || []).length > 0
}

const headerClasses = computed(() => {
  const classes = ['header-slide', 'z-50']
  if (headerType.value === 'sticky') classes.push('sticky', 'top-0')
  if (headerType.value === 'transparent') classes.push('absolute', 'top-0', 'left-0', 'right-0')
  if (headerHidden.value && headerType.value === 'sticky') classes.push('header-hidden')
  return classes
})

function onScroll() {
  if (headerType.value !== 'sticky') return
  const currentY = window.scrollY
  if (currentY > lastScrollY && currentY > 100) {
    headerHidden.value = true
  } else if (currentY < lastScrollY) {
    headerHidden.value = false
  }
  lastScrollY = currentY
}

function showMegaMenu(cat) {
  if (menuType.value === 'mega' && hasChildren(cat)) megaMenuCategory.value = cat
}

function hideMegaMenu() {
  megaMenuCategory.value = null
}

function toggleDropdown(cat) {
  if (openDropdown.value === cat._id) {
    openDropdown.value = null
  } else {
    openDropdown.value = cat._id
  }
}

function closeDropdown() {
  openDropdown.value = null
}

async function fetchCategories() {
  try {
    const { data } = await api.get(`/categories`)
    categories.value = data
  } catch (e) {
    // Varsayılan boş
  }
}

async function fetchBannerSettings() {
  try {
    const { data } = await api.get(`/admin/settings`)
    if (data.topBanner) {
      bannerText.value = data.topBanner.text || bannerText.value
      bannerActive.value = data.topBanner.active !== false
    }
  } catch (e) {
    // Varsayılan değerler kullanılır
  }
}

function onClickOutside(e) {
  if (openDropdown.value && !e.target.closest('nav')) {
    openDropdown.value = null
  }
}

onMounted(() => {
  fetchCategories()
  fetchBannerSettings()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <!-- Üst banner -->
  <div
    v-if="bannerActive && showTopBanner"
    class="text-center py-3 relative"
    :style="{ backgroundColor: 'var(--color-banner-bg)', color: 'var(--color-banner-text)', fontSize: '14px', letterSpacing: '0.06em' }"
  >
    <a
      href="https://www.instagram.com/dblinestudio/"
      target="_blank"
      class="absolute left-6 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
      :style="{ color: 'var(--color-banner-text)' }"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    </a>
    {{ localized(bannerText) || (locale === 'tr' ? 'burada olduğunuz için çok mutluyum.' : "i'm so happy you're here.") }}
  </div>

  <!-- Side Menu (menuPosition === 'side') -->
  <SideMenu v-if="menuPosition === 'side'" />

  <header
    :class="headerClasses"
    :style="{
      backgroundColor: headerType === 'transparent' ? 'transparent' : 'var(--color-header-bg)'
    }"
  >
    <!-- Ana header satırı -->
    <div class="page-width">
      <div class="flex items-center justify-between" :style="{ paddingTop: 'var(--header-padding)', paddingBottom: 'var(--header-padding)' }">
        <!-- Sol: Hamburger + Logo -->
        <div class="flex items-center gap-4">
          <button
            v-if="menuPosition === 'hamburger' || menuPosition === 'top'"
            class="md:hidden"
            @click="mobileMenuOpen = true"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <!-- Hamburger menü - masaüstünde de göster -->
          <button
            v-if="menuPosition === 'hamburger'"
            class="hidden md:block"
            @click="mobileMenuOpen = true"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <router-link to="/">
            <img src="/logo.svg" alt="DB Line Studio" class="w-auto" :style="{ height: 'var(--logo-header-height)' }" />
          </router-link>
        </div>

        <!-- Sağ: Ülke seçici, Arama, Kullanıcı, Sepet -->
        <div class="flex items-center gap-5 md:gap-7">
          <CountrySelector class="hidden md:block" />

          <!-- Arama -->
          <button @click="searchOpen = !searchOpen" class="hover:opacity-70 transition-opacity">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <!-- Kullanıcı -->
          <div class="relative">
            <button @click="userMenuOpen = !userMenuOpen" class="hover:opacity-70 transition-opacity">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
            <div
              v-if="userMenuOpen"
              class="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 shadow-lg py-2 z-50"
              @mouseleave="userMenuOpen = false"
            >
              <template v-if="auth.isLoggedIn">
                <div class="px-4 py-2 text-sm text-gray-500 border-b">{{ auth.user?.name }}</div>
                <router-link
                  v-if="auth.isAdmin"
                  to="/admin"
                  class="block px-4 py-2 text-sm hover:bg-gray-50"
                  @click="userMenuOpen = false"
                >{{ t.nav.admin }}</router-link>
                <router-link to="/my-orders" class="block px-4 py-2 text-sm hover:bg-gray-50" @click="userMenuOpen = false">{{ t.nav.myOrders }}</router-link>
                <router-link to="/settings" class="block px-4 py-2 text-sm hover:bg-gray-50" @click="userMenuOpen = false">{{ locale === 'tr' ? 'Ayarlarım' : 'My Settings' }}</router-link>
                <button @click="auth.logout(); userMenuOpen = false" class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">{{ t.nav.logout }}</button>
              </template>
              <template v-else>
                <router-link to="/login" class="block px-4 py-2 text-sm hover:bg-gray-50" @click="userMenuOpen = false">{{ t.nav.login }}</router-link>
                <router-link to="/register" class="block px-4 py-2 text-sm hover:bg-gray-50" @click="userMenuOpen = false">{{ t.nav.register }}</router-link>
              </template>
            </div>
          </div>

          <!-- Sepet -->
          <button @click="cart.isOpen = true" class="relative hover:opacity-70 transition-opacity">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span
              v-if="cart.itemCount > 0"
              class="absolute -top-2 -right-2 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: 'var(--color-accent)' }"
            >{{ cart.itemCount }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop Navigasyon - sadece menuPosition === 'top' -->
    <nav v-if="menuPosition === 'top'" class="hidden md:block border-t border-gray-100 relative">
      <div class="page-width">
        <div class="flex flex-wrap items-center gap-y-1 py-3" :style="{ columnGap: 'var(--nav-spacing)' }">
          <div v-for="cat in parentCategories" :key="cat._id">
            <!-- Alt kategorisi olan: tıkla aç/kapat -->
            <button
              v-if="hasChildren(cat)"
              class="nav-link inline-flex items-center gap-1"
              @click.stop="toggleDropdown(cat)"
            >
              {{ locale === 'tr' ? cat.name.tr : (cat.name.en || cat.name.tr) }}
              <svg
                class="w-3 h-3 transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === cat._id }"
                fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <!-- Alt kategorisi olmayan: direkt link -->
            <router-link
              v-else
              :to="`/category/${cat.slug}`"
              class="nav-link"
            >
              {{ locale === 'tr' ? cat.name.tr : (cat.name.en || cat.name.tr) }}
            </router-link>
          </div>
        </div>
        <div class="flex items-center pb-3" :style="{ columnGap: 'var(--nav-spacing)' }">
          <router-link to="/about" class="nav-link">{{ t.nav.about }}</router-link>
          <router-link to="/contact" class="nav-link">{{ t.nav.contact }}</router-link>
        </div>
      </div>

      <!-- Full-width alt kategori paneli - promo barların üzerine biner -->
      <Transition name="dropdown">
        <div
          v-if="openDropdown"
          class="absolute left-0 right-0 top-full border-t border-gray-100 shadow-sm z-50"
          :style="{ backgroundColor: 'var(--color-dropdown-bg)' }"
        >
          <div class="page-width" :style="{ paddingTop: 'var(--dropdown-padding-top)', paddingBottom: 'var(--dropdown-padding-bottom)' }">
            <div class="flex flex-col gap-4">
              <router-link
                v-for="child in childrenByParent[openDropdown]"
                :key="child._id"
                :to="`/category/${child.slug}`"
                class="text-sm hover:text-accent transition-colors"
                :style="{ color: 'var(--color-primary)' }"
                @click="closeDropdown"
              >
                {{ locale === 'tr' ? child.name.tr : (child.name.en || child.name.tr) }}
              </router-link>
            </div>
          </div>
        </div>
      </Transition>
    </nav>

    <!-- Mega Menu Dropdown (menuType === 'mega' için) -->
    <MegaMenu
      v-if="menuType === 'mega' && megaMenuCategory"
      :category="megaMenuCategory"
      :children="childrenByParent[megaMenuCategory._id] || []"
      @mouseenter="megaMenuCategory = megaMenuCategory"
      @mouseleave="hideMegaMenu"
    />
  </header>

  <!-- Promo barlar -->
  <template v-if="showPromoBars">
    <div
      class="text-center py-1.5"
      :style="{ backgroundColor: 'var(--color-banner-bg)', color: 'var(--color-banner-text)', fontSize: '13px', letterSpacing: '0.04em' }"
    >
      <router-link to="/category/cantalar" class="hover:underline">
        {{ locale === 'tr' ? '500 TL üzeri siparişlerde kargo bedava' : 'Free shipping on orders over 500 TL' }} &rarr;
      </router-link>
    </div>
    <div class="text-white text-center py-1.5" style="background-color: #5C3F23; font-size: 13px; letter-spacing: 0.04em;">
      <router-link to="/category/taytlar" class="hover:underline">
        {{ locale === 'tr' ? 'İndirimli tayt buradan alabilirsiniz' : 'Get discounted leggings here' }} &rarr;
      </router-link>
    </div>
  </template>

  <!-- Akıllı Arama overlay -->
  <SmartSearch v-if="searchOpen" @close="searchOpen = false" />

  <!-- Mobil menü -->
  <MobileMenu
    :open="mobileMenuOpen"
    :categories="parentCategories"
    :children-by-parent="childrenByParent"
    @close="mobileMenuOpen = false"
  />
</template>

<style scoped>
.nav-link {
  font-size: var(--font-size-nav);
  color: var(--color-nav-text);
  transition: color 0.2s;
  white-space: nowrap;
}
.nav-link:hover {
  color: var(--color-nav-hover);
}
.nav-arrow {
  font-size: 10px;
  margin-left: 2px;
  vertical-align: middle;
}
.header-slide {
  transition: transform 0.3s ease;
}
.header-hidden {
  transform: translateY(-100%);
}
.dropdown-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
