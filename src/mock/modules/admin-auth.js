/**
 * Mock：管理员认证接口
 * 骨架占位 —— 接口路径需与 api/admin/auth.js 保持一致
 */
export default [
  {
    url: '/api/admin/login',
    method: 'post',
    response: () => ({ code: 0, message: 'success', data: { token: 'mock-admin-token', role: 'admin' } })
  },
  {
    url: '/api/admin/logout',
    method: 'post',
    response: () => ({ code: 0, message: 'success', data: null })
  }
]
