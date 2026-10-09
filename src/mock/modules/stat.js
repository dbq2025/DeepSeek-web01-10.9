/**
 * Mock：数据统计接口（按月销量 / 按类型订单）
 * 骨架占位 —— 接口路径需与 api/admin/stat.js 保持一致
 */
export default [
  {
    url: '/api/stat/sales',
    method: 'get',
    response: () => ({ code: 0, message: 'success', data: [] })
  }
  // TODO: 按商品类型订单统计、多表关联聚合
]
