<!--
  购物车商品表格（桌面视图）
  职责：展示购物车条目并外抛操作意图（勾选 / 改数量 / 删除 / 跳商品详情）
  说明：纯展示组件 —— 状态与业务动作由父级页面持有，本组件不直接读写 store
-->
<template>
  <el-table :data="items" border stripe>
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

    <el-table-column label="单价" width="140">
      <template #default="{ row }">{{ formatMoney(row.price) }}</template>
    </el-table-column>

    <el-table-column label="数量" width="170" align="center">
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

    <el-table-column label="小计" width="150">
      <template #default="{ row }">
        <span class="cart-table__subtotal">{{ formatMoney(row.price * row.count) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="90" align="center">
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
  &__goods {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  &__goods-img {
    width: 64px;
    height: 64px;
    flex: none;
    border-radius: 6px;
    object-fit: cover;
  }

  &__goods-name {
    color: var(--el-text-color-primary);
    line-height: 1.5;

    &:hover {
      color: $color-primary;
    }
  }

  &__subtotal {
    color: $color-price;
    font-weight: 600;
  }
}
</style>
