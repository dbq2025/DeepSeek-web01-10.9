<!--
  购物车页
  职责：编排桌面表格 / 窄屏卡片两套视图与结算栏，处理删除、批量删除、去结算等业务动作
  说明：购物车数据完全存在前端（store/modules/cart.js + 持久化），本页不发起接口请求；
       视图与结算栏已拆为同级子组件，本页只保留编排与业务逻辑
-->
<template>
  <div class="cart">
    <PageHeader title="我的购物车" description="商品价格与库存以详情页为准，结算前可随时修改数量" />

    <EmptyState v-if="!cartStore.items.length" description="购物车还是空的，去挑几件商品吧">
      <el-button type="primary" @click="router.push('/home')">去逛逛</el-button>
    </EmptyState>

    <div v-else class="cart__layout">
      <section class="cart__panel">
        <CartTable
          v-if="!isMobile"
          :items="cartStore.items"
          :all-checked="cartStore.allChecked"
          @toggle-all="cartStore.toggleAll"
          @toggle-checked="cartStore.toggleChecked"
          @update-count="cartStore.updateCount"
          @remove="onRemove"
          @open-goods="openGoods"
        />
        <CartCards
          v-else
          :items="cartStore.items"
          @toggle-checked="cartStore.toggleChecked"
          @update-count="cartStore.updateCount"
          @remove="onRemove"
          @open-goods="openGoods"
        />
      </section>

      <CartSummary
        :all-checked="cartStore.allChecked"
        :checked-count="cartStore.checkedItems.length"
        :total-price="cartStore.totalPrice"
        @toggle-all="cartStore.toggleAll"
        @remove-checked="onRemoveChecked"
        @checkout="onCheckout"
      />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import CartTable from './CartTable.vue'
import CartCards from './CartCards.vue'
import CartSummary from './CartSummary.vue'
import { MOBILE_QUERY, useMediaQuery } from '@/composables/useMediaQuery'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

/** 窄屏切换为卡片布局 */
const isMobile = useMediaQuery(MOBILE_QUERY)

/**
 * 跳转商品详情
 * @param {number} goodsId 商品 id
 * @returns {void}
 */
function openGoods(goodsId) {
  router.push(`/goods/${goodsId}`)
}

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
  gap: $space-4;

  // 桌面：左表格 + 右结算侧栏（320px），侧栏 sticky 跟随
  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: $space-4;
    align-items: start;
  }

  &__panel {
    @include card-surface;

    padding: $space-2 $space-5 $space-2;
    overflow: hidden;
  }
}

// 平板及以下：结算卡落回表格下方，单列排布
@include respond-below('lg') {
  .cart__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@include respond-below('sm') {
  .cart__panel {
    padding: $space-2 $space-3;
  }
}
</style>
