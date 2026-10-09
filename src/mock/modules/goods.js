/**
 * Mock：商品接口（列表/筛选/详情/上下架/批量）
 * 骨架占位 —— 接口路径需与 api/admin/goods.js、api/before/goods.js 保持一致
 */
export default [
  {
    url: '/api/goods/list',
    method: 'get',
    response: () => ({ code: 0, message: 'success', data: { list: [], total: 0 } })
  }
  // TODO: 详情 / 新增 / 编辑 / 上下架 / 批量上下架 / 图片上传
]
