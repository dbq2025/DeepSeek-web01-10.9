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
  overflow: hidden;
  background: var(--app-bg-card);
  border: 1px solid transparent;
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-card);
  transition: box-shadow var(--app-dur) var(--app-ease);

  &:hover {
    box-shadow: var(--app-shadow-3);
  }

  // 卡头：浅底 + 1px 分隔，与卡体区分层级
  &__head {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding: $space-3 $space-5;
    background: var(--app-bg-subtle);
    font-size: $font-13;
  }

  // 订单号用等宽数字，多笔订单纵向对比时位宽一致
  &__no {
    color: var(--app-text-1);
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: $font-13;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  &__time {
    color: var(--app-text-3);
  }

  &__head :last-child {
    margin-left: auto;
  }

  &__body {
    display: flex;
    gap: $space-5;
    padding: $space-4 $space-5;
  }

  &__items {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $space-3;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $space-3;
    color: var(--app-text-1);
    font-size: $font-14;
    cursor: pointer;

    &:hover .order-card__name {
      color: var(--app-color-primary);
    }
  }

  &__img {
    flex: none;
    width: 48px;
    height: 48px;
    background: var(--app-bg-subtle);
    border-radius: var(--app-radius-control);
    object-fit: cover;
  }

  &__name {
    @include ellipsis;

    flex: 1;
    transition: color var(--app-dur) var(--app-ease);
  }

  &__count {
    color: var(--app-text-3);
    font-size: $font-13;
    font-variant-numeric: tabular-nums;
  }

  &__side {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    gap: $space-3;
    width: 230px;
  }

  &__amount {
    margin: 0;
    color: var(--app-text-3);
    font-size: $font-13;
    text-align: right;

    b {
      display: block;
      margin-top: 2px;
      color: var(--app-color-price);
      font-size: $font-20;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  &__actions {
    display: flex;
    gap: $space-2;
  }
}

@include respond-below('md') {
  .order-card__body {
    flex-direction: column;
    padding: $space-4;
  }

  .order-card__side {
    width: 100%;
    align-items: flex-start;
  }

  .order-card__amount {
    text-align: left;
  }
}

// 手机：卡头允许换行，订单号整体不折断（否则会断成「NO2026…」+ 尾号两行）
@include respond-below('sm') {
  .order-card__head {
    flex-wrap: wrap;
    gap: $space-2;
    padding: $space-3 $space-4;
  }

  .order-card__no {
    white-space: nowrap;
  }
}
</style>
