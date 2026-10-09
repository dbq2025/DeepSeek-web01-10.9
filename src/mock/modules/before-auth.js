/**
 * Mock：前台用户认证接口（注册 / 登录 / 个人信息）
 * 骨架占位 —— 接口路径需与 api/before/auth.js 保持一致
 */
export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: () => ({ code: 0, message: 'success', data: { token: 'mock-user-token', role: 'user' } })
  },
  {
    url: '/api/auth/register',
    method: 'post',
    response: () => ({ code: 0, message: 'success', data: null })
  }
]
