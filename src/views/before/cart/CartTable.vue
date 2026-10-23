<!--
  购物车商品表格（桌面视图）
  职责：展示购物车条目并外抛操作意图（勾选 / 改数量 / 删除 / 跳商品详情）
  说明：纯展示组件 —— 状态与业务动作由父级页面持有，本组件不直接读写 store
-->
<template>
  <el-table class="cart-table" :data="items">
    <el-table-column width="56" align="center">
      <template #header>
        <el-checkbox :model-value="allChecked" @change="(val) => emit('toggle-all', val)" />
      </template>
      <template #default="{ row }">
        <el-checkbox
          :model-value="row.checked"
          @change="(val) => emit('toggle-checked', row.goodsId, val)"
        />
      </template>
    </el-table-column>

    <el-table-column label="商品信息" min-width="300">
      <template #default="{ row }">
        <div class="cart-table__goods" @click="emit('open-goods', row.goodsId)">
          <img class="cart-table__goods-img" :src="row.cover" :alt="row.goodsName" />
          <span class="cart-table__goods-name">{{ row.goodsName }}</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="单价" width="120" align="right">
      <template #default="{ row }">
        <span class="cart-table__price">{{ formatMoney(row.price) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="数量" width="150" align="center">
      <template #default="{ row }">
        <el-input-number
          :model-value="row.count"
          :min="1"
          :max="99"
          size="small"
          @change="(val) => emit('update-count', row.goodsId, val)"
        />
      </template>
    </el-table-column>

    <el-table-column label="小计" width="130" align="right">
      <template #default="{ row }">
        <span class="cart-table__subtotal">{{ formatMoney(row.price * row.count) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="80" align="center">
      <template #default="{ row }">
        <el-button link type="danger" @click="emit('remove', row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { formatMoney } from '@/utils/format'

defineProps({
  /** 购物车条目列表 */
  items: { type: Array, required: true },
  /** 是否已全选 */
  allChecked: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-all', 'toggle-checked', 'update-count', 'remove', 'open-goods'])
</script>

<style scoped lang="scss">
.cart-table {
  // 表头吸顶：条目多时滚动仍能看到列名（父容器负责滚动）
  :deep(.el-table__header-wrapper) {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  &__goods {
    display: flex;
    align-items: center;
    gap: $space-3;
    cursor: pointer;
  }

  &__goods-img {
    flex: none;
    width: 56px;
    height: 56px;
    background: var(--app-bg-subtle);
    border-radius: var(--app-radius-control);
    object-fit: cover;
  }

  &__goods-name {
    color: var(--app-text-1);
    font-size: $font-14;
    line-height: 1.5;
    transition: color var(--app-dur) var(--app-ease);

    &:hover {
      color: var(--app-color-primary);
    }
  }

  &__price {
    color: var(--app-text-2);
    font-variant-numeric: tabular-nums;
  }

  &__subtotal {
    color: var(--app-color-price);
    font-size: $font-16;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  // 数量步进器 32px 高
  :deep(.el-input-number) {
    width: 108px;
  }

  :deep(.el-input-number .el-input__wrapper) {
    min-height: 32px;
  }
}
</style>
