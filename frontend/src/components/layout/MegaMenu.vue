<script setup>
import { useLanguage } from '../../composables/useLanguage'

const props = defineProps({
  category: { type: Object, default: null },
  children: { type: Array, default: () => [] }
})

const { locale } = useLanguage()

function catName(cat) {
  if (!cat || !cat.name) return ''
  return locale.value === 'tr' ? cat.name.tr : (cat.name.en || cat.name.tr)
}
</script>

<template>
  <div
    v-if="category"
    class="absolute left-0 right-0 z-50 border-t border-gray-100 shadow-lg"
    :style="{ backgroundColor: 'var(--color-header-bg)' }"
  >
    <div class="page-width py-6">
      <div class="grid grid-cols-4 gap-8">
        <!-- Alt kategoriler -->
        <div>
          <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-3">
            {{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}
          </h4>
          <ul class="space-y-2">
            <li v-for="child in children" :key="child._id">
              <router-link
                :to="`/category/${child.slug}`"
                class="text-sm hover:text-accent transition-colors"
                :style="{ color: 'var(--color-primary)' }"
              >
                {{ catName(child) }}
              </router-link>
            </li>
            <li v-if="!children.length" class="text-xs text-gray-400">
              {{ locale === 'tr' ? 'Alt kategori yok' : 'No subcategories' }}
            </li>
          </ul>
        </div>

        <!-- Öne çıkan ürün alanı -->
        <div class="col-span-2 flex items-center justify-center">
          <div class="text-center text-gray-400 text-sm">
            <div v-if="category.image" class="w-48 h-48 mx-auto mb-3 overflow-hidden rounded-lg">
              <img :src="category.image" :alt="catName(category)" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            {{ catName(category) }}
          </div>
        </div>

        <!-- Hızlı linkler -->
        <div>
          <h4 class="text-xs uppercase tracking-widest text-gray-400 mb-3">
            {{ locale === 'tr' ? 'Hızlı Linkler' : 'Quick Links' }}
          </h4>
          <ul class="space-y-2">
            <li>
              <router-link
                :to="`/category/${category.slug}`"
                class="text-sm hover:text-accent transition-colors"
                :style="{ color: 'var(--color-primary)' }"
              >
                {{ locale === 'tr' ? 'Tümünü Gör' : 'View All' }} &rarr;
              </router-link>
            </li>
            <li>
              <router-link to="/products" class="text-sm hover:text-accent transition-colors" :style="{ color: 'var(--color-primary)' }">
                {{ locale === 'tr' ? 'Yeni Gelenler' : 'New Arrivals' }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
