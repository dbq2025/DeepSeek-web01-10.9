<!--
  我的订单列表
  职责：状态筛选 + 订单列表 + 分页 + 去付款 / 取消订单
  说明：只展示当前登录用户的订单（由 /order/my 接口按 token 过滤）；
       单笔订单的展示与操作由 OrderCard 子组件承载
-->
<template>
  <div class="order-list">
    <PageHeader title="我的订单" description="未付款订单可取消，取消后库存与销量自动回滚" />

    <div class="order-list__tabs">
      <el-radio-group v-model="query.status" class="is-pill" size="small" @change="search">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button v-for="item in statusTabs" :key="item.value" :value="item.value">
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading" class="order-list__body">
      <OrderCard
        v-for="order in list"
        :key="order.id"
        :order="order"
        @detail="goDetail"
        @pay="onPay"
        @cancel="onCancel"
      />

      <EmptyState v-if="!loading && error" type="error" @retry="load" />
      <EmptyState v-else-if="!loading && !list.length" description="暂无相关订单">
        <el-button type="primary" @click="router.push('/home')">去逛逛</el-button>
      </EmptyState>
    </div>

    <Pagination
      v-if="total > 0"
      :page="query.page"
      :page-size="query.pageSize"
      :total="total"
      :page-sizes="[5, 10, 20]"
      @page-change="changePage"
      @size-change="changeSize"
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import OrderCard from './OrderCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import Pagination from '@/components/common/Pagination.vue'
import { useTable } from '@/composables/useTable'
import { cancelOrderApi, getMyOrdersApi, payOrderApi } from '@/api/before/order'
import { ORDER_STATUS_TEXT } from '@/utils/constants'

const router = useRouter()

/** 状态筛选页签（由常量表生成，避免手写重复文案） */
const statusTabs = Object.keys(ORDER_STATUS_TEXT).map((key) => ({
  value: Number(key),
  label: ORDER_STATUS_TEXT[key]
}))

const { loading, error, list, total, query, load, search, changePage, changeSize } = useTable(
  getMyOrdersApi,
  { defaultQuery: { status: '' }, pageSize: 5 }
)

/**
 * 跳转订单详情
 * @param {object} order 订单
 * @returns {void}
 */
function goDetail(order) {
  router.push(`/order/detail/${order.id}`)
}

/**
 * 模拟付款
 * @param {object} order 订单
 * @returns {Promise<void>}
 */
async function onPay(order) {
  try {
    await payOrderApi(order.id)
    ElMessage.success('付款成功')
    await load()
  } catch {
    // 失败提示由 request.js 统一处理
  }
}

/**
 * 取消订单（二次确认，Mock 端会回滚库存与销量）
 * @param {object} order 订单
 * @returns {Promise<void>}
 */
async function onCancel(order) {
  try {
    await ElMessageBox.confirm(`确定取消订单「${order.orderNo}」吗？`, '取消确认', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想'
    })
  } catch {
    return // 用户放弃
  }

  try {
    await cancelOrderApi(order.id)
    ElMessage.success('订单已取消')
    await load()
  } catch {
    // 失败提示由 request.js 统一处理
  }
}
</script>

<style scoped lang="scss">
.order-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  // 状态页签：胶囊分段，与搜索页筛选条同款语言
  &__tabs {
    display: flex;
    padding: $space-3 $space-4;
    background: var(--app-bg-card);
    border-radius: var(--app-radius-card);
    box-shadow: var(--app-shadow-card);

    :deep(.el-radio-group) {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    :deep(.el-radio-button__inner) {
      padding: 5px 14px;
      background: var(--app-bg-card);
      border: 1px solid var(--app-border);
      border-radius: $radius-pill;
      margin-left: 0;
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

  &__body {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    min-height: 120px;
  }
}
</style>
