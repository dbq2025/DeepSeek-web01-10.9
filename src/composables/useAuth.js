/**
 * 认证相关逻辑（组合函数）
 * 职责：把「调用接口 + 写入 store + 跳转」编排在一起，供登录 / 注册 / 退出复用
 * 说明：store 只做状态变更，接口调用放在此处，符合 CLAUDE.md 第 4 / 5 章的分层约定
 */
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'
import { adminLoginApi, adminLogoutApi } from '@/api/admin/auth'
import { userLoginApi, userRegisterApi } from '@/api/before/auth'

export function useAuth() {
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()
  const cartStore = useCartStore()

  /**
   * 登录成功后的统一跳转
   * @param {string} fallback 无 redirect 参数时的默认落地页
   * @returns {void}
   */
  function redirectAfterLogin(fallback) {
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' && redirect ? redirect : fallback)
  }

  /**
   * 管理员登录
   * @param {{username:string,password:string}} form 登录表单
   * @returns {Promise<boolean>} 是否登录成功
   */
  async function loginAsAdmin(form) {
    const data = await adminLoginApi(form)
    userStore.setLogin(data)
    ElMessage.success('登录成功')
    redirectAfterLogin('/admin/dashboard')
    return true
  }

  /**
   * 普通用户登录
   * @param {{username:string,password:string}} form 登录表单
   * @returns {Promise<boolean>}
   */
  async function loginAsUser(form) {
    const data = await userLoginApi(form)
    userStore.setLogin(data)
    ElMessage.success('登录成功')
    redirectAfterLogin('/home')
    return true
  }

  /**
   * 用户注册（注册成功后直接登录）
   * @param {object} form 注册表单
   * @returns {Promise<boolean>}
   */
  async function register(form) {
    const data = await userRegisterApi(form)
    userStore.setLogin(data)
    ElMessage.success('注册成功')
    router.replace('/home')
    return true
  }

  /**
   * 退出登录
   * @param {'admin'|'user'} [type='user'] 当前身份，决定跳转的登录页
   * @returns {Promise<void>}
   */
  async function logout(type = 'user') {
    try {
      if (type === 'admin') await adminLogoutApi()
    } catch (error) {
      // 退出接口失败不阻塞前端登出
    }
    userStore.logout()
    cartStore.clear()
    ElMessage.success('已退出登录')
    router.replace(type === 'admin' ? '/admin/login' : '/login')
  }

  return { userStore, cartStore, loginAsAdmin, loginAsUser, register, logout }
}
