<!--
  数据概览（后台首页 / 样板页）
  职责：展示核心指标 + 两张 ECharts 图表（按月销售趋势 / 按类型销量占比）
  说明：1) 所有聚合都在 mock 端多表关联完成，前端只渲染，不做二次计算；
       2) 「时间范围」是真实筛选：对 salesByMonth 数组做切片后重绘，不是装饰按钮；
       3) KPI 副信息只放可推导的真实值（上架率 / 下架数 / 客单价 / 月均），不编造环比同比
-->
<template>
  <div class="dashboard">
    <PageHeader title="数据概览" :description="scopeText">
      <template #actions>
        <el-radio-group v-model="range" class="dashboard__range is-pill" size="small">
          <el-radio-button v-for="item in RANGE_OPTIONS" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </template>
    </PageHeader>

    <!-- KPI 行 -->
    <div class="dashboard__kpi">
      <StatCard v-for="card in overviewCards" :key="card.label" v-bind="card" :loading="loading" />
    </div>

    <!-- 图表行：16 / 8 栅格，等高拉伸 -->
    <div class="dashboard__charts">
      <ChartPanel title="销售趋势" subtitle="柱状为销量（左轴），折线为销售额（右轴）">
        <div ref="trendRef" class="chart-canvas" />
        <template #footer>
          <p class="dashboard__note">销售额仅统计有效订单（已排除取消订单）</p>
        </template>
      </ChartPanel>

      <ChartPanel title="商品类型销量占比" subtitle="订单明细 → 商品 → 商品类型 三表关联聚合">
        <div class="dashboard__pie-wrap">
          <div ref="pieRef" class="chart-canvas" />
          <div class="dashboard__pie-center">
            <span class="dashboard__pie-value">{{ totalSales }}</span>
            <span class="dashboard__pie-label">总销量（件）</span>
          </div>
        </div>
      </ChartPanel>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Goods, List, Money, Sell } from '@element-plus/icons-vue'
import StatCard from '@/components/admin/StatCard.vue'
import ChartPanel from '@/components/admin/ChartPanel.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useEcharts } from '@/composables/useEcharts'
import { buildPieOption, buildTrendOption } from '@/composables/useDashboardCharts'
import { getOrdersByCategoryApi, getOverviewApi, getSalesByMonthApi } from '@/api/admin/stat'
import { formatMoney } from '@/utils/format'
import { getThemeColors } from '@/utils/theme'

/** 可选时间范围（对已有按月数组切片，不新增接口） */
const RANGE_OPTIONS = [
  { label: '近 3 个月', value: 3 },
  { label: '近 6 个月', value: 6 }
]

const loading = ref(false)
const range = ref(6)
/** 数据更新时刻（真实时间戳，替代无法实现的「导出」按钮） */
const updatedAt = ref('')
const overview = ref({ goodsCount: 0, onSaleCount: 0, orderCount: 0, totalAmount: 0 })
const monthData = ref([])
const categoryData = ref([])

const trendRef = ref(null)
const pieRef = ref(null)
const trendChart = useEcharts(trendRef)
const pieChart = useEcharts(pieRef)

/** 按所选范围切片后的月份数据 */
const visibleMonths = computed(() => monthData.value.slice(-range.value))

/** 统计口径文案：区间 + 更新时间 */
const scopeText = computed(() => {
  const months = visibleMonths.value
  if (!months.length)
    return `统计口径：加载中${updatedAt.value ? ` · 更新于 ${updatedAt.value}` : ''}`
  const first = months[0].month
  const last = months[months.length - 1].month
  return `统计口径 ${first} ~ ${last} · 更新于 ${updatedAt.value || '—'}`
})

/** 环形图中心的总销量（类型销量之和，与图表数据同源） */
const totalSales = computed(() => categoryData.value.reduce((sum, item) => sum + item.value, 0))

/** KPI 卡片：每个 sub 都是可推导的真实值 */
const overviewCards = computed(() => {
  const { goodsCount, onSaleCount, orderCount, totalAmount } = overview.value
  const rate = goodsCount ? Math.round((onSaleCount / goodsCount) * 100) : 0
  const avgOrder = orderCount ? totalAmount / orderCount : 0
  const monthCount = visibleMonths.value.length || 1

  return [
    {
      label: '商品总数',
      value: goodsCount,
      unit: '件',
      icon: Goods,
      color: 'var(--app-color-primary)',
      sub: `上架率 ${rate}%`
    },
    {
      label: '上架商品',
      value: onSaleCount,
      unit: '件',
      icon: Sell,
      color: 'var(--el-color-success)',
      sub: `下架 ${Math.max(0, goodsCount - onSaleCount)} 件`
    },
    {
      label: '订单总数',
      value: orderCount,
      unit: '笔',
      icon: List,
      color: 'var(--el-color-warning)',
      sub: `客单价 ${formatMoney(avgOrder)}`
    },
    {
      label: '销售总额',
      value: formatMoney(totalAmount),
      icon: Money,
      color: 'var(--el-color-danger)',
      sub: `月均 ${formatMoney(totalAmount / monthCount)}`
    }
  ]
})

/** 重绘趋势图（range 变化时也要重跑） */
function renderTrend() {
  trendChart.setOption(buildTrendOption(visibleMonths.value, getThemeColors()))
}

/** 重绘环形图 */
function renderPie() {
  pieChart.setOption(buildPieOption(categoryData.value, getThemeColors()))
}

// 时间范围切换：只切片已有数组，不发起新请求
watch(range, renderTrend)

/** 拉取统计数据并渲染图表 */
async function loadData() {
  loading.value = true
  try {
    const [overviewData, monthList, categoryList] = await Promise.all([
      getOverviewApi(),
      getSalesByMonthApi(),
      getOrdersByCategoryApi()
    ])
    overview.value = overviewData
    monthData.value = monthList
    categoryData.value = categoryList
    updatedAt.value = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
    renderTrend()
    renderPie()
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  // 撑满内容区高度，避免 1440×900 下页面底部出现大片空白
  min-height: 100%;

  &__range {
    // 胶囊分段控件：选中态为主色，未选中为白底描边
    :deep(.el-radio-button__inner) {
      padding: 6px 14px;
      background: var(--app-bg-card);
      border-color: var(--app-border);
      border-radius: var(--app-radius-pill);
      color: var(--app-text-2);
      font-size: $font-13;
      box-shadow: none;
    }

    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: var(--app-color-primary);
      border-color: var(--app-color-primary);
      color: #fff;
    }
  }

  // KPI：4 列等宽，窄屏自动降到 2 列 / 1 列
  &__kpi {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-5;
  }

  // 图表：2:1（对应 16 / 8 栅格），row 弹性撑满剩余高度
  &__charts {
    display: grid;
    flex: 1;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: $space-5;
    // 340px 图表 + 卡头卡脚，保证 1440×900 下不出现大面积空白
    min-height: 420px;
  }

  &__pie-wrap {
    position: relative;
    display: flex;
    flex: 1;
  }

  // 环形图中心文案：用 HTML 叠在 canvas 上，比 ECharts graphic 更易控制字体
  &__pie-center {
    position: absolute;
    top: 50%;
    left: 36%;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  &__pie-value {
    @include metric-number($font-20);

    color: var(--app-text-1);
  }

  &__pie-label {
    margin-top: 2px;
    color: var(--app-text-3);
    font-size: $font-12;
  }

  &__note {
    margin: 0;
    padding-top: $space-3;
    color: var(--app-text-3);
    font-size: $font-12;
  }
}

// 1280 以下：KPI 两列，图表仍并排但比例放宽
@include respond-below('lg') {
  .dashboard__charts {
    grid-template-columns: minmax(0, 1fr);
  }
}

@include respond-below('md') {
  .dashboard__kpi {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@include respond-below('sm') {
  .dashboard__kpi {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard__charts {
    min-height: 360px;
  }
}
</style>
