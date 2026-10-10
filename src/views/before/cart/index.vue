<!--
  购物车页
  职责：勾选商品 / 修改数量 / 删除 / 查看合计金额 / 去结算
  说明：购物车数据完全存在前端（store/modules/cart.js + 持久化），本页不发起接口请求
-->
<template>
  <div class="cart">
    <h2 class="cart__title">我的购物车</h2>

    <EmptyState v-if="!cartStore.items.length" description="购物车还是空的，去挑几件商品吧">
      <el-button type="primary" @click="router.push('/home')">去逛逛</el-button>
    </EmptyState>

    <template v-else>
      <!-- 桌面：表格 -->
      <el-table v-if="!isMobile" :data="cartStore.items" border stripe>
        <el-table-column width="56" align="center">
          <template #header>
            <el-checkbox
              :model-value="cartStore.allChecked"
              @change="(val) => cartStore.toggleAll(val)"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              :model-value="row.checked"
              @change="(val) => cartStore.toggleChecked(row.goodsId, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="商品信息" min-width="300">
          <template #default="{ row }">
            <div class="cart__goods" @click="router.push(`/goods/${row.goodsId}`)">
              <img class="cart__goods-img" :src="row.cover" :alt="row.goodsName" />
              <span class="cart__goods-name">{{ row.goodsName }}</span>
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
              @change="(val) => cartStore.updateCount(row.goodsId, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="小计" width="150">
          <template #default="{ row }">
            <span class="cart__subtotal">{{ formatMoney(row.price * row.count) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button link type="danger" @click="onRemove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 窄屏：卡片（表格在 375px 下会把单价/数量/操作列挤出视口） -->
      <ul v-else class="cart__cards">
        <li v-for="row in cartStore.items" :key="row.goodsId" class="cart-card">
          <el-checkbox
            class="cart-card__check"
            :model-value="row.checked"
            @change="(val) => cartStore.toggleChecked(row.goodsId, val)"
          />
          <img
            class="cart-card__img"
            :src="row.cover"
            :alt="row.goodsName"
            @click="router.push(`/goods/${row.goodsId}`)"
          />
          <div class="cart-card__info">
            <p class="cart-card__name" @click="router.push(`/goods/${row.goodsId}`)">
              {{ row.goodsName }}
            </p>
            <p class="cart-card__price">{{ formatMoney(row.price) }}</p>
            <div class="cart-card__ops">
              <el-input-number
                :model-value="row.count"
                :min="1"
                :max="99"
                size="small"
                @change="(val) => cartStore.updateCount(row.goodsId, val)"
              />
              <el-button link type="danger" @click="onRemove(row)">删除</el-button>
            </div>
          </div>
          <span class="cart-card__subtotal">{{ formatMoney(row.price * row.count) }}</span>
        </li>
      </ul>

      <div class="cart__bar">
        <el-checkbox
          :model-value="cartStore.allChecked"
          @change="(val) => cartStore.toggleAll(val)"
        >
          全选
        </el-checkbox>
        <el-button
          link
          type="danger"
          :disabled="!cartStore.checkedItems.length"
          @click="onRemoveChecked"
        >
          删除选中
        </el-button>

        <div class="cart__bar-right">
          <span
            >已选 <b>{{ cartStore.checkedItems.length }}</b> 种商品</span
          >
          <span class="cart__total">
            合计：<b>{{ formatMoney(cartStore.totalPrice) }}</b>
          </span>
          <el-button
            type="danger"
            size="large"
            :disabled="!cartStore.checkedItems.length"
            @click="onCheckout"
          >
            去结算
          </el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import EmptyState from '@/components/common/EmptyState.vue'
import { MOBILE_QUERY, useMediaQuery } from '@/composables/useMediaQuery'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

/** 窄屏切换为卡片布局 */
const isMobile = useMediaQuery(MOBILE_QUERY)

/**
 * 删除单个商品（二次确认）
 * @param {{goodsId:number,goodsName:string}} row 购物车条目
 * @returns {Promise<void>}
 */
async function onRemove(row) {
  try {
    await ElMessageBox.confirm(`确定从购物车移除「${row.goodsName}」吗？`, '移除确认', {
      type: 'warning',
      confirmButtonText: '确定移除',
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户取消
  }
  cartStore.removeItem(row.goodsId)
  ElMessage.success('已移除')
}

/** 删除所有已勾选商品 */
async function onRemoveChecked() {
  try {
    await ElMessageBox.confirm('确定删除选中的商品吗？', '批量删除', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  cartStore.removeChecked()
  ElMessage.success('已删除选中商品')
}

/** 去结算：未登录先跳登录页并携带回跳地址 */
function onCheckout() {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录后再结算')
    router.push({ path: '/login', query: { redirect: '/order/confirm' } })
    return
  }
  router.push('/order/confirm')
}
</script>

<style scoped lang="scss">
.cart {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 3px solid $color-primary;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

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

  &__bar {
    @include card-surface;

    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
  }

  &__bar-right {
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
  .cart__bar {
    flex-wrap: wrap;
  }

  // 「已选 N 种商品」在窄屏会被压成两行（「已选 2 种商」/「品」），禁止折行
  .cart__bar-right > span {
    white-space: nowrap;
  }

  .cart__bar-right {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }
}

// 窄屏卡片式购物车
.cart__cards {
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
