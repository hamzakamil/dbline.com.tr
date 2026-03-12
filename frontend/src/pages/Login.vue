<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useLanguage } from '../composables/useLanguage'
import api from '../utils/api'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { t, locale } = useLanguage()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const googleEnabled = ref(false)
const googleClientId = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Giriş başarısız'
  } finally {
    loading.value = false
  }
}

async function fetchGoogleConfig() {
  try {
    const { data } = await api.get('/auth/google-client-id')
    googleEnabled.value = data.enabled
    googleClientId.value = data.clientId
  } catch {
    // Google giriş kapalı
  }
}

function handleGoogleLogin() {
  if (!window.google || !googleClientId.value) return
  window.google.accounts.id.initialize({
    client_id: googleClientId.value,
    callback: onGoogleResponse
  })
  window.google.accounts.id.prompt()
}

async function onGoogleResponse(response) {
  if (!response.credential) return
  loading.value = true
  error.value = ''
  try {
    await auth.loginWithGoogle(response.credential)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = err.response?.data?.message || (locale.value === 'tr' ? 'Google giriş başarısız' : 'Google sign-in failed')
  } finally {
    loading.value = false
  }
}

onMounted(fetchGoogleConfig)
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <h1 class="text-2xl font-heading text-center mb-8">{{ t.auth.login }}</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="text-xs text-gray-500 mb-1 block">{{ t.auth.email }}</label>
          <input v-model="email" type="email" class="input-field" required />
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">{{ t.auth.password }}</label>
          <input v-model="password" type="password" class="input-field" required />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? t.common.loading : t.auth.login }}
        </button>
      </form>

      <!-- Google ile giriş -->
      <template v-if="googleEnabled">
        <div class="flex items-center gap-3 my-6">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-xs text-gray-400 uppercase">{{ t.auth.orWith }}</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <button
          @click="handleGoogleLogin"
          :disabled="loading"
          class="w-full flex items-center justify-center gap-3 border border-gray-300 px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span class="text-sm">{{ t.auth.googleLogin }}</span>
        </button>
      </template>

      <p class="text-center text-sm text-gray-500 mt-6">
        {{ t.auth.noAccount }}
        <router-link to="/register" class="text-accent underline">{{ t.auth.register }}</router-link>
      </p>
    </div>
  </div>
</template>
