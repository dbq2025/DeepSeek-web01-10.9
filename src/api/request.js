/**
 * Axios 请求实例（全项目唯一）
 * 职责：
 *   1. 创建实例（baseURL / timeout）
 *   2. 请求拦截：注入 Token、开启 loading
 *   3. 响应拦截：统一解包 data、错误提示、401 清 Token 跳登录
 * 约定：业务代码一律通过 api/*.js 调用，禁止直接 import axios
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { SUCCESS_CODE } from '@/utils/constants'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000
})

// ── 请求拦截器 ──────────────────────────────────────────────
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    // TODO: 开启全局 loading（可接入 NProgress）
    return config
  },
  (error) => Promise.reject(error)
)

// ── 响应拦截器 ──────────────────────────────────────────────
request.interceptors.response.use(
  (response) => {
    // TODO: 关闭全局 loading
    const res = response.data

    // 统一契约：{ code, message, data }
    if (res.code === SUCCESS_CODE) {
      return res.data
    }

    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      // Token 失效：清空登录态并跳转登录页
      const userStore = useUserStore()
      userStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
    } else {
      ElMessage.error(error.message || '网络异常')
    }

    return Promise.reject(error)
  }
)

export default request
