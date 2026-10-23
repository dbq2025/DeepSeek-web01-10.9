<!--
  后台统计卡片
  职责：统一「指标名 → 数值 → 辅助信息」的三级排版，供数据统计页复用
  说明：1) 图标以组件形式传入（父页面显式 import 具体图标），避免本组件引入整套图标库；
       2) 图标底为右上角 40px 浅色圆，不再用整块实色方块抢视觉；
       3) sub 只承载**可推导的真实值**（上架率 / 客单价等），不做虚构环比
-->
<template>
  <div class="stat-card">
    <!-- 右上角图标：浅色底 + 主色图标，视觉重量让给数字 -->
    <span v-if="icon" class="stat-card__icon" :style="{ color }">
      <el-icon :size="18"><component :is="icon" /></el-icon>
    </span>

    <p class="stat-card__label">{{ label }}</p>

    <p class="stat-card__value">
      <span class="stat-card__number" :class="{ 'is-long': isLong }">{{ displayValue }}</span>
      <span v-if="unit" class="stat-card__unit">{{ unit }}</span>
    </p>

    <p v-if="sub" class="stat-card__sub">{{ sub }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 指标名称 @type {string} */
  label: { type: String, required: true },
  /** 指标数值，number 会按千分位格式化 @type {number|string} */
  value: { type: [Number, String], default: 0 },
  /** 数值单位，如「件」「笔」 @type {string} */
  unit: { type: String, default: '' },
  /** 图标组件 @type {object|Function|null} */
  icon: { type: [Object, Function], default: null },
  /** 图标主色（传 CSS 变量） @type {string} */
  color: { type: String, default: 'var(--app-color-primary)' },
  /** 辅助信息（如「上架率 92%」），只允许放可推导的真实值 @type {string} */
  sub: { type: String, default: '' },
  /** 是否加载中（加载中显示占位符） @type {boolean} */
  loading: { type: Boolean, default: false }
})

/** 展示用文本：加载中显示占位符，数字按千分位格式化 */
const displayValue = computed(() => {
  if (props.loading) return '—'
  return typeof props.value === 'number' ? props.value.toLocaleString('zh-CN') : props.value
})

/** 长文本（如带千分位的金额）降一档字号，避免在 4 列栅格里被截断 */
const isLong = computed(() => String(displayValue.value).length >= 9)
</script>

<style scoped lang="scss">
.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $space-5;
  background: var(--app-bg-card);
  border: 1px solid transparent;
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-card);
  transition:
    transform var(--app-dur) var(--app-ease),
    box-shadow var(--app-dur) var(--app-ease);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-hover);
  }

  &__icon {
    position: absolute;
    top: $space-4;
    right: $space-4;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    // 用 currentColor + 低透明度做浅底，图标本身仍是主色；
    // 先声明纯色兜底，不支持 color-mix 的浏览器退化为浅灰底
    background: var(--app-bg-subtle);
    background: color-mix(in srgb, currentcolor 12%, transparent);
    border-radius: 50%;
  }

  &__label {
    margin: 0;
    color: var(--app-text-3);
    font-size: $font-13;
    font-weight: 500;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: $space-2 0 0;
  }

  &__number {
    @include metric-number;

    color: var(--app-text-1);

    // 金额等长文本降一档，保证单行不溢出
    &.is-long {
      font-size: $font-20;
    }
  }

  &__unit {
    color: var(--app-text-3);
    font-size: $font-12;
  }

  &__sub {
    margin: $space-2 0 0;
    color: var(--app-text-3);
    font-size: $font-12;
  }
}

@include respond-below('sm') {
  .stat-card {
    padding: $space-4;

    &__number {
      font-size: $font-20;
    }

    &__icon {
      top: $space-3;
      right: $space-3;
      width: 32px;
      height: 32px;
    }
  }
}
</style>
