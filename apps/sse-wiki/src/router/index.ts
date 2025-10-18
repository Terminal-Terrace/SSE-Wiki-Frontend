import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
          component: () => import('@/views/home/HomeView.vue'),
        },
        {
          path: 'knowledge-space',
          name: 'knowledge-space',
          component: () => import('@/views/space/OverviewView.vue'),
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
        // 模块详情页面
        {
          path: 'modules/:moduleId',
          name: 'ModuleDetail',
          component: () => import('@/views/module/ModuleDetailView.vue'),
          props: true,
          meta: { requiresAuth: true },
        },
        // 文章详情页面
        {
          path: 'articles/:articleId',
          name: 'ArticleDetail',
          component: () => import('@/views/article/ArticleDetailView.vue'),
          props: true,
          meta: { requiresAuth: true },
        },
        // 文章版本查看页面
        {
          path: 'articles/:articleId/version',
          name: 'ArticleVersion',
          component: () => import('@/views/article/ArticleVersionView.vue'),
          props: route => ({
            articleId: route.params.articleId,
            versionId: route.query.versionId,
            submissionId: route.query.submissionId,
          }),
          meta: { requiresAuth: true },
        },
        // 文章审核页面
        {
          path: 'articles/:articleId/review/:submissionId',
          name: 'ArticleReview',
          component: () => import('@/views/article/ArticleReviewView.vue'),
          props: true,
          meta: { requiresAuth: true },
        },
        // 新建文章页面
        {
          path: 'articles/create',
          name: 'ArticleCreate',
          component: () => import('@/views/article/ArticleCreateView.vue'),
          props: route => ({ moduleId: route.query.moduleId }),
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 如果是首次访问且未检查登录状态
  if (!authStore.hasChecked) {
    await authStore.checkLoginStatus()
  }

  // 需要登录的页面
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 可以在这里跳转到登录页面，或显示登录提示
    // 目前暂时允许访问，因为登录流程会在点击操作时触发
    next()
  }
  else {
    next()
  }
})

export default router
