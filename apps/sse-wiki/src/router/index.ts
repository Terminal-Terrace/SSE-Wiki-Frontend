import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'default',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/default/HomeView.vue'),
        },
        {
          path: 'knowledge-space',
          name: 'knowledge-space',
          component: () => import('@/views/knowledge-space/OverviewView.vue'),
        },
        {
          path: 'assistant',
          name: 'assistant',
          component: () => import('@/views/assistant/AssistantView.vue'),
        },
        {
          path: 'search',
          name: 'search',
          component: () => import('@/views/search/SearchView.vue'),
        },
      ],
    },
  ],
})

export default router
