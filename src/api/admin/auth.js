/**
 * 管理员认证接口
 * 对应 mock/modules/admin-auth.js
 */
import request from '../request'

/**
 * 管理员登录
 * @param {{username:string,password:string}} data 登录表单
 * @returns {Promise<{token:string,role:string,profile:object}>}
 */
export function adminLoginApi(data) {
  return request.post('/admin/login', data)
}

/**
 * 管理员登出
 * @returns {Promise<null>}
 */
export function adminLogoutApi() {
  return request.post('/admin/logout')
}

/**
 * 获取当前管理员信息
 * @returns {Promise<object>}
 */
export function getAdminProfileApi() {
  return request.get('/admin/profile')
}

/**
 * 更新管理员信息
 * @param {{nickname?:string,phone?:string,avatar?:string}} data 待更新字段
 * @returns {Promise<object>}
 */
export function updateAdminProfileApi(data) {
  return request.put('/admin/profile', data)
}
