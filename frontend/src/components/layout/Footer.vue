<script setup>
import { useLanguage } from '../../composables/useLanguage'
import { ref } from 'vue'

const { t } = useLanguage()
const email = ref('')
</script>

<template>
  <footer class="bg-dark-bg text-white">
    <!-- Bülten -->
    <div class="border-b border-gray-800">
      <div class="page-width py-12 text-center">
        <h3 class="text-lg font-heading mb-2">{{ t.footer.newsletter }}</h3>
        <p class="text-gray-400 text-sm mb-6">{{ t.footer.newsletterDesc }}</p>
        <form class="flex max-w-md mx-auto" @submit.prevent>
          <input
            v-model="email"
            type="email"
            :placeholder="t.footer.emailPlaceholder"
            class="flex-1 bg-transparent border border-gray-600 px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors"
          />
          <button class="bg-accent text-white px-6 py-3 text-sm uppercase tracking-widest hover:bg-accent-dark transition-colors" :style="{ borderRadius: 'var(--btn-radius)' }">
            {{ t.footer.subscribe }}
          </button>
        </form>
      </div>
    </div>

    <!-- Footer linkleri -->
    <div class="page-width py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Marka -->
        <div>
          <img src="/dblinelogo.jpg" alt="DB Line Studio" class="w-auto mb-4" :style="{ height: 'var(--logo-footer-height)' }" />
          <p class="text-gray-400 text-sm leading-relaxed">
            Premium kalitede tayt, çorap ve spor aksesuarları.
          </p>
        </div>

        <!-- Hızlı Linkler -->
        <div>
          <h4 class="text-xs uppercase tracking-widest mb-4">{{ t.nav.home }}</h4>
          <div class="flex flex-col gap-2">
            <router-link to="/category/taytlar" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.nav.leggings }}</router-link>
            <router-link to="/category/coraplar" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.nav.socks }}</router-link>
            <router-link to="/category/aksesuarlar" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.nav.accessories }}</router-link>
            <router-link to="/about" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.nav.about }}</router-link>
          </div>
        </div>

        <!-- Yardım -->
        <div>
          <h4 class="text-xs uppercase tracking-widest mb-4">{{ t.footer.help }}</h4>
          <div class="flex flex-col gap-2">
            <router-link to="/contact" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.nav.contact }}</router-link>
            <router-link to="/shipping-policy" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.footer.shipping }}</router-link>
            <router-link to="/refund-policy" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.footer.returns }}</router-link>
            <router-link to="/privacy-policy" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.footer.privacy }}</router-link>
            <router-link to="/terms-of-service" class="text-gray-400 text-sm hover:text-accent transition-colors">{{ t.footer.terms }}</router-link>
          </div>
        </div>

        <!-- Sosyal Medya -->
        <div>
          <h4 class="text-xs uppercase tracking-widest mb-4">{{ t.footer.followUs }}</h4>
          <div class="flex gap-4">
            <a href="https://www.instagram.com/dblinestudio/" target="_blank" class="text-gray-400 hover:text-accent transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-accent transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" class="text-gray-400 hover:text-accent transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Copyright + Ödeme Logoları -->
    <div class="border-t border-gray-700">
      <div class="page-width py-5">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <!-- Sol: Logo + Copyright -->
          <div class="flex items-center gap-3">
            <p class="text-gray-500 text-xs">&copy; {{ new Date().getFullYear() }} DB Line Studio. {{ t.footer.rights }}</p>
          </div>
          <!-- Sağ: Ödeme kartı logoları -->
          <div class="flex items-center gap-2">
            <!-- Visa -->
            <svg class="h-6 w-10" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="32" rx="4" fill="#fff" fill-opacity="0.1" stroke="#555" stroke-width="0.5"/>
              <path d="M19.5 21h-3l1.9-11.5h3L19.5 21zm12.7-11.2c-.6-.2-1.5-.5-2.7-.5-3 0-5 1.5-5 3.7 0 1.6 1.5 2.5 2.6 3 1.1.6 1.5 1 1.5 1.5 0 .8-1 1.2-1.8 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.2 0 5.2-1.5 5.2-3.8 0-1.3-.8-2.3-2.5-3.1-1-.5-1.7-.9-1.7-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.4-2.4zm7.8-.3h-2.3c-.7 0-1.3.2-1.6 1L32 21h3.2l.6-1.8h3.9l.4 1.8H43L40.8 9.5h-2.8zm-2.3 8.3l1.2-3.4.4-1.2.2 1.1.7 3.5h-2.5zM16.3 9.5L13.4 17l-.3-1.5c-.6-1.8-2.2-3.8-4.1-4.8l2.7 10.2h3.2l4.8-11.5h-3.4z" fill="#9ca3af"/>
              <path d="M10.6 9.5H5.8l-.1.3c3.8.9 6.3 3.2 7.3 5.9l-1.1-5.2c-.1-.7-.6-1-1.3-1z" fill="#6b7280"/>
            </svg>
            <!-- Mastercard -->
            <svg class="h-6 w-10" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="32" rx="4" fill="#fff" fill-opacity="0.1" stroke="#555" stroke-width="0.5"/>
              <circle cx="19" cy="16" r="8" fill="#6b7280" fill-opacity="0.6"/>
              <circle cx="29" cy="16" r="8" fill="#9ca3af" fill-opacity="0.6"/>
              <path d="M24 9.8a8 8 0 010 12.4 8 8 0 000-12.4z" fill="#78716c" fill-opacity="0.7"/>
            </svg>
            <!-- American Express -->
            <svg class="h-6 w-10" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="32" rx="4" fill="#fff" fill-opacity="0.1" stroke="#555" stroke-width="0.5"/>
              <text x="24" y="18" text-anchor="middle" fill="#9ca3af" font-size="7" font-weight="700" font-family="Arial, sans-serif">AMEX</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
