<!--
  商品详情 —— 右栏购买区（从 detail.vue 拆出）
  职责：价格区 / 数量选择 / CTA 按钮 / 服务承诺的展示与交互外抛
  说明：纯展示 + 事件外抛组件，不直接调用 store 与路由，便于单测与复用；
       拆出另一目的是让 detail.vue 稳定在 300 行以内
-->
<template>
  <div class="purchase">
    <div>
      <h1 class="purchase__name">{{ goods.name }}</h1>
      <p class="purchase__sub">{{ goods.description }}</p>
    </div>

    <!-- 价格区：浅色块承载价格 + 库存/销量，形成明确视觉焦点 -->
    <div class="purchase__price-box">
      <span class="purchase__price">
        <span class="purchase__symbol">¥</span>{{ formatPrice(goods.price) }}
      </span>
      <span class="purchase__stat">库存 {{ goods.stock }}</span>
      <span class="purchase__stat">已售 {{ goods.sales }}</span>
    </div>

    <div class="purchase__row">
      <span class="purchase__row-label">数量</span>
      <el-input-number
        :model-value="count"
        :min="1"
        :max="Math.max(goods.stock, 1)"
        :disabled="goods.stock <= 0"
        @update:model-value="(val) => emit('update:count', val)"
      />
      <span v-if="goods.stock <= 0" class="purchase__tip">该商品暂时无货</span>
    </div>

    <div class="purchase__actions">
      <el-button
        class="purchase__cta"
        type="primary"
        :disabled="goods.stock <= 0"
        :icon="ShoppingCart"
        @click="emit('add-cart')"
      >
        加入购物车
      </el-button>
      <el-button
        class="purchase__cta"
        type="danger"
        :disabled="goods.stock <= 0"
        @click="emit('buy-now')"
      >
        立即购买
      </el-button>
      <el-button
        class="purchase__fav"
        :type="favorited ? 'warning' : 'default'"
        :icon="favorited ? StarFilled : Star"
        :aria-label="favorited ? '取消收藏' : '收藏'"
        @click="emit('toggle-favorite')"
      />
    </div>

    <!-- 服务承诺：与系统真实能力一致（无货不下单 / 订单可取消） -->
    <ul class="purchase__promise">
      <li v-for="item in PROMISES" :key="item.text">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { CircleCheck, ShoppingCart, Star, StarFilled, Van } from '@element-plus/icons-vue'
import { formatPrice } from '@/utils/format'

defineProps({
  /** 商品数据 @type {object} */
  goods: { type: Object, required: true },
  /** 购买数量 @type {number} */
  count: { type: Number, default: 1 },
  /** 是否已收藏 @type {boolean} */
  favorited: { type: Boolean, default: false }
})

const emit = defineEmits(['update:count', 'add-cart', 'buy-now', 'toggle-favorite'])

/** 服务承诺（仅陈述系统真实支持的规则，不做虚假承诺） */
const PROMISES = [
  { icon: CircleCheck, text: '正品保障 · 数据由 Mock 生成，仅作教学演示' },
  { icon: Van, text: '下单后由管理员发货，可在「我的订单」跟踪状态' },
  { icon: Star, text: '未付款订单可随时取消，库存自动回滚' }
]
</script>

<style scoped lang="scss">
.purchase {
  display: flex;
  flex-direction: column;
  gap: $space-4;

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

  &__symbol {
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

@include respond-below('md') {
  .purchase__name {
    font-size: $font-20;
  }

  .purchase__price {
    font-size: 26px;
  }
}

@include respond-below('sm') {
  .purchase__price-box {
    flex-wrap: wrap;
    gap: $space-3;
  }

  .purchase__cta {
    min-width: 0;
  }
}
</style>
