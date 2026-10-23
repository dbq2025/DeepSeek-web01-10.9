<!--
  订单详情页（后台）
  职责：展示订单基本信息、收货信息与商品明细，并提供状态流转操作
  说明：状态按钮按当前订单状态条件渲染；金额小计由列配置的 formatter 计算，不在数据里冗余存储
-->
<template>
  <div class="order-detail">
    <el-page-header class="order-detail__header" @back="goBack">
      <template #content>
        <span class="order-detail__title">订单详情</span>
      </template>
      <template #extra>
        <el-button
          v-if="order.status === ORDER_STATUS.PAID"
          type="success"
          @click="onChangeStatus(ORDER_STATUS.SHIPPED)"
        >
          发货
        </el-button>
        <el-button
          v-if="order.status === ORDER_STATUS.SHIPPED"
          type="success"
          @click="onChangeStatus(ORDER_STATUS.FINISHED)"
        >
          完成订单
        </el-button>
        <el-button
          v-if="order.status === ORDER_STATUS.UNPAID"
          type="danger"
          @click="onChangeStatus(ORDER_STATUS.CANCELED)"
        >
          取消订单
        </el-button>
      </template>
    </el-page-header>

    <section v-loading="loading" class="order-detail__panel">
      <h3 class="order-detail__subtitle">订单信息</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="订单号">{{ order.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <StatusTag kind="order" :status="order.status || 0" />
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">
          {{ formatDate(order.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="下单用户">{{ order.userName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ address.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ address.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="3">
          {{ address.detail || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </section>

    <section class="order-detail__panel">
      <h3 class="order-detail__subtitle">商品明细</h3>
      <DataTable
        :columns="itemColumns"
        :data="order.items || []"
        :loading="loading"
        empty-text="暂无商品明细"
      />
      <div class="order-detail__total">
        订单金额
        <span class="order-detail__amount">{{ formatMoney(order.totalPrice || 0) }}</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataTable from '@/components/common/DataTable.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { getOrderDetailApi, updateOrderStatusApi } from '@/api/admin/order'
import { formatDate, formatMoney } from '@/utils/format'
import { ORDER_STATUS, ORDER_STATUS_TEXT } from '@/utils/constants'

const props = defineProps({
  /** 路由参数：订单 id @type {string|number} */
  id: { type: [String, Number], default: '' }
})

const router = useRouter()
const loading = ref(false)
const order = ref({ items: [] })

/** 收货信息（订单未加载完成时给空对象，避免模板取值报错） */
const address = computed(() => order.value.address || {})

const itemColumns = [
  { prop: 'cover', label: '图片', type: 'image', width: 82, align: 'center' },
  { prop: 'goodsName', label: '商品名称', minWidth: 200 },
  { prop: 'price', label: '单价', type: 'money', width: 120, align: 'right' },
  { prop: 'count', label: '数量', width: 90, align: 'right' },
  {
    prop: 'subtotal',
    label: '小计',
    width: 130,
    align: 'right',
    formatter: (row) => formatMoney(row.price * row.count)
  }
]

/** 返回订单列表 */
function goBack() {
  router.push('/admin/order')
}

/** 加载订单详情 */
async function loadDetail() {
  loading.value = true
  try {
    order.value = await getOrderDetailApi(props.id)
  } catch (error) {
    // 失败提示已由 request.js 统一处理
  } finally {
    loading.value = false
  }
}

/**
 * 修改订单状态（二次确认）
 * @param {number} status 目标状态
 * @returns {Promise<void>}
 */
async function onChangeStatus(status) {
  const text = ORDER_STATUS_TEXT[status]
  try {
    await ElMessageBox.confirm(
      `确定将订单「${order.value.orderNo}」标记为「${text}」吗？`,
      '操作确认',
      {
        type: 'warning',
        confirmButtonText: `确定${text}`,
        cancelButtonText: '取消'
      }
    )
  } catch {
    return // 用户取消
  }

  try {
    await updateOrderStatusApi({ id: order.value.id, status })
    ElMessage.success(`已标记为${text}`)
    await loadDetail()
  } catch (error) {
    // 失败提示已由 request.js 统一处理
  }
}

onMounted(loadDetail)
</script>

<style scoped lang="scss">
.order-detail {
  &__header {
    margin-bottom: 16px;
  }

  &__title {
    color: var(--app-text-1);
    font-size: 16px;
    font-weight: 500;
  }

  &__panel {
    @include card-surface;

    margin-bottom: 16px;
  }

  &__subtitle {
    margin: 0 0 12px;
    color: var(--app-text-1);
    font-size: 15px;
  }

  &__total {
    padding-top: 12px;
    color: var(--app-text-2);
    font-size: 14px;
    text-align: right;
  }

  &__amount {
    color: var(--el-color-danger);
    font-weight: 600;
    font-size: 20px;
  }
}
</style>
