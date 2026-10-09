/**
 * 商品接口（后台）
 * 对应 mock/modules/goods.js
 */
import request from '../request'

/**
 * 分页 + 多条件查询商品
 * @param {{page?:number,pageSize?:number,name?:string,categoryId?:number|string,status?:number|string}} params 查询参数
 * @returns {Promise<{list:Array,total:number}>}
 */
export function getGoodsListApi(params) {
  return request.get('/goods/list', { params })
}

/**
 * 查询商品详情
 * @param {number} id 商品 id
 * @returns {Promise<object>}
 */
export function getGoodsDetailApi(id) {
  return request.get('/goods/detail', { params: { id } })
}

/**
 * 新增商品
 * @param {object} data 商品数据
 * @returns {Promise<object>}
 */
export function createGoodsApi(data) {
  return request.post('/goods/create', data)
}

/**
 * 修改商品
 * @param {object} data 商品数据（含 id）
 * @returns {Promise<object>}
 */
export function updateGoodsApi(data) {
  return request.put('/goods/update', data)
}

/**
 * 单个商品上下架
 * @param {{id:number,status:number}} data 商品 id 与目标状态
 * @returns {Promise<object>}
 */
export function updateGoodsStatusApi(data) {
  return request.put('/goods/status', data)
}

/**
 * 批量上下架
 * @param {{ids:number[],status:number}} data 商品 id 列表与目标状态
 * @returns {Promise<{count:number}>}
 */
export function batchUpdateGoodsStatusApi(data) {
  return request.put('/goods/batch-status', data)
}

/**
 * 删除商品
 * @param {number} id 商品 id
 * @returns {Promise<null>}
 */
export function deleteGoodsApi(id) {
  return request.delete('/goods/delete', { params: { id } })
}

/**
 * 上传商品图片（纯前端项目：以 Base64 直接回传）
 * @param {string} file Base64 数据
 * @returns {Promise<{url:string}>}
 */
export function uploadGoodsImageApi(file) {
  return request.post('/goods/upload', { file })
}
