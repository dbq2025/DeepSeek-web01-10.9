/**
 * ECharts 实例管理（组合函数）
 * 职责：图表初始化 / 更新 / 自适应 / 销毁，统一处理生命周期，避免内存泄漏
 * 用法：
 *   const chartRef = ref(null)
 *   const { setOption } = useEcharts(chartRef)
 *   onMounted(() => setOption({ ... }))
 */
import { onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

/**
 * @param {import('vue').Ref<HTMLElement|null>} elRef 图表容器 ref
 * @returns {object} 图表操作方法
 */
export function useEcharts(elRef) {
  /** @type {import('echarts').ECharts|null} */
  let chart = null

  /** 初始化实例（重复调用会复用已有实例） */
  function init() {
    if (!elRef.value) return null
    if (!chart) {
      chart = echarts.init(elRef.value)
    }
    return chart
  }

  /**
   * 设置图表配置
   * @param {import('echarts').EChartsOption} option 配置项
   * @param {boolean} [notMerge=true] 是否不与旧配置合并
   * @returns {void}
   */
  function setOption(option, notMerge = true) {
    init()
    if (chart) chart.setOption(option, notMerge)
  }

  /** 自适应尺寸 */
  function resize() {
    if (chart) chart.resize()
  }

  /** 销毁实例 */
  function dispose() {
    if (chart) {
      chart.dispose()
      chart = null
    }
  }

  /** 获取原始实例（特殊场景使用） */
  function getInstance() {
    return chart
  }

  onMounted(() => {
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    dispose()
  })

  return { init, setOption, resize, dispose, getInstance }
}
