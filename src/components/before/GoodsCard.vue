<!--
  商品卡片（前台通用）
  职责：首页推荐 / 搜索列表 / 收藏列表共用同一套商品展示与加购交互
  说明：1) 封面改 4:3（原 1:1 过高，导致网格节奏松散、价格被挤出可视区）；
       2) 描述行删除（与名称冗余），改展示「已售」；
       3) 加购按钮为右下角圆形按钮，触屏设备常显（不依赖 hover 才能加购）；
       4) 父级若需自定义操作，传 :show-actions="false" 并用 #actions 插槽自行渲染（插槽独占一行）
-->
<template>
  <article class="goods-card" :class="{ 'is-off': !onSale }" @click="goDetail">
    <div class="goods-card__cover">
      <img :src="goods.cover" :alt="goods.name" loading="lazy" />
      <span v-if="goods.categoryName" class="goods-card__cat">{{ goods.categoryName }}</span>
      <span v-if="!onSale" class="goods-card__badge">已下架</span>
    </div>

    <div class="goods-card__body">
      <h3 class="goods-card__name" :title="goods.name">{{ goods.name }}</h3>

      <div class="goods-card__foot">
        <p class="goods-card__price">
          <span class="goods-card__symbol">¥</span>
          <span class="goods-card__amount">{{ priceText }}</span>
        </p>

        <span class="goods-card__sales">已售 {{ goods.sales }}</span>

        <div v-if="showActions" class="goods-card__actions">
          <el-button
            class="goods-card__cart"
            type="primary"
            circle
            :icon="ShoppingCart"
            :disabled="!onSale"
            aria-label="加入购物车"
            @click.stop="onAddCart"
          />
        </div>
      </div>

      <!-- 自定义操作：独占一行，避免与价格挤在同一行 -->
      <div v-if="$slots.actions" class="goods-card__extra">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>

<script setup>
/**
 * @typedef {object} Goods
 * @property {number} id 商品 id
 * @property {string} name 商品名称
 * @property {number} price 单价（元）
 * @property {number} stock 库存
 * @property {number} sales 销量
 * @property {number} status 0 下架 / 1 上架
 * @property {string} cover 封面（内联 SVG DataURL）
 * @property {string} [description] 商品描述
 * @property {string} [categoryName] 类型名
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ShoppingCart } from '@element-plus/icons-vue'
import { useCartStore } from '@/store/modules/cart'
import { GOODS_STATUS } from '@/utils/constants'
import { formatPrice } from '@/utils/format'

const props = defineProps({
  /** 商品数据 */
  goods: { type: Object, required: true },
  /** 是否展示底部操作区 */
  showActions: { type: Boolean, default: true }
})

const emit = defineEmits(['add-cart'])

const router = useRouter()
const cartStore = useCartStore()

/** 是否在售 */
const onSale = computed(() => Number(props.goods.status) === GOODS_STATUS.ON)

/** 价格整数部分（¥ 符号单独小一号排，突出数字本身） */
const priceText = computed(() => formatPrice(props.goods.price))

/** 跳转商品详情 */
function goDetail() {
  router.push(`/goods/${props.goods.id}`)
}

/** 加入购物车（默认行为，父级可监听 add-cart 追加处理） */
function onAddCart() {
  cartStore.addItem(props.goods, 1)
  ElMessage.success('已加入购物车')
  emit('add-cart', props.goods)
}
</script>

<style scoped lang="scss">
.goods-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--app-bg-card);
  border: 1px solid transparent;
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-card);
  cursor: pointer;
  transition:
    transform var(--app-dur) var(--app-ease),
    box-shadow var(--app-dur) var(--app-ease);
  @include focus-ring;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-hover);

    .goods-card__cover img {
      transform: scale(1.04);
    }
  }

  &.is-off {
    opacity: 0.72;
  }

  &__cover {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: var(--app-bg-subtle);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--app-dur-slow) var(--app-ease);
    }
  }

  // 左上角品类胶囊
  &__cat {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 2px 8px;
    background: rgb(255 255 255 / 88%);
    border-radius: $radius-pill;
    color: var(--app-text-2);
    font-size: $font-12;
    font-weight: 500;
    backdrop-filter: blur(4px);
  }

  &__badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 2px 8px;
    background: rgb(27 31 39 / 72%);
    border-radius: $radius-pill;
    color: #fff;
    font-size: $font-12;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $space-3;
    padding: $space-3 $space-4 $space-4;
  }

  &__name {
    @include ellipsis-multi(2);

    margin: 0;
    min-height: 2.75em; // 两行固定高度：单行标题也让同排卡片对齐
    color: var(--app-text-1);
    font-size: $font-14;
    font-weight: 500;
    line-height: 1.38;
  }

  // 底部一行：价格 / 已售 / 加购按钮，避免按钮独占一行在卡底留下空白
  &__foot {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin-top: auto;
    padding-top: $space-1;
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 1px;
    margin: 0;
    color: var(--app-color-price);
  }

  &__symbol {
    font-size: $font-12;
    font-weight: 600;
  }

  &__amount {
    font-size: $font-20;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }

  &__sales {
    flex: none;
    margin-left: auto;
    color: var(--app-text-3);
    font-size: $font-12;
  }

  &__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: $space-2;
    margin-left: $space-1;
  }

  // 自定义操作行（收藏页用）
  &__extra {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    margin-top: $space-1;
    padding-top: $space-3;
    border-top: 1px solid var(--app-bg-subtle);
  }

  // 圆形加购按钮：hover 设备上只在卡片 hover 时淡入，触屏设备常显
  &__cart {
    width: 34px;
    height: 34px;
    font-size: 16px;
    transition:
      opacity var(--app-dur) var(--app-ease),
      transform var(--app-dur) var(--app-ease);
  }
}

@media (hover: hover) {
  .goods-card__cart {
    opacity: 0;
    transform: translateY(4px);
  }

  .goods-card:hover .goods-card__cart,
  .goods-card__cart:focus-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

// 触屏：常显（避免「只有 hover 才能加购」的可访问性问题）
@media (hover: none) {
  .goods-card__cart {
    opacity: 1;
    transform: none;
  }
}

@include respond-below('sm') {
  .goods-card__body {
    gap: $space-2;
    padding: $space-2 $space-3 $space-3;
  }

  .goods-card__name {
    min-height: 2.6em;
    font-size: $font-13;
  }

  .goods-card__amount {
    font-size: $font-16;
  }

  .goods-card__cart {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
}
</style>
