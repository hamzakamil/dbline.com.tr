<script setup>
import { ref, computed } from 'vue'
import { useLanguage } from '../../composables/useLanguage'

const { locale, setLocale } = useLanguage()

const isOpen = ref(false)
const searchQuery = ref('')

const countries = [
  { code: 'TR', name: 'Türkiye', currency: 'TL', symbol: '₺', lang: 'tr' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', lang: 'en' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', lang: 'en' },
  { code: 'DE', name: 'Deutschland', currency: 'EUR', symbol: '€', lang: 'en' },
  { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', lang: 'en' },
  { code: 'NL', name: 'Nederland', currency: 'EUR', symbol: '€', lang: 'en' },
  { code: 'IT', name: 'Italia', currency: 'EUR', symbol: '€', lang: 'en' },
  { code: 'ES', name: 'España', currency: 'EUR', symbol: '€', lang: 'en' },
  { code: 'SA', name: 'السعودية', currency: 'SAR', symbol: '﷼', lang: 'en' },
  { code: 'AE', name: 'الإمارات', currency: 'AED', symbol: 'د.إ', lang: 'en' },
  { code: 'JP', name: '日本', currency: 'JPY', symbol: '¥', lang: 'en' },
  { code: 'AZ', name: 'Azərbaycan', currency: 'AZN', symbol: '₼', lang: 'tr' }
]

const selectedCountry = ref(
  countries.find(c => c.lang === locale.value) || countries[0]
)

const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries
  const q = searchQuery.value.toLowerCase()
  return countries.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.code.toLowerCase().includes(q) ||
    c.currency.toLowerCase().includes(q)
  )
})

function selectCountry(country) {
  selectedCountry.value = country
  setLocale(country.lang)
  isOpen.value = false
  searchQuery.value = ''
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) searchQuery.value = ''
}
</script>

<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-sm"
    >
      <span>{{ selectedCountry.name }}</span>
      <span class="text-gray-400">|</span>
      <span>{{ selectedCountry.currency }} {{ selectedCountry.symbol }}</span>
      <svg class="w-3.5 h-3.5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 top-full mt-3 w-72 bg-white border border-gray-200 shadow-xl z-[80]"
      >
        <!-- Arama -->
        <div class="p-3 border-b border-gray-100">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="locale === 'tr' ? 'Ülke ara...' : 'Search country...'"
              class="w-full pl-9 pr-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <!-- Ülke listesi -->
        <div class="max-h-64 overflow-y-auto">
          <button
            v-for="country in filteredCountries"
            :key="country.code"
            @click="selectCountry(country)"
            :class="[
              'w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors',
              selectedCountry.code === country.code ? 'bg-accent/5' : ''
            ]"
          >
            <span :class="selectedCountry.code === country.code ? 'font-medium' : ''">{{ country.name }}</span>
            <span class="text-gray-400 text-xs">{{ country.currency }} {{ country.symbol }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div v-if="isOpen" class="fixed inset-0 z-[79]" @click="isOpen = false"></div>
  </div>
</template>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
