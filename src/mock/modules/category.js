/**
 * Mock：商品类型接口（增删改查 + 分页）
 * 骨架占位 —— 接口路径需与 api/admin/category.js 保持一致
 */
export default [
  {
    url: '/api/category/list',
    method: 'get',
    response: () => ({ code: 0, message: 'success', data: { list: [], total: 0 } })
  }
  // TODO: 新增 / 编辑 / 删除接口
]
