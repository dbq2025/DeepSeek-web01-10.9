/**
 * Mock：订单接口（下单 / 列表 / 详情 / 状态流转）
 * 对应 api/admin/order.js 与 api/before/order.js
 */
import { getDb } from '../db.js'
import {
  ok,
  fail,
  paginate,
  nextId,
  includesKeyword,
  currentUser,
  requireUser,
  formatDateTime
} from '../helpers.js'

export default [
  {
    // 管理员视角：全部订单（含他人收货信息，必须限管理员）
    url: '/api/order/list',
    method: 'get',
    response: ({ query, headers }) => {
      const db = getDb()
      const { error } = requireUser({ headers }, db.users, 'admin')
      if (error) return error
      const { page = 1, pageSize = 10, status = '', orderNo = '' } = query || {}
      const filtered = db.orders
        .filter((o) => includesKeyword(o.orderNo, orderNo))
        .filter((o) => (status === '' || status === undefined ? true : o.status === Number(status)))
        .sort((a, b) => b.id - a.id)
      return ok(paginate(filtered, page, pageSize))
    }
  },
  {
    // 前台视角：当前登录用户的订单
    url: '/api/order/my',
    method: 'get',
    response: ({ query, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      const { page = 1, pageSize = 5, status = '' } = query || {}
      const filtered = db.orders
        .filter((o) => o.userId === user.id)
        .filter((o) => (status === '' || status === undefined ? true : o.status === Number(status)))
        .sort((a, b) => b.id - a.id)
      return ok(paginate(filtered, page, pageSize))
    }
  },
  {
    // 订单详情：仅本人或管理员可见（含收货人姓名 / 手机 / 地址等隐私字段）
    url: '/api/order/detail',
    method: 'get',
    response: ({ query, headers }) => {
      const db = getDb()
      const { user, error } = requireUser({ headers }, db.users)
      if (error) return error
      const order = db.orders.find((o) => o.id === Number(query?.id))
      if (!order) return fail('订单不存在', 404)
      if (order.userId !== user.id && user.role !== 'admin') {
        return fail('无权查看该订单', 403)
      }
      return ok(order)
    }
  },
  {
    // 管理员修改订单状态（发货 / 完成 / 取消）
    url: '/api/order/status',
    method: 'put',
    response: ({ body, headers }) => {
      const db = getDb()
      const { error } = requireUser({ headers }, db.users, 'admin')
      if (error) return error
      const { id, status } = body || {}
      const order = db.orders.find((o) => o.id === Number(id))
      if (!order) return fail('订单不存在', 404)
      order.status = Number(status)
      return ok(order)
    }
  },
  {
    // 前台模拟付款：待付款 → 待发货（仅限本人订单）
    url: '/api/order/pay',
    method: 'put',
    response: ({ body, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      const order = db.orders.find((o) => o.id === Number(body?.id))
      if (!order) return fail('订单不存在', 404)
      if (order.userId !== user.id) return fail('无权操作该订单', 403)
      if (order.status !== 0) return fail('该订单当前状态无法付款', 400)
      order.status = 1
      return ok(order)
    }
  },
  {
    // 前台取消订单：待付款 → 已取消，并把下单时扣掉的库存 / 销量回滚（仅限本人）
    url: '/api/order/cancel',
    method: 'put',
    response: ({ body, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      const order = db.orders.find((o) => o.id === Number(body?.id))
      if (!order) return fail('订单不存在', 404)
      if (order.userId !== user.id) return fail('无权操作该订单', 403)
      if (order.status !== 0) return fail('只有待付款的订单可以取消', 400)

      order.items.forEach((item) => {
        const goods = db.goods.find((g) => g.id === item.goodsId)
        if (goods) {
          goods.stock += item.count
          goods.sales = Math.max(0, goods.sales - item.count)
        }
      })
      order.status = 4
      return ok(order)
    }
  },
  {
    // 前台下单：两段式 —— 先全量校验（无副作用），全部通过后再统一扣减库存 / 累加销量。
    // 目的：避免「循环中途 return fail() 导致前面已扣的库存不回滚」这种非原子写入。
    url: '/api/order/create',
    method: 'post',
    response: ({ body, headers }) => {
      const db = getDb()
      const { user, error } = requireUser({ headers }, db.users)
      if (error) return error
      const { items, address } = body || {}
      if (!Array.isArray(items) || items.length === 0) return fail('订单商品不能为空', 400)

      // ── 第一段：只读校验，不产生任何副作用 ────────────────────────
      const plan = []
      for (const item of items) {
        const count = Number(item?.count)
        // 必须为正整数：拦掉负数（会反向「刷多」库存）、0 与小数
        if (!Number.isInteger(count) || count <= 0) {
          return fail('商品数量必须为正整数', 400)
        }
        const goods = db.goods.find((g) => g.id === Number(item.goodsId))
        if (!goods) return fail(`商品 ${item.goodsId} 不存在`, 400)
        // 同一商品出现多行时需累计需求量，否则各行分别通过校验、合计却超卖
        const demanded = plan
          .filter((p) => p.goods.id === goods.id)
          .reduce((sum, p) => sum + p.count, 0)
        if (goods.stock < demanded + count) return fail(`「${goods.name}」库存不足`, 400)
        plan.push({ goods, count })
      }

      // ── 第二段：全部校验通过后才写库（等价于事务提交）──────────────
      const orderItems = plan.map(({ goods, count }) => {
        goods.stock -= count
        goods.sales += count
        return {
          goodsId: goods.id,
          goodsName: goods.name,
          price: goods.price,
          count,
          cover: goods.cover
        }
      })

      const id = nextId(db.orders)
      const now = new Date()
      const order = {
        id,
        orderNo: `NO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(id).slice(-4)}`,
        userId: user.id,
        userName: user.nickname,
        items: orderItems,
        totalPrice: orderItems.reduce((sum, it) => sum + it.price * it.count, 0),
        status: 0,
        address: address || { name: user.nickname, phone: user.phone, detail: '' },
        createTime: formatDateTime(now)
      }
      db.orders.push(order)
      return ok(order)
    }
  }
]
