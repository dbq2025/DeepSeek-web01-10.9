<!--
  订单管理页
  职责：按订单号 / 状态筛选 + 列表分页 + 详情跳转 + 状态流转（发货 / 完成 / 取消）
  说明：状态按钮按当前订单状态条件渲染，避免出现非法流转
-->
<template>
  <div class="order">
    <PageHeader
      title="订单管理"
      :badge="`共 ${total} 笔`"
      description="按状态流转订单，取消订单会同步回滚库存与销量"
    >
      <template #actions>
        <span class="order__hint">共 {{ total }} 笔订单</span>
      </template>
    </PageHeader>

    <SearchForm
      :model-value="query"
      :fields="searchFields"
      :loading="loading"
      @search="search"
      @reset="reset"
    />

    <section class="order__panel">
      <DataTable :columns="columns" :data="list" :loading="loading">
        <template #empty>
          <EmptyState v-if="error" type="error" @retry="load" />
          <EmptyState v-else description="没有符合条件的订单" />
        </template>

        <template #col-orderNo="{ row }">
          <span class="order__no">{{ row.orderNo }}</span>
        </template>
        <template #col-items="{ row }">
          <span>{{ row.items.length }} 种 / {{ itemsCount(row) }} 件</span>
        </template>
        <template #action="{ row }">
          <el-button link type="primary" @click="goDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === ORDER_STATUS.PAID"
            link
            type="success"
            @click="onChangeStatus(row, ORDER_STATUS.SHIPPED)"
          >
            发货
          </el-button>
          <el-button
            v-if="row.status === ORDER_STATUS.SHIPPED"
            link
            type="success"
            @click="onChangeStatus(row, ORDER_STATUS.FINISHED)"
          >
            完成
          </el-button>
          <el-button
            v-if="row.status === ORDER_STATUS.UNPAID"
            link
            type="danger"
            @click="onChangeStatus(row, ORDER_STATUS.CANCELED)"
          >
            取消
          </el-button>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useTable } from '@/composables/useTable'
import { getOrderListApi, updateOrderStatusApi } from '@/api/admin/order'
import { ORDER_STATUS, ORDER_STATUS_TEXT } from '@/utils/constants'

const router = useRouter()

const { loading, error, list, total, query, load, search, reset, changePage, changeSize } =
  useTable(getOrderListApi, { defaultQuery: { orderNo: '', status: '' }, pageSize: 10 })

/** 状态下拉选项（由常量映射表生成，避免重复维护） */
const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_TEXT).map((key) => ({
  label: ORDER_STATUS_TEXT[key],
  value: Number(key)
}))

const searchFields = [
  { prop: 'orderNo', label: '订单号' },
  { prop: 'status', label: '订单状态', type: 'select', options: ORDER_STATUS_OPTIONS }
]

const columns = [
  { prop: 'orderNo', label: '订单号', width: 168 },
  { prop: 'userName', label: '下单用户', width: 100 },
  { prop: 'items', label: '商品', width: 120 },
  { prop: 'totalPrice', label: '订单金额', type: 'money', width: 112, align: 'right' },
  { prop: 'status', label: '状态', type: 'tag', tagKind: 'order', width: 88, align: 'center' },
  { prop: 'createTime', label: '下单时间', type: 'date', width: 136 },
  { label: '操作', type: 'action', width: 140, align: 'center', fixed: 'right' }
]

/**
 * 订单商品总件数
 * @param {object} target 行数据
 * @returns {number}
 */
function itemsCount(target) {
  return (target.items || []).reduce((sum, item) => sum + item.count, 0)
}

/**
 * 跳转订单详情
 * @param {object} target 行数据
 */
function goDetail(target) {
  router.push(`/admin/order/${target.id}`)
}

/**
 * 修改订单状态（二次确认）
 * @param {object} target 行数据
 * @param {number} status 目标状态
 * @returns {Promise<void>}
 */
async function onChangeStatus(target, status) {
  const text = ORDER_STATUS_TEXT[status]
  try {
    await ElMessageBox.confirm(`确定将订单「${target.orderNo}」标记为「${text}」吗？`, '操作确认', {
      type: 'warning',
      confirmButtonText: `确定${text}`,
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户取消
  }

  try {
    await updateOrderStatusApi({ id: target.id, status })
    ElMessage.success(`已标记为${text}`)
    await load()
  } catch {
    // 失败提示已由 request.js 统一处理
  }
}
</script>

<style scoped lang="scss">
.order {
  &__panel {
    @include card-surface;

    padding: $space-2 $space-5 $space-4;
  }

  &__hint {
    color: var(--app-text-3);
    font-size: $font-13;
    font-variant-numeric: tabular-nums;
  }

  // 订单号用等宽数字，便于逐位比对
  &__no {
    color: var(--app-text-1);
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: $font-13;
    font-variant-numeric: tabular-nums;
  }
}

@include respond-below('sm') {
  .order__panel {
    padding: $space-2 $space-3 $space-3;
  }
}
</style>
