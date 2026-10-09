<!--
  通用组件演示页（P2 阶段交付物）
  职责：集中演示 components/common 下 7 个通用组件的实际效果与用法，
       数据全部走真实 Mock 接口（不写死假数据），兼作组件使用文档
  说明：
    1. 本页不属于课程设计的业务功能页面，仅用于开发自测与阶段验收演示；
    2. 弹窗表单已拆到 GoodsFormDialog.vue，避免本页同时承载「列表 + 弹窗 + 表单」（CLAUDE.md 2.3）；
    3. 支持 /demo?open=dialog 直接打开弹窗，便于分享演示链接与自动化冒烟测试。
-->
<template>
  <div class="demo">
    <h2 class="demo__heading">通用组件演示（P2）</h2>
    <el-alert
      class="demo__intro"
      type="info"
      :closable="false"
      show-icon
      title="本页演示 SearchForm / DataTable / Pagination / StatusTag / ImageUpload / FormDialog / EmptyState，数据全部来自 Mock 接口"
    />

    <!-- ── 1. 搜索栏 + 表格 + 分页 ───────────────────────── -->
    <section class="demo__section">
      <h3 class="demo__subheading">1. SearchForm + DataTable + Pagination</h3>
      <p class="demo__hint">
        搜索栏由 fields 配置驱动；表格由 columns 配置驱动，其中「商品名称」「操作」两列使用了动态插槽自定义。
      </p>

      <SearchForm
        :model-value="query"
        :fields="searchFields"
        :loading="loading"
        @search="search"
        @reset="reset"
      >
        <el-button type="primary" @click="formDialogRef?.open()">新增商品</el-button>
      </SearchForm>

      <DataTable
        :columns="columns"
        :data="list"
        :loading="loading"
        show-index
        empty-text="没有符合条件的商品"
      >
        <template #col-name="{ row }">
          <span class="demo__strong">{{ row.name }}</span>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" @click="formDialogRef?.open(row)">编辑</el-button>
        </template>
      </DataTable>

      <Pagination
        :page="query.page"
        :page-size="query.pageSize"
        :total="total"
        @page-change="changePage"
        @size-change="changeSize"
      />
    </section>

    <!-- ── 2. 状态标签 ──────────────────────────────────── -->
    <section class="demo__section">
      <h3 class="demo__subheading">2. StatusTag</h3>
      <p class="demo__hint">同一组件通过 kind 区分订单状态与商品上下架状态，内部复用 utils/format 的映射表。</p>
      <div class="demo__row">
        <span class="demo__row-label">订单状态</span>
        <StatusTag v-for="status in orderStatusList" :key="status" kind="order" :status="status" />
      </div>
      <div class="demo__row">
        <span class="demo__row-label">商品状态</span>
        <StatusTag kind="goods" :status="goodsOn" />
        <StatusTag kind="goods" :status="goodsOff" />
      </div>
    </section>

    <!-- ── 3. 空状态 ────────────────────────────────────── -->
    <section class="demo__section">
      <h3 class="demo__subheading">3. EmptyState</h3>
      <p class="demo__hint">统一空状态文案与操作区，可直接放进卡片或弹窗（min-height 控制容器高度）。</p>
      <div class="demo__empty-box">
        <EmptyState description="暂无收藏商品" min-height="180px">
          <el-button type="primary" @click="goHome">去逛逛</el-button>
        </EmptyState>
      </div>
    </section>

    <!-- ── 4. 表单弹窗 + 图片上传 ───────────────────────── -->
    <section class="demo__section">
      <h3 class="demo__subheading">4. FormDialog + ImageUpload</h3>
      <p class="demo__hint">
        点击按钮打开弹窗；表单校验不通过时不会触发保存。图片选择后经 Mock 上传接口回写地址（Base64 直传）。
      </p>
      <el-space>
        <el-button type="primary" @click="formDialogRef?.open()">新增商品</el-button>
        <el-button :disabled="list.length === 0" @click="formDialogRef?.open(list[0])">编辑第一行</el-button>
      </el-space>
    </section>

    <GoodsFormDialog ref="formDialogRef" @saved="load" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import GoodsFormDialog from './GoodsFormDialog.vue'
import { useTable } from '@/composables/useTable'
import { useCategoryStore } from '@/store/modules/category'
import { getGoodsListApi } from '@/api/admin/goods'
import { GOODS_STATUS, ORDER_STATUS_TEXT } from '@/utils/constants'

const router = useRouter()
const route = useRoute()
const categoryStore = useCategoryStore()

/** 弹窗组件实例（内部自带表单状态与保存逻辑） */
const formDialogRef = ref(null)

// ── 列表：useTable 统一「筛选 + 分页 + 加载态」 ─────────────
const { loading, list, total, query, load, search, reset, changePage, changeSize } = useTable(
  getGoodsListApi,
  { defaultQuery: { name: '', categoryId: '', status: '' }, pageSize: 5 }
)

/** 搜索栏字段配置 */
const searchFields = computed(() => [
  { prop: 'name', label: '商品名称' },
  { prop: 'categoryId', label: '商品类型', type: 'select', options: categoryStore.options },
  {
    prop: 'status',
    label: '上架状态',
    type: 'select',
    options: [
      { label: '已上架', value: GOODS_STATUS.ON },
      { label: '已下架', value: GOODS_STATUS.OFF }
    ]
  }
])

/** 表格列配置：money / date / tag / image / action 五种内置列类型 */
const columns = [
  { prop: 'cover', label: '图片', type: 'image', width: 82, align: 'center' },
  { prop: 'name', label: '商品名称', minWidth: 190, showOverflowTooltip: true },
  { prop: 'categoryName', label: '类型', width: 110 },
  { prop: 'price', label: '价格', type: 'money', width: 110, align: 'right' },
  { prop: 'stock', label: '库存', width: 90, align: 'right' },
  { prop: 'sales', label: '销量', width: 90, align: 'right' },
  { prop: 'status', label: '状态', type: 'tag', tagKind: 'goods', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', type: 'date', width: 170 },
  { label: '操作', type: 'action', width: 100, align: 'center', fixed: 'right' }
]

/** StatusTag 演示数据：把常量映射表转成状态码数组 */
const orderStatusList = computed(() => Object.keys(ORDER_STATUS_TEXT).map(Number))
const goodsOn = GOODS_STATUS.ON
const goodsOff = GOODS_STATUS.OFF

/** 空状态操作：回到前台首页 */
function goHome() {
  router.push('/home')
}

onMounted(() => {
  categoryStore.fetchAll()
  // 支持 /demo?open=dialog 直达弹窗，便于分享演示链接与无头浏览器冒烟测试
  if (route.query.open === 'dialog') {
    formDialogRef.value?.open()
  }
})
</script>

<style scoped lang="scss">
.demo {
  max-width: 1200px;
  padding: 16px 16px 40px;
  margin: 0 auto;

  &__heading {
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    font-size: 20px;
  }

  &__intro {
    margin-bottom: 20px;
  }

  &__section {
    @include card-surface;

    margin-bottom: 16px;
  }

  &__subheading {
    margin: 0 0 6px;
    color: var(--el-text-color-primary);
    font-size: 16px;
  }

  &__hint {
    margin: 0 0 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__row-label {
    width: 80px;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  &__empty-box {
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
  }

  &__strong {
    font-weight: 600;
  }
}
</style>
