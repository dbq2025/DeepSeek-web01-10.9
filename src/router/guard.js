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
    const { requiresAuth, role, title, guestOnly, guestRedirect } = to.meta

    // 设置页面标题
    if (title) {
      document.title = `${title} - ${import.meta.env.VITE_APP_TITLE || '电子商务平台'}`
    }

    // 已登录访问登录/注册页 → 回跳对应首页（避免重复登录）
    // 角色与区域不匹配时（如普通用户误入后台登录页）退回前台，避免二次跳转触发 404
    if (guestOnly && userStore.isLogin) {
      const isAdminArea = to.path.startsWith('/admin')
      const denyRedirect = isAdminArea && userStore.role !== 'admin'
      next({ path: denyRedirect ? '/' : guestRedirect || '/' })
      return
    }

    // 需要登录但未登录 → 跳对应登录页并携带回跳地址
    if (requiresAuth && !userStore.isLogin) {
      const loginPath = role === 'admin' ? '/admin/login' : '/login'
      next({ path: loginPath, query: { redirect: to.fullPath } })
      return
    }

    // 角色不匹配 → 拦截（示例：管理员区域仅 admin 可进）
    // 注意：不可写成 `role && userStore.role && userStore.role !== role`。
    //      user store 的 token 与 role 是两个独立持久化字段，当本地数据里 role 缺失
    //      （空字符串）时，上述三条件式会整体短路导致守卫放行。这里刻意不依赖
    //      userStore.role 的真值：role 缺失一律视为不匹配，直接拦下。
    if (role && userStore.role !== role) {
      next({ path: '/404' })
      return
    }

    next()
  })

  // TODO: 后置守卫设置进度条结束、埋点等
}
