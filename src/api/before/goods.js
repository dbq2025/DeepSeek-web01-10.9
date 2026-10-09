/**
 * 商品接口（前台）
 * 对应 mock/modules/goods.js 与 mock/modules/home.js
 */
import request from '../request'

/**
 * 获取首页轮播图
 * @returns {Promise<Array>}
 */
export function getBannersApi() {
  return request.get('/home/banners')
}

/**
 * 分页 + 条件查询上架商品（搜索 / 分类筛选共用）
 * @param {{page?:number,pageSize?:number,name?:string,categoryId?:number|string,status?:number}} params 查询参数
 * @returns {Promise<{list:Array,total:number}>}
 */
export function getFrontGoodsListApi(params) {
  return request.get('/goods/list', { params })
}

/**
 * 获取推荐商品（按销量倒序）
 * @param {number} [limit=8] 数量
 * @returns {Promise<Array>}
 */
export function getRecommendGoodsApi(limit = 8) {
  return request.get('/goods/recommend', { params: { limit } })
}

/**
 * 获取商品详情
 * @param {number} id 商品 id
 * @returns {Promise<object>}
 */
export function getFrontGoodsDetailApi(id) {
  return request.get('/goods/detail', { params: { id } })
}
