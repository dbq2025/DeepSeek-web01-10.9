/**
 * Mock 内存数据库
 * 职责：维护商品类型 / 商品 / 订单 / 用户 / 收藏 / 轮播等模拟表，供各 mock 模块读写
 *
 * 设计说明（重要）：
 * 1. mock 模块由 build/mock-server-plugin.js 用 Node 原生 ESM 动态 import 加载，
 *    热重载时会带 ?t= 时间戳重新导入、得到全新模块实例，
 *    因此共享数据必须挂 globalThis 单例，保证所有接口读写同一份数据。
 * 2. Mock 运行在 Node（Vite dev server）进程内，没有 localStorage；
 *    数据存活于 dev server 进程，浏览器刷新不丢，重启 dev server 才重置为种子数据。
 */

const GLOBAL_KEY = '__ECOM_MOCK_DB__'

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

/**
 * 确定性伪随机数生成器（保证每次启动的种子数据一致）
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

/** 各商品类型对应的封面色（用于生成占位封面） */
const COVER_COLORS = {
  1: '#4a7cf7',
  2: '#20b2aa',
  3: '#f2994a',
  4: '#eb5757',
  5: '#9b51e0',
  6: '#27ae60'
}

/**
 * 转义 XML 特殊字符（商品名含《》等符号，直接拼进 SVG 会破坏结构）
 * @param {string} text 原始文本
 * @returns {string}
 */
function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 生成 SVG 占位封面（DataURL）
 * 说明：纯前端项目不引入外部图片资源，用内联 SVG 让列表页 / 详情页有真实图片可渲染，
 *       既不依赖网络，也便于截图与离线演示；底色按商品类型区分，视觉上可辨识
 * @param {string} name 商品名
 * @param {number} categoryId 商品类型 id
 * @returns {string} data:image/svg+xml 形式的图片地址
 */
function buildCover(name, categoryId) {
  const color = COVER_COLORS[categoryId] || '#909399'
  const label = escapeXml(name.length > 9 ? `${name.slice(0, 9)}…` : name)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
    `<rect width="240" height="240" fill="${color}"/>` +
    `<text x="120" y="112" font-size="16" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${label}</text>` +
    `<text x="120" y="140" font-size="12" fill="#ffffffcc" text-anchor="middle" font-family="sans-serif">NO IMAGE</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * 生成轮播图占位图（DataURL，宽幅比例）
 * @param {string} title 轮播标题
 * @param {number} index 序号，用于挑选底色
 * @returns {string}
 */
function buildBanner(title, index) {
  const colors = ['#4a7cf7', '#eb5757', '#27ae60']
  const color = colors[(index - 1) % colors.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360">` +
    `<rect width="1200" height="360" fill="${color}"/>` +
    `<text x="600" y="196" font-size="40" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${escapeXml(title)}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * 构造种子数据
 * @returns {object} 完整的模拟数据库
 */
function createSeed() {
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
  const users = [
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
    banners: [
      {
        id: 1,
        title: '新机首发 · 至高立减 800 元',
        image: buildBanner('新机首发 · 至高立减 800 元', 1),
        sort: 1
      },
      {
        id: 2,
        title: '家电焕新季 · 满 3000 减 300',
        image: buildBanner('家电焕新季 · 满 3000 减 300', 2),
        sort: 2
      },
      {
        id: 3,
        title: '秋季出行 · 户外装备 5 折起',
        image: buildBanner('秋季出行 · 户外装备 5 折起', 3),
        sort: 3
      }
    ]
  }
}

/**
 * 获取（或初始化）全局唯一的模拟数据库
 * @returns {object} 模拟数据库
 */
export function getDb() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = createSeed()
  }
  return globalThis[GLOBAL_KEY]
}
