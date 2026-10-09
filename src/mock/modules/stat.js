/**
 * Mock：数据统计接口
 * 对应 api/admin/stat.js
 * 说明：以下统计均由订单表与商品表、类型表**关联聚合**得出，而非写死数据
 */
import { getDb } from '../db.js'
import { ok } from '../helpers.js'

/**
 * 按月聚合销量与金额（关联 orders.items）
 * @returns {Array<{month:string,orderCount:number,salesCount:number,amount:number}>}
 */
function salesByMonth() {
  const db = getDb()
  const map = {}
  db.orders.forEach((order) => {
    const month = String(order.createTime).slice(0, 7)
    if (!map[month]) {
      map[month] = { month, orderCount: 0, salesCount: 0, amount: 0 }
    }
    map[month].orderCount += 1
    map[month].amount += order.totalPrice
    order.items.forEach((item) => {
      map[month].salesCount += item.count
    })
  })
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * 按商品类型聚合订单销量（三表关联：orders.items → goods → categories）
 * @returns {Array<{name:string,value:number}>}
 */
function ordersByCategory() {
  const db = getDb()
  const goodsMap = Object.fromEntries(db.goods.map((g) => [g.id, g]))
  const categoryMap = Object.fromEntries(db.categories.map((c) => [c.id, c.name]))
  const result = {}
  db.orders.forEach((order) => {
    order.items.forEach((item) => {
      const goods = goodsMap[item.goodsId]
      const name = goods ? categoryMap[goods.categoryId] || '未分类' : '已下架商品'
      result[name] = (result[name] || 0) + item.count
    })
  })
  return Object.entries(result).map(([name, value]) => ({ name, value }))
}

export default [
  {
    url: '/api/stat/overview',
    method: 'get',
    response: () => {
      const db = getDb()
      return ok({
        goodsCount: db.goods.length,
        onSaleCount: db.goods.filter((g) => g.status === 1).length,
        orderCount: db.orders.length,
        userCount: db.users.filter((u) => u.role === 'user').length,
        totalAmount: db.orders.reduce((sum, o) => sum + o.totalPrice, 0)
      })
    }
  },
  {
    url: '/api/stat/sales-by-month',
    method: 'get',
    response: () => ok(salesByMonth())
  },
  {
    url: '/api/stat/orders-by-category',
    method: 'get',
    response: () => ok(ordersByCategory())
  }
]
