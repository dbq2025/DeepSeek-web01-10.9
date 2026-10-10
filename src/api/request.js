/**
 * Axios 请求实例（全项目唯一）
 * 职责：
 *   1. 创建实例（baseURL / timeout）
 *   2. 请求拦截：注入 Token
 *   3. 响应拦截：统一解包 data、错误提示、登录态失效时按所在区域回跳登录页
 * 约定：业务代码一律通过 api/*.js 调用，禁止直接 import axios
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { ERROR_MAP, SUCCESS_CODE } from '@/utils/constants'

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
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 把业务失败响应包装成带 code 的 Error
 * 说明：只带 message 的话，调用方想按错误码分支处理就只能去解析字符串
 * @param {{code:number,message:string}} res 业务响应体
 * @returns {Error}
 */
function toBusinessError(res) {
  const error = new Error(res.message || 'Error')
  error.code = res.code
  return error
}

/** 并发 401 去重标记：避免同一时刻多个请求各自弹一条提示、各跳一次 */
let redirecting = false

/**
 * 登录态失效：清空本地登录态，并按「当前所在区域」回跳对应登录页
 * 说明：
 *   1. router 用动态 import 懒加载 —— api/request.js ← store ← guard ← router 构成依赖环，
 *      顶层静态引入会让模块初始化顺序变脆弱；
 *   2. 后台请求应回 /admin/login（并带 redirect），不能一律甩到前台登录页。
 * @returns {void}
 */
function handleUnauthorized() {
  const userStore = useUserStore()
  userStore.logout()
  if (redirecting) return
  redirecting = true

  ElMessage.error('登录已过期，请重新登录')
  import('@/router')
    .then(async ({ default: router }) => {
      const { path, fullPath } = router.currentRoute.value
      const loginPath = path.startsWith('/admin') ? '/admin/login' : '/login'
      // 已在登录页时不再回跳，避免反复导航
      if (path !== loginPath) {
        await router.replace({ path: loginPath, query: { redirect: fullPath } })
      }
    })
    .finally(() => {
      redirecting = false
    })
}

// ── 响应拦截器 ──────────────────────────────────────────────
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 统一契约：{ code, message, data }
    if (res.code === SUCCESS_CODE) {
      return res.data
    }

    // 业务层的登录态失效
    // ⚠️ 本项目 Mock 中间件一律返回 HTTP 200、把错误码放在 body 里（见 build/mock-server-plugin.js），
    //    因此 401 只会走到这里，不会进入下面的 HTTP 状态分支 —— 必须在此一并处理，
    //    否则 token 过期后用户只会看到一条提示、却仍停留在已经加载不出来的页面上。
    if (res.code === 401) {
      handleUnauthorized()
      return Promise.reject(toBusinessError(res))
    }

    ElMessage.error(res.message || '请求失败')
    return Promise.reject(toBusinessError(res))
  },
  (error) => {
    // HTTP 层错误（对接真实后端时生效；Mock 不会走到这里）
    const status = error.response?.status

    if (status === 401) {
      handleUnauthorized()
    } else if (status && ERROR_MAP[status]) {
      ElMessage.error(ERROR_MAP[status])
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('网络异常，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

export default request
