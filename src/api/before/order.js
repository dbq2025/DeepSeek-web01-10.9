/**
 * 订单与收藏接口（前台）
 * 对应 mock/modules/order.js 与 mock/modules/favorite.js
 */
import request from '../request'

/**
 * 分页查询我的订单
 * @param {{page?:number,pageSize?:number,status?:number|string}} params 查询参数
 * @returns {Promise<{list:Array,total:number}>}
 */
export function getMyOrdersApi(params) {
  return request.get('/order/my', { params })
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
 * 提交订单
 * @param {{items:Array<{goodsId:number,count:number}>,address:object}} data 订单数据
 * @returns {Promise<object>}
 */
export function createOrderApi(data) {
  return request.post('/order/create', data)
}

/**
 * 查询我的收藏列表
 * @returns {Promise<Array>}
 */
export function getFavoriteListApi() {
  return request.get('/favorite/list')
}

/**
 * 切换收藏状态
 * @param {number} goodsId 商品 id
 * @returns {Promise<{favorited:boolean}>}
 */
export function toggleFavoriteApi(goodsId) {
  return request.post('/favorite/toggle', { goodsId })
}

/**
 * 查询某商品是否已收藏
 * @param {number} goodsId 商品 id
 * @returns {Promise<{favorited:boolean}>}
 */
export function checkFavoriteApi(goodsId) {
  return request.get('/favorite/check', { params: { goodsId } })
}
