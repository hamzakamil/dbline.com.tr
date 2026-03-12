import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import tr from '../i18n/tr.json'
import en from '../i18n/en.json'

const messages = { tr, en }

export const useLanguageStore = defineStore('language', () => {
  const locale = ref(localStorage.getItem('locale') || 'tr')

  const t = computed(() => messages[locale.value])

  function setLocale(lang) {
    locale.value = lang
    localStorage.setItem('locale', lang)
    document.documentElement.lang = lang
  }

  function translate(key) {
    const keys = key.split('.')
    let result = messages[locale.value]
    for (const k of keys) {
      result = result?.[k]
    }
    return result || key
  }

  return { locale, t, setLocale, translate }
})
