/**
 * Mock：首页接口（轮播图）
 * 对应 api/before/goods.js 中的首页相关方法
 */
import { getDb } from '../db.js'
import { ok } from '../helpers.js'

export default [
  {
    url: '/api/home/banners',
    method: 'get',
    response: () => {
      const db = getDb()
      return ok(db.banners.slice().sort((a, b) => a.sort - b.sort))
    }
  }
]
