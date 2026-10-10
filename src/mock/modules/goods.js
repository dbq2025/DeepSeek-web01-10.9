/**
 * Mock：商品接口（列表/详情/增删改/上下架/批量/上传/推荐）
 * 对应 api/admin/goods.js 与 api/before/goods.js
 */
import { getDb } from '../db.js'
import { ok, fail, paginate, nextId, includesKeyword, formatDateTime } from '../helpers.js'

/**
 * 为商品补充类型名称
 * @param {object} goods 商品
 * @param {Array} categories 类型表
 * @returns {object} 带 categoryName 的商品
 */
function withCategoryName(goods, categories) {
  const category = categories.find((c) => c.id === goods.categoryId)
  return { ...goods, categoryName: category ? category.name : '未分类' }
}

/**
 * 商品排序策略（前台搜索页使用；未命中策略时退回「按 id 倒序」）
 * @param {string} sortBy 排序标识
 * @returns {(a:object,b:object)=>number}
 */
function resolveSorter(sortBy) {
  const map = {
    priceAsc: (a, b) => a.price - b.price,
    priceDesc: (a, b) => b.price - a.price,
    salesDesc: (a, b) => b.sales - a.sales
  }
  return map[sortBy] || ((a, b) => b.id - a.id)
}

export default [
  {
    url: '/api/goods/list',
    method: 'get',
    response: ({ query }) => {
      const db = getDb()
      const {
        page = 1,
        pageSize = 10,
        name = '',
        categoryId = '',
        status = '',
        sortBy = ''
      } = query || {}
      const filtered = db.goods
        .filter((g) => includesKeyword(g.name, name))
        .filter((g) => (categoryId === '' || categoryId === undefined ? true : g.categoryId === Number(categoryId)))
        .filter((g) => (status === '' || status === undefined ? true : g.status === Number(status)))
        .sort(resolveSorter(sortBy))
        .map((g) => withCategoryName(g, db.categories))
      return ok(paginate(filtered, page, pageSize))
    }
  },
  {
    url: '/api/goods/detail',
    method: 'get',
    response: ({ query }) => {
      const db = getDb()
      const goods = db.goods.find((g) => g.id === Number(query?.id))
      if (!goods) return fail('商品不存在', 404)
      return ok(withCategoryName(goods, db.categories))
    }
  },
  {
    url: '/api/goods/recommend',
    method: 'get',
    response: ({ query }) => {
      const db = getDb()
      const limit = Number(query?.limit) || 8
      const list = db.goods
        .filter((g) => g.status === 1)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)
        .map((g) => withCategoryName(g, db.categories))
      return ok(list)
    }
  },
  {
    url: '/api/goods/create',
    method: 'post',
    response: ({ body }) => {
      const db = getDb()
      const { name, categoryId, price, stock, status, cover, description } = body || {}
      if (!name) return fail('商品名称不能为空', 400)
      if (!categoryId) return fail('请选择商品类型', 400)
      const goods = {
        id: nextId(db.goods),
        name,
        categoryId: Number(categoryId),
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        sales: 0,
        status: Number(status) === 1 ? 1 : 0,
        cover: cover || '',
        description: description || '',
        createTime: formatDateTime(new Date())
      }
      db.goods.push(goods)
      return ok(goods)
    }
  },
  {
    url: '/api/goods/update',
    method: 'put',
    response: ({ body }) => {
      const db = getDb()
      const { id, ...rest } = body || {}
      const goods = db.goods.find((g) => g.id === Number(id))
      if (!goods) return fail('商品不存在', 404)
      const fields = ['name', 'cover', 'description']
      fields.forEach((key) => {
        if (rest[key] !== undefined) goods[key] = rest[key]
      })
      if (rest.categoryId !== undefined) goods.categoryId = Number(rest.categoryId)
      if (rest.price !== undefined) goods.price = Number(rest.price)
      if (rest.stock !== undefined) goods.stock = Number(rest.stock)
      if (rest.status !== undefined) goods.status = Number(rest.status)
      return ok(goods)
    }
  },
  {
    url: '/api/goods/status',
    method: 'put',
    response: ({ body }) => {
      const db = getDb()
      const { id, status } = body || {}
      const goods = db.goods.find((g) => g.id === Number(id))
      if (!goods) return fail('商品不存在', 404)
      goods.status = Number(status) === 1 ? 1 : 0
      return ok(goods)
    }
  },
  {
    url: '/api/goods/batch-status',
    method: 'put',
    response: ({ body }) => {
      const db = getDb()
      const { ids, status } = body || {}
      if (!Array.isArray(ids) || ids.length === 0) return fail('请先选择商品', 400)
      const target = Number(status) === 1 ? 1 : 0
      let count = 0
      db.goods.forEach((g) => {
        if (ids.map(Number).includes(g.id)) {
          g.status = target
          count += 1
        }
      })
      return ok({ count })
    }
  },
  {
    url: '/api/goods/delete',
    method: 'delete',
    response: ({ query }) => {
      const db = getDb()
      const index = db.goods.findIndex((g) => g.id === Number(query?.id))
      if (index === -1) return fail('商品不存在', 404)
      db.goods.splice(index, 1)
      return ok(null)
    }
  },
  {
    // 纯前端项目：图片以 Base64 直接回传，不落盘
    url: '/api/goods/upload',
    method: 'post',
    response: ({ body }) => {
      const { file } = body || {}
      if (!file) return fail('未接收到文件', 400)
      return ok({ url: file })
    }
  }
]
