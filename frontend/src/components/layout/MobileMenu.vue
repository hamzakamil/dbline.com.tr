<script setup>
import { ref } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import CountrySelector from '../common/CountrySelector.vue'

const props = defineProps({
  open: Boolean,
  categories: { type: Array, default: () => [] },
  childrenByParent: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['close'])
const { t, locale } = useLanguage()

const expandedCat = ref(null)

function catName(cat) {
  return locale.value === 'tr' ? cat.name.tr : (cat.name.en || cat.name.tr)
}

function hasChildren(cat) {
  return (props.childrenByParent[cat._id] || []).length > 0
}

function toggleExpand(cat) {
  expandedCat.value = expandedCat.value === cat._id ? null : cat._id
}
</script>

<template>
  <!-- Overlay -->
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 bg-black/50 z-[60]" @click="emit('close')"></div>
  </Transition>

  <!-- Menü -->
  <Transition name="slide">
    <div v-if="open" class="fixed top-0 left-0 w-80 h-full bg-white z-[70] overflow-y-auto">
      <div class="p-6">
        <!-- Kapat butonu -->
        <div class="flex justify-between items-center mb-8">
          <img src="/logo.svg" alt="DB Line Studio" class="h-10 w-auto" />
          <button @click="emit('close')">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Navigasyon -->
        <nav class="flex flex-col gap-1">
          <router-link to="/" class="text-sm uppercase tracking-widest py-3 border-b border-gray-100" @click="emit('close')">{{ t.nav.home }}</router-link>

          <div v-for="cat in categories" :key="cat._id">
            <!-- Alt kategorisi olan -->
            <template v-if="hasChildren(cat)">
              <button
                class="w-full flex items-center justify-between text-sm uppercase tracking-widest py-3 border-b border-gray-100 text-left"
                @click="toggleExpand(cat)"
              >
                {{ catName(cat) }}
                <svg
                  class="w-4 h-4 transition-transform duration-200 text-gray-400"
                  :class="{ 'rotate-180': expandedCat === cat._id }"
                  fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <!-- Alt kategoriler -->
              <Transition name="expand">
                <div v-if="expandedCat === cat._id" class="overflow-hidden">
                  <router-link
                    v-for="child in childrenByParent[cat._id]"
                    :key="child._id"
                    :to="`/category/${child.slug}`"
                    class="block text-sm py-2.5 pl-5 border-b border-gray-50 text-gray-600 hover:text-black transition-colors"
                    @click="emit('close')"
                  >
                    {{ catName(child) }}
                  </router-link>
                </div>
              </Transition>
            </template>
            <!-- Alt kategorisi olmayan -->
            <router-link
              v-else
              :to="`/category/${cat.slug}`"
              class="text-sm uppercase tracking-widest py-3 border-b border-gray-100 block"
              @click="emit('close')"
            >{{ catName(cat) }}</router-link>
          </div>

          <router-link to="/about" class="text-sm uppercase tracking-widest py-3 border-b border-gray-100" @click="emit('close')">{{ t.nav.about }}</router-link>
          <router-link to="/contact" class="text-sm uppercase tracking-widest py-3 border-b border-gray-100" @click="emit('close')">{{ t.nav.contact }}</router-link>
        </nav>

        <div class="mt-8">
          <CountrySelector />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
.expand-enter-active { transition: max-height 0.25s ease-out, opacity 0.2s ease; max-height: 300px; }
.expand-leave-active { transition: max-height 0.2s ease-in, opacity 0.15s ease; max-height: 300px; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
</style>
