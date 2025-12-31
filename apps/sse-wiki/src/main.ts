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

// 优化：先挂载应用，再异步检查登录状态（不阻塞首次渲染）
app.mount('#app')

// 异步检查登录状态（不阻塞渲染）
const authStore = useAuthStore()
// 使用 void 明确表示我们不等待这个 Promise
void authStore.checkLoginStatus().catch((err) => {
  console.error('Failed to check login status:', err)
})
