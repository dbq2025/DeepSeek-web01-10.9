<!--
  我的订单 —— 单笔订单卡片
  职责：展示订单号 / 时间 / 状态 / 商品明细 / 金额，并把用户操作以事件形式交给父级
  说明：从 order/list.vue 拆出，让列表页只关注「筛选 + 分页 + 网络请求」
-->
<template>
  <article class="order-card">
    <header class="order-card__head">
      <span class="order-card__no">订单号：{{ order.orderNo }}</span>
      <span class="order-card__time">{{ formatDate(order.createTime) }}</span>
      <StatusTag kind="order" :status="order.status" />
    </header>

    <div class="order-card__body">
      <ul class="order-card__items">
        <li
          v-for="item in order.items"
          :key="item.goodsId"
          class="order-card__item"
          @click="emit('detail', order)"
        >
          <img class="order-card__img" :src="item.cover" :alt="item.goodsName" />
          <span class="order-card__name">{{ item.goodsName }}</span>
          <span class="order-card__count">× {{ item.count }}</span>
        </li>
      </ul>

      <div class="order-card__side">
        <p class="order-card__amount">
          共 {{ totalCount }} 件，合计
          <b>{{ formatMoney(order.totalPrice) }}</b>
        </p>
        <div class="order-card__actions">
          <el-button size="small" @click="emit('detail', order)">查看详情</el-button>
          <template v-if="isUnpaid">
            <el-button size="small" type="primary" @click="emit('pay', order)">去付款</el-button>
            <el-button size="small" @click="emit('cancel', order)">取消订单</el-button>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import StatusTag from '@/components/common/StatusTag.vue'
import { ORDER_STATUS } from '@/utils/constants'
import { formatDate, formatMoney } from '@/utils/format'

const props = defineProps({
  /** 订单数据（含 items / totalPrice / status / address） */
  order: { type: Object, required: true }
})

const emit = defineEmits(['detail', 'pay', 'cancel'])

/** 商品总件数 */
const totalCount = computed(() => (props.order.items || []).reduce((sum, it) => sum + it.count, 0))

/** 是否待付款 */
const isUnpaid = computed(() => props.order.status === ORDER_STATUS.UNPAID)
</script>

<style scoped lang="scss">
.order-card {
  @include card-surface;

  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
    font-size: 13px;
  }

  &__no {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }

  &__time {
    color: var(--el-text-color-secondary);
  }

  &__head :last-child {
    margin-left: auto;
  }

  &__body {
    display: flex;
    gap: 20px;
    padding: 16px 18px;
  }

  &__items {
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    cursor: pointer;
  }

  &__img {
    width: 48px;
    height: 48px;
    flex: none;
    border-radius: 6px;
    object-fit: cover;
  }

  &__name {
    @include ellipsis;

    flex: 1;
  }

  &__count {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__side {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    width: 230px;
  }

  &__amount {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 13px;
    text-align: right;

    b {
      display: block;
      margin-top: 4px;
      color: $color-price;
      font-size: 20px;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

@include respond-below('md') {
  .order-card__body {
    flex-direction: column;
  }

  .order-card__side {
    width: 100%;
    align-items: flex-start;
  }

  .order-card__amount {
    text-align: left;
  }
}
</style>
