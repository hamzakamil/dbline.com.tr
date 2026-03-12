import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('../pages/ProductList.vue')
  },
  {
    path: '/products/:slug',
    name: 'ProductDetail',
    component: () => import('../pages/ProductDetail.vue')
  },
  {
    path: '/category/:slug',
    name: 'CategoryProducts',
    component: () => import('../pages/ProductList.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../pages/Cart.vue')
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../pages/Checkout.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/Register.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../pages/About.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../pages/Contact.vue')
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: () => import('../pages/PrivacyPolicy.vue')
  },
  {
    path: '/refund-policy',
    name: 'RefundPolicy',
    component: () => import('../pages/RefundPolicy.vue')
  },
  {
    path: '/shipping-policy',
    name: 'ShippingPolicy',
    component: () => import('../pages/ShippingPolicy.vue')
  },
  {
    path: '/terms-of-service',
    name: 'TermsOfService',
    component: () => import('../pages/TermsOfService.vue')
  },
  {
    path: '/order-success',
    name: 'OrderSuccess',
    component: () => import('../pages/OrderSuccess.vue')
  },
  {
    path: '/settings',
    name: 'UserSettings',
    component: () => import('../pages/UserSettings.vue'),
    meta: { requiresAuth: true }
  },
  // Admin Routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../pages/admin/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('../pages/admin/Products.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/products/new',
    name: 'AdminProductNew',
    component: () => import('../pages/admin/ProductForm.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/products/:id/edit',
    name: 'AdminProductEdit',
    component: () => import('../pages/admin/ProductForm.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/categories',
    name: 'AdminCategories',
    component: () => import('../pages/admin/Categories.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('../pages/admin/Orders.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/orders/:id',
    name: 'AdminOrderDetail',
    component: () => import('../pages/admin/OrderDetail.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('../pages/admin/Settings.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/marketing',
    name: 'AdminMarketing',
    component: () => import('../pages/admin/Marketing.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/reviews',
    name: 'AdminReviews',
    component: () => import('../pages/admin/Reviews.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/sales-report',
    name: 'AdminSalesReport',
    component: () => import('../pages/admin/SalesReport.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/analytics',
    name: 'AdminAnalytics',
    component: () => import('../pages/admin/Analytics.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/search',
    name: 'SearchResults',
    component: () => import('../pages/SearchResults.vue')
  },
  {
    path: '/my-orders',
    name: 'MyOrders',
    component: () => import('../pages/MyOrders.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && user?.role !== 'admin') {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
