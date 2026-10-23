/**
 * 数据看板图表配置构造
 * 职责：把 option 的构造逻辑从页面组件搬到独立函数，
 *       让 dashboard/index.vue 保持在 300 行阈值以内，同时便于单测与复用
 * 说明：所有色值来自 CSS 变量（通过 useChartTheme 的 baseOption / valueAxis）
 */
import { baseOption, categoryAxis, valueAxis, niceScale, withAlpha } from './useChartTheme'

/**
 * 万元刻度（销售额轴用，避免 6 位数字挤压刻度）
 * @param {number} value 金额（元）
 * @returns {string}
 */
function wanLabel(value) {
  return value >= 10000 ? `${value / 10000}万` : String(value)
}

/**
 * 近 N 个月销售趋势：柱状销量（左轴）+ 折线销售额（右轴）
 * 双轴用同一 splitNumber 并各自 nice 到整齐最大值，保证左右刻度行数一致
 * @param {Array<{month:string,salesCount:number,amount:number}>} data 按月聚合数据
 * @param {object} colors 主题色（getThemeColors 的返回值）
 * @returns {object} ECharts option
 */
export function buildTrendOption(data, colors) {
  const maxCount = Math.max(1, ...data.map((item) => item.salesCount))
  const maxAmount = Math.max(1, ...data.map((item) => item.amount))
  const splitNumber = 4

  // 两轴用同一分段数，并各自固定 interval —— 这样左右网格线才逐行对齐
  const countScale = niceScale([maxCount], splitNumber)
  const amountScale = niceScale([maxAmount], splitNumber)

  return baseOption({
    legend: {
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
      textStyle: { color: colors.text, fontSize: 12 }
    },
    grid: { left: 4, right: 4, top: 40, bottom: 4, containLabel: true },
    xAxis: categoryAxis(data.map((item) => item.month)),
    yAxis: [
      valueAxis({ colors, max: countScale.max, interval: countScale.interval }),
      valueAxis({
        colors,
        max: amountScale.max,
        interval: amountScale.interval,
        showSplitLine: false,
        formatter: wanLabel
      })
    ],
    series: [
      {
        name: '销量',
        type: 'bar',
        barWidth: 18,
        // 主色纵向渐变：柱底淡、柱顶饱和，弱化「色块」感
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: colors.primary },
              { offset: 1, color: withAlpha(colors.primary, 0.45) }
            ]
          }
        },
        data: data.map((item) => item.salesCount)
      },
      {
        name: '销售额',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.3,
        showSymbol: false,
        lineStyle: { width: 2, color: colors.warning },
        itemStyle: { color: colors.warning },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(colors.warning, 0.12) },
              { offset: 1, color: withAlpha(colors.warning, 0) }
            ]
          }
        },
        data: data.map((item) => item.amount)
      }
    ]
  })
}

/**
 * 商品类型销量占比：环形图
 * 标签默认隐藏（hover 才显示），图例放右侧竖排，中心文案由页面 HTML 叠加
 * @param {Array<{name:string,value:number}>} data 类型聚合数据
 * @param {object} colors 主题色
 * @returns {object} ECharts option
 */
export function buildPieOption(data, colors) {
  const paletteColors = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5]

  return baseOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: colors.textStrong,
      borderWidth: 0,
      padding: [8, 12],
      borderRadius: 10,
      textStyle: { color: colors.background, fontSize: 12 },
      formatter: '{b}：{c} 件（{d}%）'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 0,
      top: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 10,
      textStyle: { color: colors.text, fontSize: 12 }
    },
    color: paletteColors,
    series: [
      {
        name: '类型销量',
        type: 'pie',
        radius: ['62%', '82%'],
        center: ['36%', '50%'],
        avoidLabelOverlap: true,
        // 用卡底色描边，把相邻扇区分开（不是加白边）
        itemStyle: { borderColor: colors.background, borderWidth: 3 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scaleSize: 6,
          label: {
            show: true,
            color: colors.textStrong,
            fontSize: 12,
            fontWeight: 600,
            formatter: '{b}\n{d}%'
          }
        },
        data
      }
    ]
  })
}
