/**
 * 主题色读取工具
 * 职责：从 CSS 变量里读出当前主题色，供 ECharts 这类
 *       「渲染到 canvas、无法直接使用 CSS 变量」的场景使用，
 *       避免在 JS 里硬编码十六进制色值（见 CLAUDE.md 第 7 章）
 * 说明：颜色来源已从 --el-* 迁移到 --app-*（设计令牌层），
 *      换主题只需改 variables.scss，图表自动跟随
 */

/** 业务语义 → CSS 变量名 */
const COLOR_VARS = {
  primary: '--app-color-primary',
  price: '--app-color-price',
  accent: '--app-color-accent',
  success: '--el-color-success',
  warning: '--el-color-warning',
  danger: '--el-color-danger',
  info: '--app-text-3',
  text: '--app-text-3',
  textStrong: '--app-text-1',
  splitLine: '--app-border',
  background: '--app-bg-card',
  subtle: '--app-bg-subtle',
  chart1: '--app-chart-1',
  chart2: '--app-chart-2',
  chart3: '--app-chart-3',
  chart4: '--app-chart-4',
  chart5: '--app-chart-5'
}

/**
 * 读取当前主题色
 * @returns {Record<keyof typeof COLOR_VARS, string>} 各语义色，形如 `#3355e0`
 */
export function getThemeColors() {
  const styles = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    Object.entries(COLOR_VARS).map(([key, cssVar]) => [key, styles.getPropertyValue(cssVar).trim()])
  )
}

/**
 * 取图表类目色板（5 色按序）
 * @param {ReturnType<typeof getThemeColors>} [colors] 复用已读取的颜色，避免重复 getComputedStyle
 * @returns {string[]} 色板数组
 */
export function getChartPalette(colors = getThemeColors()) {
  return [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5]
}

/**
 * 十六进制色 → rgba 字符串（用于面积渐变、半透明遮罩）
 * @param {string} hex 形如 #3355e0
 * @param {number} alpha 0~1
 * @returns {string} rgba(...)；入参非 6 位 hex 时原样返回
 */
export function withAlpha(hex, alpha) {
  const match = /^#?([\da-f]{6})$/i.exec(String(hex).trim())
  if (!match) return hex
  const int = parseInt(match[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
