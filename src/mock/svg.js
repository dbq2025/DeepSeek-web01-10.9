/**
 * Mock 占位图生成（内联 SVG → DataURL）
 * 职责：为商品封面与轮播图提供「有设计感的抽象图」，让列表页 / 详情页有可渲染的图像
 * 说明：1) 纯前端项目不引入外部图片 —— 既不依赖网络，也便于截图复现；
 *       2) 全部图形由商品名 hash 决定位置与倾角，同一商品每次刷新完全一致（确定性）；
 *       3) 轮播图不画文字，文案改由 HomeHero 用 HTML 叠加（排版更可控、可响应式）。
 * 注意：本文件位于 mockPath（src/mock/modules）之外，不会被 Mock 中间件当作接口文件加载
 */

/** 各商品类型的主色（用于生成浅色渐变底与几何形） */
const COVER_COLORS = {
  1: '#3355e0',
  2: '#12b76a',
  3: '#f79009',
  4: '#f04438',
  5: '#7a5af8',
  6: '#0ba5ec'
}

/** 封面底色（冷白，避免纯白在灰色页面里「发灰」） */
const COVER_BASE = '#f7f9ff'

/** 轮播图配色方案（深色渐变，每张一个色系） */
const BANNER_THEMES = [
  ['#16204d', '#3355e0'],
  ['#3d1520', '#e93b3d'],
  ['#08302c', '#12b76a']
]

/**
 * 转义 XML 特殊字符（商品名可能含《》& 等符号，直接拼进 SVG 会破坏结构）
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
 * 字符串 → 稳定的正整数（FNV-1a 变体）
 * 说明：不用 Math.random，保证同一商品名的图形位置每次一致，截图可复现
 * @param {string} text 输入文本
 * @returns {number}
 */
function hashOf(text) {
  let hash = 2166136261
  const str = String(text)
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

/**
 * 把 SVG 源码转成可直接放进 img src 的 DataURL
 * @param {string} svg SVG 源码
 * @returns {string}
 */
function toDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * 生成商品封面（480×360，4:3 与卡片封面比例一致）
 * 结构：冷白底 + 品类色浅渐变 + 2~3 个半透明几何形（位置由商品名 hash 决定）+ 极淡品类首字
 * @param {string} name 商品名
 * @param {number} categoryId 商品类型 id
 * @returns {string} data:image/svg+xml 形式的图片地址
 */
export function buildCover(name, categoryId) {
  const color = COVER_COLORS[categoryId] || '#8a919e'
  const hash = hashOf(name)
  // 三个几何形的位置 / 倾角全部由 hash 派生：同一商品固定，不同商品彼此不同
  const rotate = (hash % 13) - 6
  const circleX = 120 + (hash % 240)
  const rectX = 40 + ((hash >> 3) % 180)
  const rectY = 30 + ((hash >> 6) % 90)
  const dotX = 60 + ((hash >> 9) % 360)
  const dotY = 40 + ((hash >> 12) % 200)
  const initial = escapeXml(name.trim().charAt(0).toUpperCase())

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${color}" stop-opacity="0.16"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0.02"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="480" height="360" fill="${COVER_BASE}"/>` +
    `<rect width="480" height="360" fill="url(#bg)"/>` +
    `<g transform="rotate(${rotate} 240 180)">` +
    `<circle cx="${circleX}" cy="300" r="150" fill="${color}" fill-opacity="0.10"/>` +
    `<rect x="${rectX}" y="${rectY}" width="168" height="120" rx="30" fill="${color}" fill-opacity="0.14"/>` +
    `<circle cx="${dotX}" cy="${dotY}" r="34" fill="${color}" fill-opacity="0.18"/>` +
    `</g>` +
    `<text x="440" y="320" font-size="150" font-weight="700" fill="${color}" fill-opacity="0.06" ` +
    `text-anchor="end" font-family="sans-serif">${initial}</text>` +
    `</svg>`

  return toDataUrl(svg)
}

/**
 * 生成轮播底图（1200×360 宽幅，深色渐变 + 径向高光 + 弧线装饰）
 * 说明：图上不写文字 —— 文案由 HomeHero 的 HTML 图层负责，避免图片里的字被裁切或缩放失真
 * @param {number} index 序号（1 起），用于挑选配色
 * @returns {string}
 */
export function buildBanner(index) {
  const [deep, bright] = BANNER_THEMES[(index - 1) % BANNER_THEMES.length]

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${deep}"/>` +
    `<stop offset="1" stop-color="${bright}"/>` +
    `</linearGradient>` +
    `<radialGradient id="glow1" cx="0.78" cy="0.2" r="0.6">` +
    `<stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>` +
    `<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>` +
    `</radialGradient>` +
    `<radialGradient id="glow2" cx="0.42" cy="1" r="0.5">` +
    `<stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>` +
    `<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="1200" height="360" fill="url(#bg)"/>` +
    `<rect width="1200" height="360" fill="url(#glow1)"/>` +
    `<rect width="1200" height="360" fill="url(#glow2)"/>` +
    // 两条弧线做「流动感」，透明度低到不抢文案
    `<circle cx="980" cy="180" r="230" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5"/>` +
    `<circle cx="980" cy="180" r="320" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"/>` +
    `<circle cx="180" cy="330" r="130" fill="#ffffff" fill-opacity="0.05"/>` +
    `</svg>`

  return toDataUrl(svg)
}
