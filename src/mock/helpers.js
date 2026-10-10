/**
 * Mock 通用工具
 * 职责：统一响应契约、分页、查询参数解析、简易 Token 编解码
 * 说明：本文件位于 mockPath（src/mock/modules）之外，不会被 Mock 中间件当作接口文件加载
 */
import { SUCCESS_CODE } from '../utils/constants.js'

/**
 * 成功响应
 * @param {*} data 业务数据
 * @returns {{code:number,message:string,data:*}}
 */
export function ok(data = null) {
  return { code: SUCCESS_CODE, message: 'success', data }
}

/**
 * 失败响应
 * @param {string} message 错误信息
 * @param {number} [code=500] 业务错误码
 * @returns {{code:number,message:string,data:null}}
 */
export function fail(message, code = 500) {
  return { code, message, data: null }
}

/**
 * 数组分页
 * @param {Array} list 完整列表
 * @param {number|string} page 页码（从 1 开始）
 * @param {number|string} pageSize 每页条数
 * @returns {{list:Array,total:number,page:number,pageSize:number}}
 */
export function paginate(list, page = 1, pageSize = 10) {
  const p = Math.max(1, Number(page) || 1)
  const size = Math.max(1, Number(pageSize) || 10)
  const start = (p - 1) * size
  return {
    list: list.slice(start, start + size),
    total: list.length,
    page: p,
    pageSize: size
  }
}

/**
 * 生成表内自增主键
 * @param {Array<{id:number}>} table 数据表
 * @returns {number}
 */
export function nextId(table) {
  return table.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
}

/**
 * 剔除敏感字段后的用户信息
 * @param {object} user 用户记录
 * @returns {object} 可安全返回给前端的用户信息
 */
export function publicUser(user) {
  if (!user) return null
  const { password, ...rest } = user
  return rest
}

/**
 * 生成登录 Token（Mock 用，格式 mock.<userId>.<role>）
 * @param {{id:number,role:string}} user 用户
 * @returns {string}
 */
export function buildToken(user) {
  return `mock.${user.id}.${user.role}`
}

/**
 * 解析 Token
 * @param {string} token
 * @returns {{id:number,role:string}|null}
 */
export function parseToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.replace(/^Bearer\s+/i, '').split('.')
  if (parts.length !== 3 || parts[0] !== 'mock') return null
  return { id: Number(parts[1]), role: parts[2] }
}

/**
 * 从请求中取出当前用户
 * @param {object} req mock 请求对象
 * @param {Array} users 用户表
 * @returns {object|null}
 */
export function currentUser(req, users) {
  const raw = req.headers?.authorization || req.headers?.Authorization
  const parsed = parseToken(raw)
  if (!parsed) return null
  return users.find((u) => u.id === parsed.id) || null
}

/**
 * 校验请求身份：未登录 401、角色不符 403
 * 约定：所有需要身份的 Mock 接口都在响应函数首行调用本方法，避免逐处手写判断
 * @param {object} req mock 请求对象（需含 headers）
 * @param {Array} users 用户表
 * @param {'admin'|'user'} [needRole] 要求的角色，不传则仅校验登录态
 * @returns {{user:object|null, error:object|null}} error 非空时应直接将其作为响应返回
 */
export function requireUser(req, users, needRole) {
  const user = currentUser(req, users)
  if (!user) return { user: null, error: fail('未登录或登录已过期', 401) }
  if (needRole && user.role !== needRole) return { user: null, error: fail('没有权限访问', 403) }
  return { user, error: null }
}

/**
 * 按关键字过滤（忽略大小写）
 * @param {string} value 待匹配字段值
 * @param {string} keyword 关键字
 * @returns {boolean}
 */
export function includesKeyword(value, keyword) {
  if (!keyword) return true
  return String(value || '')
    .toLowerCase()
    .includes(String(keyword).toLowerCase())
}

/**
 * 格式化日期为 yyyy-MM-dd HH:mm:ss
 * @param {Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}
