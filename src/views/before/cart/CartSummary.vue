<!--
  购物车结算侧栏
  职责：全选 / 删除选中 / 显示已选种类与合计金额 / 去结算
  说明：改造后从「底部横条」改为「右侧结算卡」，桌面端 sticky 跟随滚动（top 96px），
       合计金额 24/700 作为该卡唯一视觉焦点，结算按钮整宽 44px 便于点击；
       窄屏仍回到表格下方，按钮保持整宽
-->
<template>
  <aside class="cart-summary">
    <h3 class="cart-summary__title">结算</h3>

    <div class="cart-summary__ops">
      <el-checkbox :model-value="allChecked" @change="(val) => emit('toggle-all', val)">
        全选
      </el-checkbox>
      <el-button link type="danger" :disabled="!checkedCount" @click="emit('remove-checked')">
        删除选中
      </el-button>
    </div>

    <div class="cart-summary__line">
      <span class="cart-summary__label">已选商品</span>
      <span class="cart-summary__value">{{ checkedCount }} 种</span>
    </div>

    <div class="cart-summary__total">
      <span class="cart-summary__label">合计</span>
      <span class="cart-summary__amount">
        <span class="cart-summary__symbol">¥</span>{{ formatPrice(totalPrice) }}
      </span>
    </div>

    <el-button
      class="cart-summary__checkout"
      type="danger"
      :disabled="!checkedCount"
      @click="emit('checkout')"
    >
      去结算
    </el-button>

    <p class="cart-summary__note">下单前请确认收货信息，未付款订单可随时取消</p>
  </aside>
</template>

<script setup>
import { formatPrice } from '@/utils/format'

defineProps({
  /** 是否已全选 */
  allChecked: { type: Boolean, default: false },
  /** 已勾选的商品种类数 */
  checkedCount: { type: Number, default: 0 },
  /** 已勾选商品的合计金额 */
  totalPrice: { type: Number, default: 0 }
})

const emit = defineEmits(['toggle-all', 'remove-checked', 'checkout'])
</script>

<style scoped lang="scss">
.cart-summary {
  @include card-surface($space-5);

  // 桌面端跟随滚动：顶栏 72 + 内容上留白 24 = 96
  position: sticky;
  top: 96px;

  &__title {
    margin: 0 0 $space-4;
    color: var(--app-text-1);
    font-size: 15px;
    font-weight: 600;
  }

  &__ops {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $space-3;
    border-bottom: 1px solid var(--app-bg-subtle);
  }

  &__line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: $space-3;
  }

  &__label {
    color: var(--app-text-3);
    font-size: $font-13;
  }

  &__value {
    color: var(--app-text-1);
    font-size: $font-14;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  // 合计行：24/700，红价 + 等宽数字
  &__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: $space-3;
  }

  &__amount {
    display: flex;
    align-items: baseline;
    gap: 1px;
    color: var(--app-color-price);
    font-size: 24px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  &__symbol {
    font-size: $font-13;
    font-weight: 600;
  }

  &__checkout {
    width: 100%;
    height: 44px;
    margin-top: $space-4;
    font-size: $font-14;
    font-weight: 600;
  }

  &__note {
    margin: $space-3 0 0;
    color: var(--app-text-3);
    font-size: $font-12;
    line-height: 1.6;
  }
}

// 窄屏：取消 sticky，作为表格下方的普通卡片
@include respond-below('lg') {
  .cart-summary {
    position: static;
  }
}
</style>
