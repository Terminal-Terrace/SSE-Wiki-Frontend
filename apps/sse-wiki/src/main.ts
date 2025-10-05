import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import '@/assets/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 在应用启动时检查登录状态
const authStore = useAuthStore()
authStore.checkLoginStatus().then(() => {
  app.mount('#app')
})
