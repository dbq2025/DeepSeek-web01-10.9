/**
 * 格式化工具
 * 职责：金额、日期、订单状态、上下架状态等展示层文案统一处理
 */
import { ORDER_STATUS, ORDER_STATUS_TEXT, GOODS_STATUS } from './constants'

/**
 * 金额格式化：分转元不做处理（Mock 数据直接以元存储），保留两位小数并加千分位
 * @param {number|string} value 金额
 * @returns {string} 例如 "1,299.00"
 */
export function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return '0.00'
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 带货币符号的金额
 * @param {number|string} value 金额
 * @returns {string} 例如 "¥1,299.00"
 */
export function formatMoney(value) {
  return `¥${formatPrice(value)}`
}

/**
 * 日期时间格式化
 * @param {string|number|Date} value 时间
 * @param {string} [pattern='YYYY-MM-DD HH:mm:ss'] 模板
 * @returns {string}
 */
export function formatDate(value, pattern = 'YYYY-MM-DD HH:mm:ss') {
  if (!value) return '-'
  const date = new Date(typeof value === 'string' ? value.replace(/-/g, '/') : value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return pattern
    .replace('YYYY', date.getFullYear())
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()))
}

/**
 * 订单状态文案
 * @param {number} status 状态码
 * @returns {string}
 */
export function formatOrderStatus(status) {
  return ORDER_STATUS_TEXT[status] || '未知状态'
}

/**
 * 订单状态对应的 Element Plus tag 类型
 * @param {number} status 状态码
 * @returns {'info'|'warning'|'primary'|'success'|'danger'}
 */
export function orderStatusTagType(status) {
  const map = {
    [ORDER_STATUS.UNPAID]: 'warning',
    [ORDER_STATUS.PAID]: 'primary',
    [ORDER_STATUS.SHIPPED]: 'info',
    [ORDER_STATUS.FINISHED]: 'success',
    [ORDER_STATUS.CANCELED]: 'danger'
  }
  return map[status] || 'info'
}

/**
 * 上下架文案
 * @param {number} status 0 下架 / 1 上架
 * @returns {string}
 */
export function formatGoodsStatus(status) {
  return Number(status) === GOODS_STATUS.ON ? '已上架' : '已下架'
}
