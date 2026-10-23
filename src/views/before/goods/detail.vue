<!--
  商品详情页
  职责：商品主图与购买区 + 同类推荐（右栏购买区已拆为 GoodsPurchasePanel）
  说明：加购不要求登录（购物车为本地态，规范见 store/modules/cart.js）；
       收藏与立即购买需要登录，未登录时提示并带 redirect 跳转登录页
-->
<template>
  <div v-loading="loading" class="detail">
    <template v-if="goods">
      <el-breadcrumb class="detail__crumb" separator="/">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/search', query: { categoryId: goods.categoryId } }">
          {{ goods.categoryName }}
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{ goods.name }}</el-breadcrumb-item>
      </el-breadcrumb>

      <section class="detail__main">
        <div class="detail__gallery">
          <img class="detail__image" :src="goods.cover" :alt="goods.name" />
        </div>

        <GoodsPurchasePanel
          v-model:count="count"
          :goods="goods"
          :favorited="favorited"
          @add-cart="onAddCart"
          @buy-now="onBuyNow"
          @toggle-favorite="onToggleFavorite"
        />
      </section>

      <GoodsIntro :goods="goods" />

      <GoodsRelated :category-id="goods.categoryId" :exclude-id="goods.id" />
    </template>

    <EmptyState v-else-if="!loading" description="商品不存在或已下架">
      <el-button type="primary" @click="router.push('/search')">去逛逛其他商品</el-button>
    </EmptyState>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import GoodsIntro from './GoodsIntro.vue'
import GoodsRelated from './GoodsRelated.vue'
import GoodsPurchasePanel from './GoodsPurchasePanel.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getFrontGoodsDetailApi } from '@/api/before/goods'
import { checkFavoriteApi, toggleFavoriteApi } from '@/api/before/order'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'

/** 路由参数中的商品 id（由路由配置的 props: true 注入） */
const props = defineProps({
  id: { type: [String, Number], required: true }
})

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(true)
const goods = ref(null)
const favorited = ref(false)
const count = ref(1)

/**
 * 需要登录的操作统一拦截
 * @returns {boolean} 是否已登录
 */
function requireLogin() {
  if (userStore.isLogin) return true
  ElMessage.warning('请先登录后再操作')
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return false
}

/** 加载详情与收藏状态 */
async function loadDetail() {
  loading.value = true
  try {
    const data = await getFrontGoodsDetailApi(props.id)
    goods.value = data
    count.value = 1
    favorited.value = false

    if (userStore.isLogin) {
      const check = await checkFavoriteApi(data.id).catch(() => ({ favorited: false }))
      favorited.value = !!check?.favorited
    }
  } catch (error) {
    goods.value = null
  } finally {
    loading.value = false
  }
}

/** 加入购物车（不要求登录） */
function onAddCart() {
  cartStore.addItem(goods.value, count.value)
  ElMessage.success(`已加入购物车 × ${count.value}`)
}

/** 立即购买：只勾选当前商品，其余保留但不参与结算 */
function onBuyNow() {
  if (!requireLogin()) return
  cartStore.addItem(goods.value, count.value)
  cartStore.toggleAll(false)
  cartStore.toggleChecked(goods.value.id, true)
  router.push('/order/confirm')
}

/** 切换收藏状态 */
async function onToggleFavorite() {
  if (!requireLogin()) return
  try {
    const res = await toggleFavoriteApi(goods.value.id)
    favorited.value = !!res.favorited
    ElMessage.success(res.favorited ? '已加入收藏' : '已取消收藏')
  } catch (error) {
    // 失败提示由 request.js 统一处理
  }
}

watch(() => props.id, loadDetail)
onMounted(loadDetail)
</script>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  min-height: 320px;

  &__crumb {
    padding: 4px 2px;
  }

  // 双栏：480px 固定图 + 弹性信息区（改造前 360px，图偏小、右侧留白过多）
  &__main {
    @include card-surface($space-6);

    display: grid;
    grid-template-columns: 480px minmax(0, 1fr);
    gap: $space-8;
    align-items: start;
  }

  &__gallery {
    overflow: hidden;
    background: var(--app-bg-subtle);
    border-radius: var(--app-radius-panel);
  }

  &__image {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
}

@include respond-below('lg') {
  .detail__main {
    grid-template-columns: 380px minmax(0, 1fr);
    gap: $space-5;
  }
}

// 平板 / 手机：单栏堆叠
@include respond-below('md') {
  .detail__main {
    grid-template-columns: minmax(0, 1fr);
    padding: $space-4;
  }
}
</style>
