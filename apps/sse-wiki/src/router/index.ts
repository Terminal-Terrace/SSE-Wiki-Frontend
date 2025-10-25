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
        // 模块详情页面（允许游客浏览，编辑功能需要登录）
        {
          path: 'modules/:moduleId',
          name: 'ModuleDetail',
          component: () => import('@/views/module/ModuleDetailView.vue'),
          props: true,
        },
        // 文章详情页面（允许游客阅读，编辑功能需要登录）
        {
          path: 'articles/:articleId',
          name: 'ArticleDetail',
          component: () => import('@/views/article/ArticleDetailView.vue'),
          props: true,
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
        },
        // 文章审核页面（需要审核权限）
        {
          path: 'articles/:articleId/review/:submissionId',
          name: 'ArticleReview',
          component: () => import('@/views/article/ArticleReviewView.vue'),
          props: true,
          meta: { requiresAuth: true, strictAuth: true },
        },
        // 新建文章页面
        {
          path: 'articles/create',
          name: 'ArticleCreate',
          component: () => import('@/views/article/ArticleCreateView.vue'),
          props: route => ({ moduleId: route.query.moduleId }),
          meta: { requiresAuth: true, strictAuth: true }, // 严格要求登录
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

  // 严格要求登录的页面（如创建、审核等操作）
  if (to.meta.strictAuth && !authStore.isAuthenticated) {
    // 保存目标路由，登录后跳转回来
    const redirect = to.fullPath

    // 跳转到首页并提示登录
    next({
      path: '/',
      query: { redirect },
    })

    // 在首页会显示登录提示
    return
  }

  // requiresAuth 标记的页面：允许访问，但页面内会提示登录后才能使用某些功能
  // 这样用户可以先浏览内容，需要操作时再登录（更好的UX）
  next()
})

export default router
