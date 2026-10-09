/**
 * 主题色读取工具
 * 职责：从 Element Plus 的 CSS 变量里读出当前主题色，供 ECharts 这类
 *       「渲染到 canvas、无法直接使用 CSS 变量」的场景使用，
 *       避免在 JS 里硬编码十六进制色值（见 CLAUDE.md 第 7 章）
 */

/** 业务语义 → CSS 变量名 */
const COLOR_VARS = {
  primary: '--el-color-primary',
  success: '--el-color-success',
  warning: '--el-color-warning',
  danger: '--el-color-danger',
  info: '--el-text-color-secondary',
  text: '--el-text-color-secondary',
  splitLine: '--el-border-color-lighter',
  background: '--el-bg-color'
}

/**
 * 读取当前主题色
 * @returns {Record<keyof typeof COLOR_VARS, string>} 各语义色，形如 `rgb(64, 158, 255)`
 */
export function getThemeColors() {
  const styles = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    Object.entries(COLOR_VARS).map(([key, cssVar]) => [key, styles.getPropertyValue(cssVar).trim()])
  )
}
