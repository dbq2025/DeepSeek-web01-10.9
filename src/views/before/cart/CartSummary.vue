<!--
  购物车底部结算栏
  职责：全选 / 删除选中 / 显示已选种类与合计金额 / 去结算
  说明：窄屏下整栏换行（「已选 N 种商品」不允许折行，否则会被压成「已选 2 种商」「品」）
-->
<template>
  <div class="cart-summary">
    <el-checkbox :model-value="allChecked" @change="(val) => emit('toggle-all', val)">
      全选
    </el-checkbox>
    <el-button link type="danger" :disabled="!checkedCount" @click="emit('remove-checked')">
      删除选中
    </el-button>

    <div class="cart-summary__right">
      <span
        >已选 <b>{{ checkedCount }}</b> 种商品</span
      >
      <span class="cart-summary__total"
        >合计：<b>{{ formatMoney(totalPrice) }}</b></span
      >
      <el-button type="danger" size="large" :disabled="!checkedCount" @click="emit('checkout')">
        去结算
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { formatMoney } from '@/utils/format'

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
  @include card-surface;

  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;

  &__right {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-left: auto;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  &__total {
    font-size: 14px;

    b {
      color: $color-price;
      font-size: 22px;
    }
  }
}

@include respond-below('sm') {
  .cart-summary {
    flex-wrap: wrap;
  }

  // 「已选 N 种商品」在窄屏会被压成两行，禁止折行
  .cart-summary__right > span {
    white-space: nowrap;
  }

  .cart-summary__right {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }
}
</style>
