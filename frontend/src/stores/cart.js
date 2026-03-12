import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cart') || '[]'))
  const isOpen = ref(false)

  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => {
      const price = item.salePrice || item.price
      return sum + (price * item.quantity)
    }, 0)
  )

  const shippingCost = computed(() => subtotal.value >= 500 ? 0 : 29.90)
  const total = computed(() => subtotal.value + shippingCost.value)

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  function addItem(product, size, color, quantity = 1) {
    const existingIndex = items.value.findIndex(
      item => item.productId === product._id && item.size === size && item.color === color
    )

    if (existingIndex > -1) {
      items.value[existingIndex].quantity += quantity
    } else {
      items.value.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0] || '',
        price: product.price,
        salePrice: product.salePrice,
        size,
        color,
        quantity
      })
    }

    saveCart()
    isOpen.value = true
  }

  function removeItem(index) {
    items.value.splice(index, 1)
    saveCart()
  }

  function updateQuantity(index, quantity) {
    if (quantity < 1) return
    items.value[index].quantity = quantity
    saveCart()
  }

  function clearCart() {
    items.value = []
    saveCart()
  }

  return { items, isOpen, itemCount, subtotal, shippingCost, total, addItem, removeItem, updateQuantity, clearCart }
})
