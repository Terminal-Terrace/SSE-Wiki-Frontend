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
          component: () => import('@/views/home/HomeView.vue'),
        },
        {
          path: 'user-info',
          name: 'user-info',
          component: () => import('@/views/user/UserInfo.vue'),
          meta: { requiresAuth: true, strictAuth: true }, // 需要登录才能访问个人中心
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

// 路由守卫 - 延迟加载认证 store，只在需要时加载
router.beforeEach(async (to, _from, next) => {
  // 优化：只在需要认证的页面才加载认证 store
  if (to.meta.strictAuth) {
    // 动态导入认证 store（延迟加载）
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    // 严格要求登录的页面：先检查登录状态
    if (!authStore.hasChecked) {
      await authStore.checkLoginStatus()
    }

    if (!authStore.isAuthenticated) {
      // 保存目标路由，登录后跳转回来
      const redirect = to.fullPath
      next({
        path: '/',
        query: { redirect },
      })
      return
    }
  }
  // 普通页面：不加载认证 store，不阻塞导航
  // 如果页面内需要认证，组件内部会处理

  // requiresAuth 标记的页面：允许访问，但页面内会提示登录后才能使用某些功能
  // 这样用户可以先浏览内容，需要操作时再登录（更好的UX）
  next()
})

export default router
