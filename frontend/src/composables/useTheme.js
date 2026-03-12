import { useThemeStore } from '../stores/theme'
import { storeToRefs } from 'pinia'

export function useTheme() {
  const store = useThemeStore()
  const {
    themeConfig,
    layoutConfig,
    loaded,
    buttonRadius,
    isSticky,
    isTransparent,
    menuPosition,
    menuType
  } = storeToRefs(store)

  return {
    themeConfig,
    layoutConfig,
    loaded,
    buttonRadius,
    isSticky,
    isTransparent,
    menuPosition,
    menuType,
    applyTheme: store.applyTheme,
    fetchAndApply: store.fetchAndApply
  }
}
