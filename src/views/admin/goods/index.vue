<!--
  商品信息管理页
  职责：多条件筛选 + 列表分页 + 单行上下架 + 批量上下架 + 删除，并跳转新增 / 编辑页
  说明：筛选条件写在 goodsStore.adminQuery 中，从新增/编辑页返回时不会丢失
-->
<template>
  <div class="goods">
    <PageHeader
      title="商品信息管理"
      :badge="`共 ${total} 件`"
      description="维护商品资料、库存与上下架状态"
    >
      <template #actions>
        <el-button type="primary" @click="goCreate">新增商品</el-button>
      </template>
    </PageHeader>

    <SearchForm
      :model-value="query"
      :fields="searchFields"
      :loading="loading"
      @search="search"
      @reset="reset"
    />

    <section class="goods__panel">
      <div class="goods__toolbar">
        <el-button
          size="small"
          :disabled="selectedIds.length === 0"
          @click="onBatchStatus(GOODS_STATUS.ON)"
        >
          批量上架
        </el-button>
        <el-button
          size="small"
          :disabled="selectedIds.length === 0"
          @click="onBatchStatus(GOODS_STATUS.OFF)"
        >
          批量下架
        </el-button>
        <span class="goods__tip">已选 {{ selectedIds.length }} 项</span>
      </div>

      <DataTable
        :columns="columns"
        :data="list"
        :loading="loading"
        show-selection
        row-key="id"
        @selection-change="onSelectionChange"
      >
        <template #empty>
          <EmptyState v-if="error" type="error" @retry="load" />
          <EmptyState v-else description="没有符合条件的商品" />
        </template>

        <template #col-name="{ row }">
          <div class="goods__name">{{ row.name }}</div>
          <div class="goods__desc">{{ row.description }}</div>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" @click="goEdit(row)">编辑</el-button>
          <el-button link :type="statusActionType(row)" @click="onToggleStatus(row)">
            {{ statusActionText(row) }}
          </el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { GOODS_COLUMNS, buildGoodsSearchFields } from './columns.js'
import { useTable } from '@/composables/useTable'
import { useCategoryStore } from '@/store/modules/category'
import { useGoodsStore } from '@/store/modules/goods'
import {
  batchUpdateGoodsStatusApi,
  deleteGoodsApi,
  getGoodsListApi,
  updateGoodsStatusApi
} from '@/api/admin/goods'
import { GOODS_STATUS } from '@/utils/constants'

const router = useRouter()
const categoryStore = useCategoryStore()
const goodsStore = useGoodsStore()

// immediate: false —— 筛选条件需要先从 store 恢复，再发起首次请求
const { loading, error, list, total, query, load, search, reset, changePage, changeSize } =
  useTable(getGoodsListApi, {
    defaultQuery: { name: '', categoryId: '', status: '' },
    pageSize: 10,
    immediate: false
  })

/** 当前勾选的行 */
const selected = ref([])
const selectedIds = computed(() => selected.value.map((item) => item.id))

/** 搜索栏字段配置（类型选项来自 categoryStore） */
const searchFields = computed(() => buildGoodsSearchFields(categoryStore.options))

const columns = GOODS_COLUMNS

/**
 * 勾选变化
 * @param {Array<object>} rows 选中的行数据
 */
function onSelectionChange(rows) {
  selected.value = rows
}

/**
 * 上下架按钮文案
 * @param {object} target 行数据
 * @returns {string}
 */
function statusActionText(target) {
  return target.status === GOODS_STATUS.ON ? '下架' : '上架'
}

/**
 * 上下架按钮类型
 * @param {object} target 行数据
 * @returns {'warning'|'success'}
 */
function statusActionType(target) {
  return target.status === GOODS_STATUS.ON ? 'warning' : 'success'
}

/** 跳转新增页 */
function goCreate() {
  router.push('/admin/goods/create')
}

/**
 * 跳转编辑页
 * @param {object} target 行数据
 */
function goEdit(target) {
  router.push(`/admin/goods/edit/${target.id}`)
}

/**
 * 单行上下架
 * @param {object} target 行数据
 * @returns {Promise<void>}
 */
async function onToggleStatus(target) {
  const next = target.status === GOODS_STATUS.ON ? GOODS_STATUS.OFF : GOODS_STATUS.ON
  try {
    await updateGoodsStatusApi({ id: target.id, status: next })
    ElMessage.success(`${statusActionText(target)}成功`)
    await load()
  } catch {
    // 失败提示已由 request.js 统一处理
  }
}

/**
 * 批量上下架（二次确认）
 * @param {number} status 目标状态（GOODS_STATUS.ON / OFF）
 * @returns {Promise<void>}
 */
async function onBatchStatus(status) {
  const ids = selectedIds.value
  if (ids.length === 0) return
  const action = status === GOODS_STATUS.ON ? '上架' : '下架'

  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${ids.length} 件商品批量${action}吗？`,
      '批量操作确认',
      {
        type: 'warning',
        confirmButtonText: `确定${action}`,
        cancelButtonText: '取消'
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    const data = await batchUpdateGoodsStatusApi({ ids, status })
    ElMessage.success(`已${action} ${data.count} 件商品`)
    await load()
  } catch {
    // 失败提示已由 request.js 统一处理
  }
}

/**
 * 删除商品（二次确认）
 * @param {object} target 行数据
 * @returns {Promise<void>}
 */
async function onDelete(target) {
  try {
    await ElMessageBox.confirm(`确定删除商品「${target.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户取消
  }

  try {
    await deleteGoodsApi(target.id)
    ElMessage.success('删除成功')
    await load()
  } catch {
    // 失败提示已由 request.js 统一处理
  }
}

onMounted(() => {
  // 恢复上次的筛选条件（从新增/编辑页返回时保持上下文）
  Object.assign(query, goodsStore.adminQuery)
  load()
})

// 条件变化即写回 store
watch(query, () => {
  goodsStore.setAdminQuery({ ...query })
})
</script>

<style scoped lang="scss">
.goods {
  &__panel {
    @include card-surface;

    padding: $space-2 $space-5 $space-4;
  }

  // 批量操作条：常驻顶部，浅底分隔，避免与表头混在一起
  &__toolbar {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-3 0;
    border-bottom: 1px solid var(--app-bg-subtle);
    margin-bottom: $space-1;
  }

  &__tip {
    margin-left: $space-1;
    color: var(--app-text-3);
    font-size: $font-13;
    font-variant-numeric: tabular-nums;
  }

  &__name {
    color: var(--app-text-1);
    font-weight: 500;
  }

  &__desc {
    @include ellipsis;

    margin-top: 2px;
    color: var(--app-text-3);
    font-size: $font-12;
  }
}

@include respond-below('sm') {
  .goods__panel {
    padding: $space-2 $space-3 $space-3;
  }
}
</style>
