/**
 * Mock：数据统计接口
 * 对应 api/admin/stat.js
 * 说明：以下统计均由订单表与商品表、类型表**关联聚合**得出，而非写死数据
 */
import { getDb } from '../db.js'
import { ok } from '../helpers.js'
import { ORDER_STATUS } from '../../utils/constants.js'

/**
 * 是否为计入统计的有效订单
 * 说明：已取消订单在 /api/order/cancel 中已回滚库存与销量，若仍计入金额/销量统计，
 *      会造成「库存已还原、销售额没还原」的数据自相矛盾
 * @param {object} order 订单
 * @returns {boolean}
 */
const isCounted = (order) => order.status !== ORDER_STATUS.CANCELED

/**
 * 按月聚合销量与金额（关联 orders.items）
 * @returns {Array<{month:string,orderCount:number,salesCount:number,amount:number}>}
 */
function salesByMonth() {
  const db = getDb()
  const map = {}
  db.orders.filter(isCounted).forEach((order) => {
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
  db.orders.filter(isCounted).forEach((order) => {
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
        // 订单总数口径：全部订单（含已取消），与「订单管理」列表条数保持一致
        orderCount: db.orders.length,
        userCount: db.users.filter((u) => u.role === 'user').length,
        // 金额口径：仅有效订单（排除已取消），否则会与库存回滚后的数据自相矛盾
        totalAmount: db.orders.filter(isCounted).reduce((sum, o) => sum + o.totalPrice, 0)
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
