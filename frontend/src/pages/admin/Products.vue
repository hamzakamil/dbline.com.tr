<script setup>
import { ref, onMounted } from 'vue'
import { useLanguage } from '../../composables/useLanguage'
import api from '../../utils/api'

const { formatPrice, localized, locale } = useLanguage()

const products = ref([])
const loading = ref(true)

async function fetchProducts() {
  loading.value = true
  try {
    const { data } = await api.get(`/products`, { params: { limit: 100 } })
    products.value = data.products
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm(locale.value === 'tr' ? 'Bu ürünü silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this product?')) return
  try {
    await api.delete(`/products/${id}`)
    products.value = products.value.filter(p => p._id !== id)
  } catch (error) {
    alert(error.response?.data?.message || 'Hata oluştu')
  }
}

onMounted(fetchProducts)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-dark-bg text-white">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-heading">{{ locale === 'tr' ? 'Ürün Yönetimi' : 'Product Management' }}</h1>
        <router-link to="/" class="text-xs underline opacity-70 hover:opacity-100">{{ locale === 'tr' ? 'Siteye Dön' : 'Back to Site' }}</router-link>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <nav class="flex flex-wrap gap-2 mb-8">
        <router-link to="/admin" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">Dashboard</router-link>
        <router-link to="/admin/products" class="px-4 py-2 bg-accent text-white text-sm">{{ locale === 'tr' ? 'Ürünler' : 'Products' }}</router-link>
        <router-link to="/admin/categories" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Kategoriler' : 'Categories' }}</router-link>
        <router-link to="/admin/orders" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Siparişler' : 'Orders' }}</router-link>
        <router-link to="/admin/sales-report" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Satış Raporu' : 'Sales Report' }}</router-link>
        <router-link to="/admin/analytics" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Analitik' : 'Analytics' }}</router-link>
        <router-link to="/admin/marketing" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Pazarlama' : 'Marketing' }}</router-link>
        <router-link to="/admin/reviews" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Yorumlar' : 'Reviews' }}</router-link>
        <router-link to="/admin/settings" class="px-4 py-2 bg-white border text-sm hover:bg-gray-50">{{ locale === 'tr' ? 'Ayarlar' : 'Settings' }}</router-link>
      </nav>

      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl">{{ locale === 'tr' ? 'Ürünler' : 'Products' }} ({{ products.length }})</h2>
        <router-link to="/admin/products/new" class="btn-primary text-sm">
          + {{ locale === 'tr' ? 'Yeni Ürün' : 'New Product' }}
        </router-link>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>

      <div v-else class="bg-white border overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Resim' : 'Image' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Ürün Adı' : 'Name' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Fiyat' : 'Price' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Stok' : 'Stock' }}</th>
              <th class="text-left px-4 py-3">{{ locale === 'tr' ? 'Durum' : 'Status' }}</th>
              <th class="text-right px-4 py-3">{{ locale === 'tr' ? 'İşlemler' : 'Actions' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product._id" class="border-b hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="w-12 h-12 bg-gray-light overflow-hidden">
                  <img :src="product.images?.[0] || '/placeholder.svg'" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium">{{ localized(product.name) }}</p>
                <p class="text-xs text-gray-400">{{ product.slug }}</p>
              </td>
              <td class="px-4 py-3">
                <span v-if="product.salePrice" class="line-through text-gray-400 mr-2">{{ formatPrice(product.price) }}</span>
                <span :class="product.salePrice ? 'text-red-500' : ''">{{ formatPrice(product.salePrice || product.price) }}</span>
              </td>
              <td class="px-4 py-3">{{ product.stock }}</td>
              <td class="px-4 py-3">
                <span :class="product.active ? 'text-green-600' : 'text-red-500'" class="text-xs">
                  {{ product.active ? (locale === 'tr' ? 'Aktif' : 'Active') : (locale === 'tr' ? 'Pasif' : 'Inactive') }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <router-link :to="`/admin/products/${product._id}/edit`" class="text-blue-600 hover:underline text-xs mr-3">
                  {{ locale === 'tr' ? 'Düzenle' : 'Edit' }}
                </router-link>
                <button @click="deleteProduct(product._id)" class="text-red-500 hover:underline text-xs">
                  {{ locale === 'tr' ? 'Sil' : 'Delete' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
