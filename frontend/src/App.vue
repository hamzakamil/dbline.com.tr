<script setup>
import { onMounted } from 'vue'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import CartDrawer from './components/cart/CartDrawer.vue'
import PromoPopup from './components/common/PromoPopup.vue'
import { useOrganizationSchema } from './composables/useSchema'
import { useThemeStore } from './stores/theme'

useOrganizationSchema()

const theme = useThemeStore()

onMounted(() => {
  theme.fetchAndApply()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
    <CartDrawer />
    <PromoPopup />
  </div>
</template>
