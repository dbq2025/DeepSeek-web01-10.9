/**
 * Mock：商品类型接口（增删改查 + 分页）
 * 对应 api/admin/category.js
 */
import { getDb } from '../db.js'
import { ok, fail, paginate, nextId, includesKeyword, formatDateTime } from '../helpers.js'

export default [
  {
    url: '/api/category/list',
    method: 'get',
    response: ({ query }) => {
      const db = getDb()
      const { page = 1, pageSize = 10, name = '' } = query || {}
      const filtered = db.categories
        .filter((c) => includesKeyword(c.name, name))
        .sort((a, b) => a.sort - b.sort)
      return ok(paginate(filtered, page, pageSize))
    }
  },
  {
    url: '/api/category/all',
    method: 'get',
    response: () => {
      const db = getDb()
      return ok(db.categories.slice().sort((a, b) => a.sort - b.sort))
    }
  },
  {
    url: '/api/category/create',
    method: 'post',
    response: ({ body }) => {
      const db = getDb()
      const { name, sort } = body || {}
      if (!name) return fail('类型名称不能为空', 400)
      if (db.categories.some((c) => c.name === name)) return fail('该类型名称已存在', 400)
      const category = {
        id: nextId(db.categories),
        name,
        sort: Number(sort) || db.categories.length + 1,
        createTime: formatDateTime(new Date())
      }
      db.categories.push(category)
      return ok(category)
    }
  },
  {
    url: '/api/category/update',
    method: 'put',
    response: ({ body }) => {
      const db = getDb()
      const { id, name, sort } = body || {}
      const category = db.categories.find((c) => c.id === Number(id))
      if (!category) return fail('类型不存在', 404)
      if (name !== undefined) {
        if (db.categories.some((c) => c.name === name && c.id !== category.id)) {
          return fail('该类型名称已存在', 400)
        }
        category.name = name
      }
      if (sort !== undefined) category.sort = Number(sort)
      return ok(category)
    }
  },
  {
    url: '/api/category/delete',
    method: 'delete',
    response: ({ query }) => {
      const db = getDb()
      const id = Number(query?.id)
      const index = db.categories.findIndex((c) => c.id === id)
      if (index === -1) return fail('类型不存在', 404)
      // 业务规则：类型下仍有商品时不允许删除
      if (db.goods.some((g) => g.categoryId === id)) {
        return fail('该类型下仍有商品，无法删除', 400)
      }
      db.categories.splice(index, 1)
      return ok(null)
    }
  }
]
