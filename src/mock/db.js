/**
 * Mock 内存数据库
 * 职责：维护商品类型 / 商品 / 订单 / 用户 / 收藏等模拟表，供各 mock 模块读写
 * 骨架占位：后续可基于 localStorage 做简易持久化
 */

/** 商品类型表 */
export const categories = [
  { id: 1, name: '手机数码', sort: 1 },
  { id: 2, name: '家用电器', sort: 2 }
]

/** 商品表 */
export const goodsList = [
  {
    id: 1001,
    name: '示例商品（骨架占位）',
    categoryId: 1,
    price: 1999,
    stock: 100,
    status: 1,
    cover: ''
  }
]

/** 订单表 */
export const orders = [
  {
    id: 2001,
    userId: 1,
    status: 0,
    totalPrice: 1999,
    items: [{ goodsId: 1001, count: 1 }],
    createTime: '2026-10-09 10:00:00'
  }
]

/** 用户表 */
export const users = [
  { id: 1, username: 'admin', password: '123456', role: 'admin' },
  { id: 2, username: 'test', password: '123456', role: 'user' }
]

/** 收藏表 */
export const favorites = []
