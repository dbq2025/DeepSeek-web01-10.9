/**
 * 用户认证接口（前台）
 * 对应 mock/modules/before-auth.js
 */
import request from '../request'

/**
 * 用户登录
 * @param {{username:string,password:string}} data 登录表单
 * @returns {Promise<{token:string,role:string,profile:object}>}
 */
export function userLoginApi(data) {
  return request.post('/auth/login', data)
}

/**
 * 用户注册
 * @param {{username:string,password:string,nickname?:string,phone?:string}} data 注册表单
 * @returns {Promise<{token:string,role:string,profile:object}>}
 */
export function userRegisterApi(data) {
  return request.post('/auth/register', data)
}

/**
 * 获取当前用户信息
 * @returns {Promise<object>}
 */
export function getUserProfileApi() {
  return request.get('/auth/profile')
}

/**
 * 更新个人信息
 * @param {{nickname?:string,phone?:string,avatar?:string}} data 待更新字段
 * @returns {Promise<object>}
 */
export function updateUserProfileApi(data) {
  return request.put('/auth/profile', data)
}
