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
      <el-table :data="cartStore.items" border stripe>
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
          <span>已选 <b>{{ cartStore.checkedItems.length }}</b> 种商品</span>
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
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'
import { formatMoney } from '@/utils/format'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

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

  .cart__bar-right {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }
}
</style>
