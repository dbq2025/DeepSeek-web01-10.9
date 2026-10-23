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
          <div>
            <h1 class="detail__name">{{ goods.name }}</h1>
            <p class="detail__sub">{{ goods.description }}</p>
          </div>

          <!-- 价格区：浅色块承载价格 + 库存/销量，形成明确视觉焦点 -->
          <div class="detail__price-box">
            <span class="detail__price">
              <span class="detail__price-symbol">¥</span>{{ formatPrice(goods.price) }}
            </span>
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
              class="detail__cta"
              type="primary"
              :disabled="goods.stock <= 0"
              :icon="ShoppingCart"
              @click="onAddCart"
            >
              加入购物车
            </el-button>
            <el-button
              class="detail__cta"
              type="danger"
              :disabled="goods.stock <= 0"
              @click="onBuyNow"
            >
              立即购买
            </el-button>
            <el-button
              class="detail__fav"
              :type="favorited ? 'warning' : 'default'"
              :icon="favorited ? StarFilled : Star"
              :aria-label="favorited ? '取消收藏' : '收藏'"
              @click="onToggleFavorite"
            />
          </div>

          <!-- 服务承诺：与系统真实能力一致（无货不下单 / 订单可取消） -->
          <ul class="detail__promise">
            <li v-for="item in PROMISES" :key="item.text">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.text }}</span>
            </li>
          </ul>
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
import { CircleCheck, ShoppingCart, Star, StarFilled, Van } from '@element-plus/icons-vue'
import GoodsIntro from './GoodsIntro.vue'
import GoodsRelated from './GoodsRelated.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getFrontGoodsDetailApi } from '@/api/before/goods'
import { checkFavoriteApi, toggleFavoriteApi } from '@/api/before/order'
import { useCartStore } from '@/store/modules/cart'
import { useUserStore } from '@/store/modules/user'
import { formatPrice } from '@/utils/format'

/** 服务承诺（仅陈述系统真实支持的规则，不做虚假承诺） */
const PROMISES = [
  { icon: CircleCheck, text: '正品保障 · 数据由 Mock 生成，仅作教学演示' },
  { icon: Van, text: '下单后由管理员发货，可在「我的订单」跟踪状态' },
  { icon: Star, text: '未付款订单可随时取消，库存自动回滚' }
]

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

  &__info {
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  &__name {
    margin: 0;
    color: var(--app-text-1);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.36;
  }

  &__sub {
    margin: $space-2 0 0;
    color: var(--app-text-3);
    font-size: $font-13;
    line-height: 1.7;
  }

  // 价格区：浅红底块 + 32px 价格，成为首屏唯一高饱和区域
  &__price-box {
    display: flex;
    align-items: baseline;
    gap: $space-5;
    padding: $space-4 $space-5;
    background: var(--app-color-price-bg);
    border-radius: var(--app-radius-card);
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 2px;
    color: var(--app-color-price);
    font-size: 32px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  &__price-symbol {
    font-size: $font-16;
    font-weight: 600;
  }

  &__stat {
    color: var(--app-text-3);
    font-size: $font-13;
    font-variant-numeric: tabular-nums;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  &__row-label {
    color: var(--app-text-2);
    font-size: $font-14;
  }

  &__tip {
    color: var(--el-color-danger);
    font-size: $font-13;
  }

  // CTA：主按钮占满剩余宽度、44px 高（触屏友好）
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    margin-top: $space-1;
  }

  &__cta {
    flex: 1;
    min-width: 150px;
    height: 44px;
    font-size: $font-14;
    font-weight: 600;
  }

  &__fav {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }

  &__promise {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    margin: 0;
    padding: $space-3 0 0;
    border-top: 1px solid var(--app-bg-subtle);
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: $space-2;
      color: var(--app-text-3);
      font-size: $font-12;
    }

    .el-icon {
      color: var(--el-color-success);
    }
  }
}

@include respond-below('lg') {
  .detail__main {
    grid-template-columns: 380px minmax(0, 1fr);
    gap: $space-5;
  }
}

// 平板 / 手机：单栏堆叠，图片不再占满整宽
@include respond-below('md') {
  .detail__main {
    grid-template-columns: minmax(0, 1fr);
    padding: $space-4;
  }

  .detail__name {
    font-size: $font-20;
  }

  .detail__price {
    font-size: 26px;
  }
}

@include respond-below('sm') {
  .detail__price-box {
    flex-wrap: wrap;
    gap: $space-3;
  }

  .detail__cta {
    min-width: 0;
  }
}
</style>
