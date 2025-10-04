import { createRouter, createWebHistory } from 'vue-router'

const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      props: route => ({
        state: route.query.state,
        redirect: route.query.redirect,
      }),
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
  ],
})

export default router
