/**
 * Mock 种子数据
 * 职责：构造确定性的初始数据集（类型 / 商品 / 订单 / 用户 / 收藏 / 轮播）
 * 说明：用固定种子的伪随机数生成器，保证每次启动 dev server 得到的种子数据完全一致，
 *      便于截图与回归对比；占位图由 svg.js 提供
 * 注意：本文件位于 mockPath（src/mock/modules）之外，不会被 Mock 中间件当作接口文件加载
 */
import { buildBanner, buildCover } from './svg.js'

/** 商品类型种子 */
const CATEGORY_SEED = [
  { id: 1, name: '手机数码', sort: 1 },
  { id: 2, name: '家用电器', sort: 2 },
  { id: 3, name: '服饰鞋包', sort: 3 },
  { id: 4, name: '食品生鲜', sort: 4 },
  { id: 5, name: '图书文娱', sort: 5 },
  { id: 6, name: '运动户外', sort: 6 }
]

/** 各类型下的商品名与价格区间 */
const GOODS_SEED = {
  1: {
    names: [
      '旗舰智能手机 Pro',
      '无线降噪蓝牙耳机',
      '高性能平板电脑',
      '机械键盘 87 键',
      '20000mAh 移动电源'
    ],
    price: [199, 6999]
  },
  2: {
    names: [
      '一级能效变频空调',
      '滚筒全自动洗衣机',
      '对开门大容量冰箱',
      '激光导航扫地机器人',
      '除甲醛空气净化器'
    ],
    price: [899, 5299]
  },
  3: {
    names: ['纯棉圆领 T 恤', '轻量缓震运动鞋', '大容量双肩背包', '轻薄羽绒服'],
    price: [59, 899]
  },
  4: {
    names: ['有机纯牛奶整箱', '进口每日坚果礼盒', '阳澄湖大闸蟹礼券', '新疆特级红枣'],
    price: [39, 599]
  },
  5: {
    names: ['《JavaScript 高级程序设计》', '《Vue.js 设计与实现》', '儿童科普绘本套装'],
    price: [29, 169]
  },
  6: {
    names: ['碳纤维登山杖', '专业防滑瑜伽垫', '户外露营帐篷', '速干跑步套装'],
    price: [45, 1299]
  }
}

/** 用户种子（1 个管理员 + 3 个买家，用于让订单分属不同用户） */
const USER_SEED = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    role: 'admin',
    nickname: '系统管理员',
    phone: '13800000001',
    avatar: '',
    createTime: '2026-01-01 09:00:00'
  },
  {
    id: 2,
    username: 'test',
    password: '123456',
    role: 'user',
    nickname: '测试用户',
    phone: '13800000002',
    avatar: '',
    createTime: '2026-02-14 09:00:00'
  },
  {
    id: 3,
    username: 'lisi',
    password: '123456',
    role: 'user',
    nickname: '李四',
    phone: '13800000003',
    avatar: '',
    createTime: '2026-03-02 09:00:00'
  },
  {
    id: 4,
    username: 'wangwu',
    password: '123456',
    role: 'user',
    nickname: '王五',
    phone: '13800000004',
    avatar: '',
    createTime: '2026-03-18 09:00:00'
  }
]

/**
 * 轮播文案种子
 * 说明：tag / title / subtitle / cta 为**新增字段**，供前台 HomeHero 用 HTML 叠加排版；
 *      接口 URL 与返回数组结构不变，旧数据缺字段时前端 v-if 兜底
 */
const BANNER_SEED = [
  {
    tag: '新品首发',
    title: '新机首发 · 至高立减 800 元',
    subtitle: '旗舰影像与长续航兼得，首发期享 12 期免息',
    cta: '立即选购'
  },
  {
    tag: '家电焕新',
    title: '家电焕新季 · 满 3000 减 300',
    subtitle: '冰箱、洗衣机、空调全场参与，送装一体',
    cta: '查看会场'
  },
  {
    tag: '秋季出行',
    title: '秋季出行 · 户外装备 5 折起',
    subtitle: '冲锋衣、登山杖、露营套装限时直降',
    cta: '去逛逛'
  }
]

/**
 * 确定性伪随机数生成器（mulberry32）
 * @param {number} seed 随机种子
 * @returns {() => number} 返回 [0,1) 区间的随机数
 */
function createRandom(seed) {
  let t = seed
  return function random() {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** 两位补零 */
const pad = (n) => String(n).padStart(2, '0')

/**
 * 构造种子数据
 * @returns {object} 完整的模拟数据库
 */
export function createSeed() {
  const random = createRandom(20261009)
  const randInt = (min, max) => Math.floor(random() * (max - min + 1)) + min
  const pick = (arr) => arr[randInt(0, arr.length - 1)]

  // ── 商品 ──────────────────────────────────────────────
  const goods = []
  let goodsId = 1000
  Object.keys(GOODS_SEED).forEach((categoryId) => {
    const conf = GOODS_SEED[categoryId]
    conf.names.forEach((name) => {
      goodsId += 1
      const [min, max] = conf.price
      goods.push({
        id: goodsId,
        name,
        categoryId: Number(categoryId),
        price: randInt(min, max),
        stock: randInt(0, 300),
        sales: randInt(0, 500),
        status: random() > 0.15 ? 1 : 0, // 约 85% 上架
        cover: buildCover(name, Number(categoryId)),
        description: `${name}，正品保障，七天无理由退换。`,
        createTime: `2026-0${randInt(1, 9)}-${pad(randInt(1, 28))} 10:00:00`
      })
    })
  })

  // ── 用户 ──────────────────────────────────────────────
  const users = USER_SEED.map((user) => ({ ...user }))
  const buyers = users.filter((u) => u.role === 'user')

  // ── 订单（覆盖 2026-05 ~ 2026-10，用于按月销量统计）──────
  const orders = []
  let orderId = 2000
  const months = [5, 6, 7, 8, 9, 10]
  months.forEach((month) => {
    const count = randInt(5, 9)
    for (let i = 0; i < count; i += 1) {
      orderId += 1
      const buyer = pick(buyers)
      const itemCount = randInt(1, 3)
      const items = []
      for (let j = 0; j < itemCount; j += 1) {
        const g = pick(goods)
        items.push({
          goodsId: g.id,
          goodsName: g.name,
          price: g.price,
          count: randInt(1, 3),
          cover: g.cover
        })
      }
      const totalPrice = items.reduce((sum, it) => sum + it.price * it.count, 0)
      const day = pad(randInt(1, 28))
      const orderMonth = pad(month)
      const r = random()
      // 状态分布：15% 待付款 / 20% 待发货 / 25% 待收货 / 30% 已完成 / 10% 已取消
      const status = r < 0.15 ? 0 : r < 0.35 ? 1 : r < 0.6 ? 2 : r < 0.9 ? 3 : 4
      orders.push({
        id: orderId,
        orderNo: `NO2026${orderMonth}${day}${String(orderId).slice(-4)}`,
        userId: buyer.id,
        userName: buyer.nickname,
        items,
        totalPrice,
        status,
        address: {
          name: buyer.nickname,
          phone: buyer.phone,
          detail: '广东省广州市海珠区某某路 100 号'
        },
        createTime: `2026-${orderMonth}-${day} ${pad(randInt(9, 20))}:${pad(randInt(0, 59))}:00`
      })
    }
  })

  // ── 收藏 ──────────────────────────────────────────────
  const favorites = []
  let favoriteId = 3000
  buyers.forEach((user) => {
    const picked = new Set()
    for (let i = 0; i < randInt(2, 4); i += 1) {
      const g = pick(goods)
      if (picked.has(g.id)) continue
      picked.add(g.id)
      favoriteId += 1
      favorites.push({
        id: favoriteId,
        userId: user.id,
        goodsId: g.id,
        createTime: '2026-09-20 12:00:00'
      })
    }
  })

  return {
    categories: CATEGORY_SEED.slice(),
    goods,
    orders,
    users,
    favorites,
    banners: BANNER_SEED.map((item, i) => ({
      id: i + 1,
      ...item,
      image: buildBanner(i + 1),
      sort: i + 1
    }))
  }
}
