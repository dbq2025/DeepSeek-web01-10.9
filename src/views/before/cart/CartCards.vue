<!--
  购物车商品卡片列表（窄屏视图）
  职责：在 375px 等窄屏下替代表格（表格会把单价 / 数量 / 操作列挤出视口）
  说明：纯展示组件，操作一律通过 emit 外抛给父级页面
-->
<template>
  <ul class="cart-cards">
    <li v-for="row in items" :key="row.goodsId" class="cart-card">
      <el-checkbox
        class="cart-card__check"
        :model-value="row.checked"
        @change="(val) => emit('toggle-checked', row.goodsId, val)"
      />
      <img
        class="cart-card__img"
        :src="row.cover"
        :alt="row.goodsName"
        @click="emit('open-goods', row.goodsId)"
      />
      <div class="cart-card__info">
        <p class="cart-card__name" @click="emit('open-goods', row.goodsId)">
          {{ row.goodsName }}
        </p>
        <p class="cart-card__price">{{ formatMoney(row.price) }}</p>
        <div class="cart-card__ops">
          <el-input-number
            :model-value="row.count"
            :min="1"
            :max="99"
            size="small"
            @change="(val) => emit('update-count', row.goodsId, val)"
          />
          <el-button link type="danger" @click="emit('remove', row)">删除</el-button>
        </div>
      </div>
      <span class="cart-card__subtotal">{{ formatMoney(row.price * row.count) }}</span>
    </li>
  </ul>
</template>

<script setup>
import { formatMoney } from '@/utils/format'

defineProps({
  /** 购物车条目列表 */
  items: { type: Array, required: true }
})

const emit = defineEmits(['toggle-checked', 'update-count', 'remove', 'open-goods'])
</script>

<style scoped lang="scss">
.cart-cards {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-card {
  @include card-surface;

  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;

  &__check {
    margin-top: 4px;
    flex: none;
  }

  &__img {
    width: 72px;
    height: 72px;
    flex: none;
    border-radius: 6px;
    object-fit: cover;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    @include ellipsis-multi(2);

    margin: 0 0 6px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 1.4;
  }

  &__price {
    margin: 0 0 8px;
    color: $color-price;
    font-size: 15px;
    font-weight: 600;
  }

  &__ops {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__subtotal {
    flex: none;
    color: $color-price;
    font-size: 14px;
    font-weight: 600;
  }
}
</style>
