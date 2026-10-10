<!--
  订单商品明细（只读）
  职责：统一渲染「图片 + 名称 + 单价 × 数量 = 小计」的商品清单
  说明：桌面端用表格（信息密度高），窄屏自动切换为卡片 —— 表格在 375px 下会把
       单价/数量/小计挤出视口，用户无法看到完整信息，故做结构性切换而非横向滚动。
  用法：
    <OrderGoodsList :items="cartStore.checkedItems" />
-->
<template>
  <el-table v-if="!isMobile" :data="items" border>
    <el-table-column label="商品信息" min-width="320">
      <template #default="{ row }">
        <div class="goods-row" @click="goGoods(row)">
          <img class="goods-row__img" :src="row.cover" :alt="row.goodsName" />
          <span class="goods-row__name">{{ row.goodsName }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="单价" width="150">
      <template #default="{ row }">{{ formatMoney(row.price) }}</template>
    </el-table-column>
    <el-table-column prop="count" label="数量" width="100" align="center" />
    <el-table-column label="小计" width="160">
      <template #default="{ row }">
        <span class="goods-row__subtotal">{{ formatMoney(row.price * row.count) }}</span>
      </template>
    </el-table-column>
  </el-table>

  <ul v-else class="goods-cards">
    <li v-for="item in items" :key="item.goodsId" class="goods-cards__item" @click="goGoods(item)">
      <img class="goods-cards__img" :src="item.cover" :alt="item.goodsName" />
      <div class="goods-cards__info">
        <p class="goods-cards__name">{{ item.goodsName }}</p>
        <p class="goods-cards__meta">{{ formatMoney(item.price) }} × {{ item.count }}</p>
      </div>
      <span class="goods-cards__subtotal">{{ formatMoney(item.price * item.count) }}</span>
    </li>
  </ul>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { MOBILE_QUERY, useMediaQuery } from '@/composables/useMediaQuery'
import { formatMoney } from '@/utils/format'

defineProps({
  /** 商品明细（cartStore 条目或订单 items 均可，字段：goodsId/goodsName/price/count/cover） */
  items: { type: Array, default: () => [] }
})

const router = useRouter()
const isMobile = useMediaQuery(MOBILE_QUERY)

/**
 * 跳转商品详情
 * @param {{goodsId:number}} item 明细项
 * @returns {void}
 */
function goGoods(item) {
  router.push(`/goods/${item.goodsId}`)
}
</script>

<style scoped lang="scss">
.goods-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;

  &__img {
    width: 56px;
    height: 56px;
    flex: none;
    border-radius: 6px;
    object-fit: cover;
  }

  &__name {
    color: var(--el-text-color-primary);

    &:hover {
      color: $color-primary;
    }
  }

  &__subtotal {
    color: $color-price;
    font-weight: 600;
  }
}

.goods-cards {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    cursor: pointer;
  }

  &__img {
    width: 56px;
    height: 56px;
    flex: none;
    border-radius: 6px;
    object-fit: cover;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    @include ellipsis;

    margin: 0 0 4px;
    color: var(--el-text-color-primary);
    font-size: 14px;
  }

  &__meta {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__subtotal {
    flex: none;
    color: $color-price;
    font-size: 15px;
    font-weight: 600;
  }
}
</style>
