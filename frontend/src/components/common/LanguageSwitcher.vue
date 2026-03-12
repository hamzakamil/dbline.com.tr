<script setup>
import { useLanguage } from '../../composables/useLanguage'

const { locale, setLocale } = useLanguage()
</script>

<template>
  <div class="flex items-center gap-1 text-xs">
    <button
      @click="setLocale('tr')"
      :class="['px-1 py-0.5 transition-opacity', locale === 'tr' ? 'font-bold' : 'opacity-50 hover:opacity-100']"
    >TR</button>
    <span class="text-gray-300">|</span>
    <button
      @click="setLocale('en')"
      :class="['px-1 py-0.5 transition-opacity', locale === 'en' ? 'font-bold' : 'opacity-50 hover:opacity-100']"
    >EN</button>
  </div>
</template>
