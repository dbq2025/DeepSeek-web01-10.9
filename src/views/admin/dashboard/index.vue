<!--
  数据统计页
  职责：展示核心指标卡片 + 两张 ECharts 图表（按月销售趋势 / 按类型销量占比）
  说明：所有聚合都在 mock 端用多表关联完成，前端只负责渲染，不做二次计算
-->
<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col v-for="card in overviewCards" :key="card.label" :xs="12" :sm="12" :md="6">
        <StatCard class="dashboard__card" v-bind="card" :loading="loading" />
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <section class="dashboard__panel">
          <h3 class="dashboard__title">近 6 个月销售趋势</h3>
          <p class="dashboard__hint">订单表按月聚合：柱状为销量，折线为销售额（右轴）</p>
          <div ref="trendRef" class="dashboard__chart"></div>
        </section>
      </el-col>

      <el-col :xs="24" :md="10">
        <section class="dashboard__panel">
          <h3 class="dashboard__title">商品类型销量占比</h3>
          <p class="dashboard__hint">订单明细 → 商品 → 商品类型 三表关联聚合</p>
          <div ref="pieRef" class="dashboard__chart"></div>
        </section>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Goods, List, Money, Sell } from '@element-plus/icons-vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useEcharts } from '@/composables/useEcharts'
import { getOrdersByCategoryApi, getOverviewApi, getSalesByMonthApi } from '@/api/admin/stat'
import { formatMoney } from '@/utils/format'
import { getThemeColors } from '@/utils/theme'

const loading = ref(false)
/** 概览指标 */
const overview = ref({ goodsCount: 0, onSaleCount: 0, orderCount: 0, totalAmount: 0 })

const trendRef = ref(null)
const pieRef = ref(null)
const trendChart = useEcharts(trendRef)
const pieChart = useEcharts(pieRef)

/** 指标卡片配置（图标与配色统一在此维护） */
const overviewCards = computed(() => [
  {
    label: '商品总数',
    value: overview.value.goodsCount,
    unit: '件',
    icon: Goods,
    color: 'var(--el-color-primary)'
  },
  {
    label: '上架商品',
    value: overview.value.onSaleCount,
    unit: '件',
    icon: Sell,
    color: 'var(--el-color-success)'
  },
  {
    label: '订单总数',
    value: overview.value.orderCount,
    unit: '笔',
    icon: List,
    color: 'var(--el-color-warning)'
  },
  {
    label: '销售总额',
    value: formatMoney(overview.value.totalAmount),
    icon: Money,
    color: 'var(--el-color-danger)'
  }
])

/**
 * 渲染按月销售趋势（柱状销量 + 折线销售额，双 Y 轴）
 * @param {Array<{month:string,salesCount:number,amount:number}>} data 按月聚合数据
 * @returns {void}
 */
function renderTrend(data) {
  const colors = getThemeColors()
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['销量', '销售额'], bottom: 0, textStyle: { color: colors.text } },
    grid: { left: 8, right: 8, top: 20, bottom: 42, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.month),
      axisLine: { lineStyle: { color: colors.splitLine } },
      axisLabel: { color: colors.text }
    },
    yAxis: [
      {
        type: 'value',
        name: '销量',
        nameTextStyle: { color: colors.text },
        axisLabel: { color: colors.text },
        splitLine: { lineStyle: { color: colors.splitLine } }
      },
      {
        type: 'value',
        name: '销售额',
        nameTextStyle: { color: colors.text },
        axisLabel: { color: colors.text },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '销量',
        type: 'bar',
        barWidth: 24,
        itemStyle: { color: colors.primary, borderRadius: [4, 4, 0, 0] },
        data: data.map((item) => item.salesCount)
      },
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        symbolSize: 7,
        itemStyle: { color: colors.warning },
        data: data.map((item) => item.amount)
      }
    ]
  })
}

/**
 * 渲染商品类型销量占比（环形图）
 * @param {Array<{name:string,value:number}>} data 类型聚合数据
 * @returns {void}
 */
function renderPie(data) {
  const colors = getThemeColors()
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}：{c} 件（{d}%）' },
    legend: { bottom: 0, textStyle: { color: colors.text } },
    color: [colors.primary, colors.success, colors.warning, colors.danger, colors.info],
    series: [
      {
        name: '类型销量',
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: colors.background, borderWidth: 2 },
        label: { color: colors.text, formatter: '{b}\n{d}%' },
        data
      }
    ]
  })
}

/** 拉取统计数据并渲染图表 */
async function loadData() {
  loading.value = true
  try {
    const [overviewData, monthData, categoryData] = await Promise.all([
      getOverviewApi(),
      getSalesByMonthApi(),
      getOrdersByCategoryApi()
    ])
    overview.value = overviewData
    renderTrend(monthData)
    renderPie(categoryData)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.dashboard {
  &__card {
    margin-bottom: 16px;
  }

  &__panel {
    @include card-surface;

    margin-bottom: 16px;
  }

  &__title {
    margin: 0 0 4px;
    color: var(--el-text-color-primary);
    font-size: 15px;
  }

  &__hint {
    margin: 0 0 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__chart {
    width: 100%;
    height: 320px;
  }
}
</style>
