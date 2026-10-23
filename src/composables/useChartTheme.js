/**
 * ECharts 通用主题（组合函数 / 工具函数）
 * 职责：把「tooltip 深色圆角、网格留白、轴样式、动画时长」等重复配置收敛到一处，
 *       页面只描述数据形状（series）与业务差异
 * 说明：色值一律从 CSS 变量读取（utils/theme.js），不在本文件硬编码
 */
import { getThemeColors, getChartPalette, withAlpha } from '@/utils/theme'

/** 统一入场动画：700ms / cubicOut（P4-3） */
const ANIMATION = { animationDuration: 700, animationEasing: 'cubicOut' }

/**
 * 基础 option：tooltip / grid / 轴 / 动画的公共部分
 * @param {object} [overrides] 需要覆盖的字段（浅合并到顶层）
 * @returns {object} ECharts option 片段
 */
export function baseOption(overrides = {}) {
  const colors = getThemeColors()
  return {
    ...ANIMATION,
    textStyle: { color: colors.text, fontFamily: 'inherit' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.textStrong,
      borderWidth: 0,
      padding: [8, 12],
      borderRadius: 10,
      textStyle: { color: colors.background, fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: withAlpha(colors.textStrong, 0.04) } }
    },
    grid: { left: 4, right: 4, top: 36, bottom: 8, containLabel: true },
    ...overrides
  }
}

/**
 * 计算「整齐」的轴刻度：保证 max / splitNumber 每段都是 1/2/2.5/5/10 这类整数步长
 * 说明：只返回 max 不够 —— ECharts 会自行调 splitNumber 去凑整数刻度，
 *      导致双轴段数不等（左轴 4 段、右轴 5 段）。必须同时把 interval 固定下来
 * @param {number[]} values 原始数据
 * @param {number} [splitNumber=4] 分段数（双轴对齐要求两轴用同一分段数）
 * @returns {{max:number, interval:number}} 轴最大值与固定步长（单位：数据本身单位）
 */
export function niceScale(values, splitNumber = 4) {
  const max = Math.max(0, ...values.filter((v) => Number.isFinite(v)))
  if (max === 0) return { max: splitNumber, interval: 1 }
  const rough = max / splitNumber
  const mag = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / mag
  const stepNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10
  const interval = stepNorm * mag
  return { max: interval * splitNumber, interval }
}

/**
 * 只取轴最大值（需要 interval 才能保证刻度对齐，单轴场景用它就够了）
 * @param {number[]} values 原始数据
 * @param {number} [splitNumber=4] 分段数
 * @returns {number} 轴最大值
 */
export function niceAxisMax(values, splitNumber = 4) {
  return niceScale(values, splitNumber).max
}

/**
 * 图表类目色板
 * @returns {string[]} 5 色数组
 */
export function palette() {
  return getChartPalette()
}

/**
 * 类目轴（X 轴）公共样式
 * @param {string[]} data 类目
 * @returns {object}
 */
export function categoryAxis(data) {
  const colors = getThemeColors()
  return {
    type: 'category',
    data,
    axisLine: { lineStyle: { color: colors.splitLine } },
    axisTick: { show: false },
    axisLabel: { color: colors.text, fontSize: 12, margin: 12 }
  }
}

/**
 * 数值轴（Y 轴）公共样式
 * @param {object} options 覆盖项
 * @param {object} options.colors 主题色
 * @param {number} options.max 轴最大值
 * @param {number} options.interval 固定刻度步长（与 max 配套，保证段数一致）
 * @param {boolean} [options.showSplitLine=true] 是否显示网格线（双轴时只留左轴）
 * @param {(v:number)=>string} [options.formatter] 刻度格式化
 * @returns {object}
 */
export function valueAxis({ colors, max, interval, showSplitLine = true, formatter }) {
  return {
    type: 'value',
    min: 0,
    max,
    interval,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: colors.text, fontSize: 12, formatter },
    splitLine: {
      show: showSplitLine,
      lineStyle: { color: colors.splitLine, type: 'dashed' }
    }
  }
}

export { ANIMATION, withAlpha, getThemeColors }
