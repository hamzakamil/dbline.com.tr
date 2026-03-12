<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLanguage } from '../../composables/useLanguage'

const emit = defineEmits(['close'])
const { t } = useLanguage()
const router = useRouter()
const query = ref('')

function search() {
  if (query.value.trim()) {
    router.push({ path: '/products', query: { search: query.value.trim() } })
    emit('close')
  }
}
</script>

<template>
  <div class="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg z-50">
    <div class="page-width py-4">
      <div class="flex items-center gap-4">
        <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="query"
          :placeholder="t.nav.search"
          class="flex-1 text-sm focus:outline-none"
          @keyup.enter="search"
          autofocus
        />
        <button @click="emit('close')" class="text-gray-400 hover:text-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
