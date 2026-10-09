<!--
  后台统计卡片
  职责：统一「图标 + 指标名 + 数值 + 单位」的展示样式，供数据统计页复用
  说明：图标以组件形式传入（父页面显式 import 具体图标），避免本组件引入整套图标库
-->
<template>
  <div class="stat-card">
    <div class="stat-card__icon" :style="{ background: color }">
      <el-icon :size="22"><component :is="icon" /></el-icon>
    </div>
    <div class="stat-card__body">
      <p class="stat-card__label">{{ label }}</p>
      <p class="stat-card__value">
        <span class="stat-card__number">{{ displayValue }}</span>
        <span v-if="unit" class="stat-card__unit">{{ unit }}</span>
      </p>
    </div>
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
  /** 图标底色（传 Element Plus 颜色变量） @type {string} */
  color: { type: String, default: 'var(--el-color-primary)' },
  /** 是否加载中（加载中显示占位符） @type {boolean} */
  loading: { type: Boolean, default: false }
})

/** 展示用文本：加载中显示占位符，数字按千分位格式化 */
const displayValue = computed(() => {
  if (props.loading) return '—'
  return typeof props.value === 'number' ? props.value.toLocaleString('zh-CN') : props.value
})
</script>

<style scoped lang="scss">
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 100%;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;

  &__icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    color: var(--el-color-white);
    border-radius: 8px;
  }

  &__label {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 4px 0 0;
  }

  &__number {
    color: var(--el-text-color-primary);
    font-weight: 600;
    font-size: 22px;
  }

  &__unit {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>
