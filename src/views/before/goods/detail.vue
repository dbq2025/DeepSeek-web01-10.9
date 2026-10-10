<!--
  商品详情页
  职责：商品主图与信息展示 + 数量选择 + 加入购物车 / 立即购买 / 收藏 + 同类推荐
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

        <div class="detail__info">
          <h1 class="detail__name">{{ goods.name }}</h1>
          <p class="detail__sub">{{ goods.description }}</p>

          <div class="detail__price-box">
            <span class="detail__price">{{ formatMoney(goods.price) }}</span>
            <span class="detail__stat">库存 {{ goods.stock }}</span>
            <span class="detail__stat">已售 {{ goods.sales }}</span>
          </div>

          <div class="detail__row">
            <span class="detail__row-label">数量</span>
            <el-input-number
              v-model="count"
              :min="1"
              :max="Math.max(goods.stock, 1)"
              :disabled="goods.stock <= 0"
            />
            <span v-if="goods.stock <= 0" class="detail__tip">该商品暂时无货</span>
          </div>

          <div class="detail__actions">
            <el-button
              type="primary"
              size="large"
              :disabled="goods.stock <= 0"
              :icon="ShoppingCart"
              @click="onAddCart"
            >
              加入购物车
            </el-button>
            <el-button
              type="danger"
              size="large"
              :disabled="goods.stock <= 0"
              @click="onBuyNow"
            >
              立即购买
            </el-button>
            <el-button
              size="large"
              :type="favorited ? 'warning' : 'default'"
              :icon="favorited ? StarFilled : Star"
              @click="onToggleFavorite"
            >
              {{ favorited ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
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
import { ShoppingCart, Star, StarFilled } from '@element-plus/icons-vue'
import GoodsIntro from './GoodsIntro.vue'
import GoodsRelated from './GoodsRelated.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getFrontGoodsDetailApi } from '@/api/before/goods'
import { checkFavoriteApi, toggleFavoriteApi } from '@/api/before/order'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'
import { formatMoney } from '@/utils/format'

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
    const data = await getFrontGoodsDetailApi(route.params.id)
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

watch(() => route.params.id, loadDetail)
onMounted(loadDetail)
</script>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 320px;

  &__crumb {
    padding: 4px 2px;
  }

  &__main {
    @include card-surface;

    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 28px;
    padding: 24px;
  }

  &__gallery {
    overflow: hidden;
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  &__image {
    width: 100%;
    aspect-ratio: 1 / 1;
    display: block;
    object-fit: cover;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__name {
    margin: 0;
    font-size: 22px;
    line-height: 1.4;
    color: var(--el-text-color-primary);
  }

  &__sub {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__price-box {
    display: flex;
    align-items: baseline;
    gap: 18px;
    padding: 14px 16px;
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  &__price {
    color: $color-price;
    font-size: 28px;
    font-weight: 700;
  }

  &__stat {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__row-label {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  &__tip {
    color: $color-danger;
    font-size: 13px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 6px;
  }
}

@include respond-below('md') {
  .detail__main {
    grid-template-columns: 1fr;
  }
}
</style>
