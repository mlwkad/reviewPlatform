// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import Login from '@/views/Login.vue'
import MainLayout from '@/views/MainLayout.vue'
import TravelList from '@/views/TravelList.vue'
import RecycleBin from '@/views/RecycleBin.vue'
import Register from '@/views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'travel-list',
          name: 'travel-list',
          component: TravelList,
          meta: {
            requiresAuth: true,
            roles: ['admin', 'auditor'], // 允许管理员和审核人员访问
          },
        },
        {
          path: 'recycle-bin',
          name: 'recycle-bin',
          component: RecycleBin,
          meta: {
            requiresAuth: true,
            roles: ['admin'], // 只允许管理员访问
          },
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 不需要认证的页面直接放行
  if (!to.meta.requiresAuth) {
    next()
    return
  }

  // 检查是否已登录
  if (!userStore.token) {
    next({ name: 'login' })
    return
  }

  // 检查用户角色权限
  if (to.meta.roles && !to.meta.roles.includes(userStore.user.role)) {
    ElMessage.error('您没有权限访问该页面')
    next(false) // 阻止导航
    return
  }

  next()
})

export default router
