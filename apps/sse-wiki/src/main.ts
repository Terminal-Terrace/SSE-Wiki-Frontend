import { createPinia } from 'pinia'
import { createApp, nextTick } from 'vue'

import App from './App.vue'
import router from './router'
import '@/assets/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// 等待应用挂载完成后处理登录回调
nextTick(() => {
  // 延迟导入避免在 Pinia 初始化前使用 store
  import('./composables/useAuth').then(({ useAuth }) => {
    const { handleLoginCallback } = useAuth()
    if (handleLoginCallback()) {
      console.log('Login callback handled successfully')
    }
  })
})
