/**
 * Mock 占位图生成
 * 职责：用内联 SVG 生成商品封面与轮播图（DataURL），让列表页 / 详情页有真实图片可渲染
 * 说明：纯前端项目不引入外部图片资源 —— 既不依赖网络，也便于截图与离线演示
 * 注意：本文件位于 mockPath（src/mock/modules）之外，不会被 Mock 中间件当作接口文件加载
 */

/** 各商品类型对应的封面色（用于生成占位封面） */
const COVER_COLORS = {
  1: '#4a7cf7',
  2: '#20b2aa',
  3: '#f2994a',
  4: '#eb5757',
  5: '#9b51e0',
  6: '#27ae60'
}

/** 轮播图底色（按序号循环取用） */
const BANNER_COLORS = ['#4a7cf7', '#eb5757', '#27ae60']

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
 * 说明：底色按商品类型区分，视觉上可辨识
 * @param {string} name 商品名
 * @param {number} categoryId 商品类型 id
 * @returns {string} data:image/svg+xml 形式的图片地址
 */
export function buildCover(name, categoryId) {
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
export function buildBanner(title, index) {
  const color = BANNER_COLORS[(index - 1) % BANNER_COLORS.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360">` +
    `<rect width="1200" height="360" fill="${color}"/>` +
    `<text x="600" y="196" font-size="40" fill="#ffffff" text-anchor="middle" font-family="sans-serif">${escapeXml(title)}</text>` +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
