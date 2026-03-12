<script setup>
import { useLanguage } from '../../composables/useLanguage'

const { t, locale } = useLanguage()
</script>

<template>
  <aside class="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 z-40 border-r border-gray-200 py-8 px-5 overflow-y-auto"
    :style="{ backgroundColor: 'var(--color-header-bg)' }"
  >
    <!-- Logo -->
    <router-link to="/" class="mb-8">
      <img src="/logo.svg" alt="DB Line Studio" class="h-14 w-auto" />
    </router-link>

    <!-- Kategoriler -->
    <nav class="flex flex-col gap-1">
      <span class="text-[11px] uppercase tracking-widest text-gray-400 mb-2">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</span>
      <router-link to="/category/coraplar" class="side-link">{{ t.nav.socks }}</router-link>
      <router-link to="/category/icecekler" class="side-link">{{ t.nav.drinks }}</router-link>
      <router-link to="/category/cantalar" class="side-link">{{ t.nav.bags }}</router-link>
      <router-link to="/category/taytlar" class="side-link">{{ t.nav.leggings }}</router-link>
      <router-link to="/category/kazaklar" class="side-link">{{ t.nav.sweaters }}</router-link>
      <router-link to="/category/aksesuarlar" class="side-link">{{ t.nav.accessories }}</router-link>
      <router-link to="/category/kolleksiyon" class="side-link">{{ t.nav.collection }}</router-link>

      <div class="border-t border-gray-200 my-3"></div>

      <router-link to="/about" class="side-link">{{ t.nav.about }}</router-link>
      <router-link to="/contact" class="side-link">{{ t.nav.contact }}</router-link>
    </nav>
  </aside>
</template>

<style scoped>
.side-link {
  font-size: 14px;
  padding: 8px 12px;
  color: var(--color-primary);
  transition: all 0.2s;
  border-radius: 4px;
}
.side-link:hover {
  color: var(--color-accent);
  background-color: rgba(0, 0, 0, 0.03);
}
</style>
