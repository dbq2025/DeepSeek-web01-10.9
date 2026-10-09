/**
 * 全局常量与枚举
 * 约定：所有枚举、错误码集中在此维护，禁止在业务代码中散落硬编码
 */

/** 接口成功码 */
export const SUCCESS_CODE = 0

/** 订单状态 */
export const ORDER_STATUS = {
  UNPAID: 0, // 待付款
  PAID: 1, // 待发货
  SHIPPED: 2, // 待收货
  FINISHED: 3, // 已完成
  CANCELED: 4 // 已取消
}

/** 订单状态文案 */
export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.UNPAID]: '待付款',
  [ORDER_STATUS.PAID]: '待发货',
  [ORDER_STATUS.SHIPPED]: '待收货',
  [ORDER_STATUS.FINISHED]: '已完成',
  [ORDER_STATUS.CANCELED]: '已取消'
}

/** 商品上下架状态 */
export const GOODS_STATUS = {
  OFF: 0, // 下架
  ON: 1 // 上架
}

/** 错误码映射（示例，按后端实际补充） */
export const ERROR_MAP = {
  401: '登录已过期，请重新登录',
  403: '没有权限访问',
  404: '请求的资源不存在',
  500: '服务器内部错误'
}
