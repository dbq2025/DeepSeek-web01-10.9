/**
 * 商品类型接口（后台）
 * 对应 mock/modules/category.js
 */
import request from '../request'

/**
 * 分页查询商品类型
 * @param {{page?:number,pageSize?:number,name?:string}} params 查询参数
 * @returns {Promise<{list:Array,total:number}>}
 */
export function getCategoryListApi(params) {
  return request.get('/category/list', { params })
}

/**
 * 查询全部商品类型（下拉选择用）
 * @returns {Promise<Array>}
 */
export function getAllCategoriesApi() {
  return request.get('/category/all')
}

/**
 * 新增商品类型
 * @param {{name:string,sort?:number}} data 类型数据
 * @returns {Promise<object>}
 */
export function createCategoryApi(data) {
  return request.post('/category/create', data)
}

/**
 * 修改商品类型
 * @param {{id:number,name?:string,sort?:number}} data 类型数据
 * @returns {Promise<object>}
 */
export function updateCategoryApi(data) {
  return request.put('/category/update', data)
}

/**
 * 删除商品类型
 * @param {number} id 类型 id
 * @returns {Promise<null>}
 */
export function deleteCategoryApi(id) {
  return request.delete('/category/delete', { params: { id } })
}
