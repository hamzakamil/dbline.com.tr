import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'


export const useProductStore = defineStore('products', () => {
  const products = ref([])
  const product = ref(null)
  const categories = ref([])
  const loading = ref(false)
  const total = ref(0)
  const pages = ref(0)

  async function fetchProducts(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get(`/products`, { params })
      products.value = data.products
      total.value = data.total
      pages.value = data.pages
    } catch (error) {
      console.error('Ürünler yüklenemedi:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(slug) {
    loading.value = true
    try {
      const { data } = await api.get(`/products/${slug}`)
      product.value = data
    } catch (error) {
      console.error('Ürün yüklenemedi:', error)
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get(`/categories`)
      categories.value = data
    } catch (error) {
      console.error('Kategoriler yüklenemedi:', error)
    }
  }

  return { products, product, categories, loading, total, pages, fetchProducts, fetchProduct, fetchCategories }
})
