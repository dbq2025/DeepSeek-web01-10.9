/**
 * 订单接口（后台）
 * 对应 mock/modules/order.js
 */
import request from '../request'

/**
 * 分页查询全部订单
 * @param {{page?:number,pageSize?:number,status?:number|string,orderNo?:string}} params 查询参数
 * @returns {Promise<{list:Array,total:number}>}
 */
export function getOrderListApi(params) {
  return request.get('/order/list', { params })
}

/**
 * 查询订单详情
 * @param {number} id 订单 id
 * @returns {Promise<object>}
 */
export function getOrderDetailApi(id) {
  return request.get('/order/detail', { params: { id } })
}

/**
 * 修改订单状态（发货 / 完成 / 取消）
 * @param {{id:number,status:number}} data 订单 id 与目标状态
 * @returns {Promise<object>}
 */
export function updateOrderStatusApi(data) {
  return request.put('/order/status', data)
}
