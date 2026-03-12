import { useLanguageStore } from '../stores/language'
import { computed } from 'vue'

export function useLanguage() {
  const store = useLanguageStore()

  const locale = computed(() => store.locale)
  const t = computed(() => store.t)

  function localized(obj) {
    if (!obj) return ''
    return obj[store.locale] || obj.tr || obj.en || ''
  }

  function formatPrice(price) {
    if (price == null) return ''
    return `₺${price.toFixed(2)}`
  }

  return {
    locale,
    t,
    localized,
    formatPrice,
    setLocale: store.setLocale
  }
}
