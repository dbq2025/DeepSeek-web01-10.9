/**
 * 媒体查询（组合函数）
 * 职责：在 JS 侧获取响应式断点状态，用于「窄屏换一套布局组件」这类纯 CSS 做不到的场景
 *       （例如表格 ↔ 卡片的结构性切换）
 * 注意：
 *   1. 断点值必须与 assets/styles/variables.scss 的 $breakpoint-sm 保持一致（768px），
 *      SCSS 变量无法直接在 JS 中读取，故此处硬编码并在此注明同步点。
 *   2. 监听必须在 onUnmounted 中清理（CLAUDE.md 第 3.3 节强制条款）。
 * 用法：
 *   const isMobile = useMediaQuery('(max-width: 767px)')
 */
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * @param {string} query 媒体查询字符串
 * @returns {import('vue').Ref<boolean>} 是否命中
 */
export function useMediaQuery(query) {
  const matches = ref(false)
  /** @type {MediaQueryList|null} */
  let mql = null

  /** @param {MediaQueryListEvent} event 变更事件 */
  const onChange = (event) => {
    matches.value = event.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    matches.value = mql.matches
    mql.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    if (mql) mql.removeEventListener('change', onChange)
    mql = null
  })

  return matches
}

/** 常用断点：与 $breakpoint-sm (768px) 对应 */
export const MOBILE_QUERY = '(max-width: 767px)'
