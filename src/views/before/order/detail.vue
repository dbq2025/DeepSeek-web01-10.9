<!--
  订单详情页（前台）
  职责：订单状态与流转步骤 + 商品明细 + 收货信息 + 金额汇总 + 去付款 / 取消订单
  说明：已取消的订单不展示流转步骤，改以告警条说明；非本人订单由 Mock 端返回 403
-->
<template>
  <div v-loading="loading" class="order-detail">
    <template v-if="order">
      <h2 class="order-detail__title">订单详情</h2>

      <!-- 状态区 -->
      <section class="order-detail__panel order-detail__status">
        <template v-if="order.status === ORDER_STATUS.CANCELED">
          <el-alert type="info" :closable="false" show-icon>
            <template #title> 该订单已取消，下单时占用的库存与销量已回滚 </template>
          </el-alert>
        </template>
        <template v-else>
          <div class="order-detail__status-head">
            <span class="order-detail__status-text">{{ formatOrderStatus(order.status) }}</span>
            <div class="order-detail__status-actions">
              <el-button v-if="order.status === ORDER_STATUS.UNPAID" type="primary" @click="onPay">
                去付款
              </el-button>
              <el-button v-if="order.status === ORDER_STATUS.UNPAID" @click="onCancel">
                取消订单
              </el-button>
            </div>
          </div>
          <el-steps :active="order.status + 1" align-center finish-status="success">
            <el-step title="提交订单" />
            <el-step title="付款成功" />
            <el-step title="商品发货" />
            <el-step title="交易完成" />
          </el-steps>
        </template>
      </section>

      <!-- 订单信息 -->
      <section class="order-detail__panel">
        <h3 class="order-detail__subtitle">订单信息</h3>
        <el-descriptions :column="isMobile ? 1 : 2" border>
          <el-descriptions-item label="订单编号">{{ order.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <StatusTag kind="order" :status="order.status" />
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ order.createTime }}</el-descriptions-item>
          <el-descriptions-item label="下单用户">{{ order.userName }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <!-- 商品明细 -->
      <section class="order-detail__panel">
        <h3 class="order-detail__subtitle">商品明细</h3>
        <OrderGoodsList :items="order.items" />

        <div class="order-detail__total">
          <span>共 {{ totalCount }} 件商品</span>
          <span class="order-detail__total-label">实付金额：</span>
          <span class="order-detail__total-value">{{ formatMoney(order.totalPrice) }}</span>
        </div>
      </section>

      <!-- 收货信息 -->
      <section class="order-detail__panel">
        <h3 class="order-detail__subtitle">收货信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="收货人">{{
            order.address?.name || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{
            order.address?.phone || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="收货地址">{{
            order.address?.detail || '-'
          }}</el-descriptions-item>
        </el-descriptions>
      </section>
    </template>

    <EmptyState v-else-if="!loading" description="订单不存在或无权查看">
      <el-button type="primary" @click="router.push('/order/list')">返回我的订单</el-button>
    </EmptyState>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/common/StatusTag.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import OrderGoodsList from '@/components/before/OrderGoodsList.vue'
import { MOBILE_QUERY, useMediaQuery } from '@/composables/useMediaQuery'
import { cancelOrderApi, getOrderDetailApi, payOrderApi } from '@/api/before/order'
import { ORDER_STATUS } from '@/utils/constants'
import { formatMoney, formatOrderStatus } from '@/utils/format'

/** 路由参数中的订单 id（由路由配置的 props: true 注入） */
const props = defineProps({
  id: { type: [String, Number], required: true }
})

const router = useRouter()

/** 窄屏描述列表切换为单列 */
const isMobile = useMediaQuery(MOBILE_QUERY)

const loading = ref(true)
const order = ref(null)

/** 商品总件数 */
const totalCount = computed(() => (order.value?.items || []).reduce((sum, it) => sum + it.count, 0))

/** 加载订单详情 */
async function loadDetail() {
  loading.value = true
  try {
    order.value = await getOrderDetailApi(props.id)
  } catch (error) {
    order.value = null
  } finally {
    loading.value = false
  }
}

/** 模拟付款 */
async function onPay() {
  try {
    await payOrderApi(order.value.id)
    ElMessage.success('付款成功')
    await loadDetail()
  } catch (error) {
    // 失败提示由 request.js 统一处理
  }
}

/** 取消订单（二次确认） */
async function onCancel() {
  try {
    await ElMessageBox.confirm(`确定取消订单「${order.value.orderNo}」吗？`, '取消确认', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想'
    })
  } catch {
    return // 用户放弃
  }

  try {
    await cancelOrderApi(order.value.id)
    ElMessage.success('订单已取消')
    await loadDetail()
  } catch (error) {
    // 失败提示由 request.js 统一处理
  }
}

onMounted(loadDetail)
</script>

<style scoped lang="scss">
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 320px;

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 3px solid $color-primary;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  &__panel {
    @include card-surface;

    padding: 18px 20px;
  }

  &__subtitle {
    margin: 0 0 14px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__status {
    padding-top: 20px;
  }

  &__status-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  &__status-text {
    color: $color-price;
    font-size: 20px;
    font-weight: 700;
  }

  &__total {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__total-label {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  &__total-value {
    color: $color-price;
    font-size: 24px;
    font-weight: 700;
  }
}
</style>
