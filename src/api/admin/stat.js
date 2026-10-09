/**
 * 数据统计接口（后台）
 * 对应 mock/modules/stat.js
 */
import request from '../request'

/**
 * 获取概览数据（商品数 / 订单数 / 用户数 / 总金额）
 * @returns {Promise<object>}
 */
export function getOverviewApi() {
  return request.get('/stat/overview')
}

/**
 * 按月销量统计
 * @returns {Promise<Array<{month:string,orderCount:number,salesCount:number,amount:number}>>}
 */
export function getSalesByMonthApi() {
  return request.get('/stat/sales-by-month')
}

/**
 * 按商品类型统计订单销量
 * @returns {Promise<Array<{name:string,value:number}>>}
 */
export function getOrdersByCategoryApi() {
  return request.get('/stat/orders-by-category')
}
