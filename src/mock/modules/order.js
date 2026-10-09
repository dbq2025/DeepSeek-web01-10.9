/**
 * Mock：订单接口（列表/详情/状态流转）
 * 骨架占位 —— 接口路径需与 api/admin/order.js、api/before/order.js 保持一致
 */
export default [
  {
    url: '/api/order/list',
    method: 'get',
    response: () => ({ code: 0, message: 'success', data: { list: [], total: 0 } })
  }
  // TODO: 详情 / 状态变更 / 下单 / 我的订单 / 收藏
]
