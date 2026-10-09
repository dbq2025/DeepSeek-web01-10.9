/**
 * 路由实例
 * 职责：创建 router、合并后台(admin)与前台(before)路由模块、挂载全局守卫
 */
import { createRouter, createWebHistory } from 'vue-router'
import adminRoutes from './modules/admin'
import beforeRoutes from './modules/before'
import { setupRouterGuard } from './guard'

const routes = [
  // 前台路由（含前台 Layout 嵌套）
  ...beforeRoutes,
  // 后台路由（含后台 Layout 嵌套）
  ...adminRoutes
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 切换路由时回到页面顶部
  scrollBehavior: () => ({ top: 0 })
})

// 注册全局前置/后置守卫
setupRouterGuard(router)

export default router
