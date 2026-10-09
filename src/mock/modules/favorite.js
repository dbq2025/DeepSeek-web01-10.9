/**
 * Mock：收藏接口
 * 对应 api/before/order.js 中的收藏相关方法
 */
import { getDb } from '../db.js'
import { ok, fail, nextId, currentUser, formatDateTime } from '../helpers.js'

export default [
  {
    url: '/api/favorite/list',
    method: 'get',
    response: ({ headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      const list = db.favorites
        .filter((f) => f.userId === user.id)
        .map((f) => {
          const goods = db.goods.find((g) => g.id === f.goodsId)
          return { ...f, goods: goods || null }
        })
        .filter((f) => f.goods)
        .sort((a, b) => b.id - a.id)
      return ok(list)
    }
  },
  {
    // 切换收藏状态：已收藏则取消，未收藏则新增
    url: '/api/favorite/toggle',
    method: 'post',
    response: ({ body, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return fail('未登录或登录已过期', 401)
      const goodsId = Number(body?.goodsId)
      const goods = db.goods.find((g) => g.id === goodsId)
      if (!goods) return fail('商品不存在', 404)

      const index = db.favorites.findIndex((f) => f.userId === user.id && f.goodsId === goodsId)
      if (index > -1) {
        db.favorites.splice(index, 1)
        return ok({ favorited: false })
      }
      db.favorites.push({
        id: nextId(db.favorites),
        userId: user.id,
        goodsId,
        createTime: formatDateTime(new Date())
      })
      return ok({ favorited: true })
    }
  },
  {
    url: '/api/favorite/check',
    method: 'get',
    response: ({ query, headers }) => {
      const db = getDb()
      const user = currentUser({ headers }, db.users)
      if (!user) return ok({ favorited: false })
      const goodsId = Number(query?.goodsId)
      return ok({ favorited: db.favorites.some((f) => f.userId === user.id && f.goodsId === goodsId) })
    }
  }
]
