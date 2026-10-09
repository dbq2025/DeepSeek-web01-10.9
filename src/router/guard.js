/**
 * 全局路由守卫
 * 职责：登录态校验、角色校验、动态标题、进度条
 * 约定：所有鉴权逻辑集中在此，禁止散落到组件中
 */
import { useUserStore } from '@/store/modules/user'

/**
 * 注册路由守卫
 * @param {import('vue-router').Router} router 路由实例
 * @returns {void}
 */
export function setupRouterGuard(router) {
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()
    const { requiresAuth, role, title } = to.meta

    // 设置页面标题
    if (title) {
      document.title = `${title} - ${import.meta.env.VITE_APP_TITLE || '电子商务平台'}`
    }

    // 需要登录但未登录 → 跳对应登录页并携带回跳地址
    if (requiresAuth && !userStore.isLogin) {
      const loginPath = role === 'admin' ? '/admin/login' : '/login'
      next({ path: loginPath, query: { redirect: to.fullPath } })
      return
    }

    // 角色不匹配 → 拦截（示例：管理员区域仅 admin 可进）
    if (role && userStore.role && userStore.role !== role) {
      next({ path: '/404' })
      return
    }

    next()
  })

  // TODO: 后置守卫设置进度条结束、埋点等
}
