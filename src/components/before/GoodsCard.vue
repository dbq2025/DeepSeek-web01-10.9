<!--
  商品卡片（前台通用）
  职责：首页推荐 / 搜索列表 / 收藏列表共用同一套商品展示与加购交互
  说明：卡片内置「加入购物车」默认行为（加购 + 轻提示），
       父级若需自定义操作，传 :show-actions="false" 并用 #actions 插槽自行渲染
-->
<template>
  <article class="goods-card" :class="{ 'is-off': !onSale }" @click="goDetail">
    <div class="goods-card__cover">
      <img :src="goods.cover" :alt="goods.name" loading="lazy" />
      <span v-if="!onSale" class="goods-card__badge">已下架</span>
    </div>

    <div class="goods-card__body">
      <h3 class="goods-card__name" :title="goods.name">{{ goods.name }}</h3>
      <p class="goods-card__desc">{{ goods.description }}</p>

      <div class="goods-card__foot">
        <span class="goods-card__price">{{ formatMoney(goods.price) }}</span>
        <span class="goods-card__sales">已售 {{ goods.sales }}</span>
      </div>

      <div v-if="showActions || $slots.actions" class="goods-card__actions">
        <el-button
          v-if="showActions"
          type="primary"
          size="small"
          :disabled="!onSale"
          @click.stop="onAddCart"
        >
          加入购物车
        </el-button>
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
import { useCartStore } from '@/store/modules/cart'
import { GOODS_STATUS } from '@/utils/constants'
import { formatMoney } from '@/utils/format'

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
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.2s;

  &:hover {
    box-shadow: 0 6px 18px rgb(0 0 0 / 10%);
    transform: translateY(-4px);
  }

  &.is-off {
    opacity: 0.75;
  }

  &__cover {
    position: relative;
    aspect-ratio: 1 / 1;
    background: var(--el-fill-color-lighter);

    img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
  }

  &__badge {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--el-text-color-secondary);
    color: var(--el-color-white);
    font-size: 12px;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
  }

  &__name {
    @include ellipsis;

    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    @include ellipsis;

    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: auto;
  }

  &__price {
    color: $color-price;
    font-size: 18px;
    font-weight: 700;
  }

  &__sales {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
