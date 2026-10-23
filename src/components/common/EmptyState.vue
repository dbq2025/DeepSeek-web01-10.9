<!--
  通用空状态 / 错误状态
  职责：统一列表与页面的「无数据」「加载失败」提示与操作区，避免各页面各写一套 el-empty
  说明：改造后用自绘内联 SVG 插画替代 el-empty 默认灰图，
       图形用 currentColor 描边，颜色随主题令牌变化，不引入外部资源

  用法一（无数据）：
      <EmptyState description="暂无商品类型">
        <el-button type="primary" @click="open()">新增类型</el-button>
      </EmptyState>

  用法二（加载失败，配合 useTable 返回的 error，内置「重新加载」按钮并 emit retry）：
      <EmptyState v-if="error" type="error" @retry="load" />
-->
<template>
  <div class="empty-state" :style="{ minHeight }">
    <div class="empty-state__art" :class="{ 'is-error': isError }" :style="artStyle">
      <svg viewBox="0 0 96 72" fill="none" aria-hidden="true">
        <!-- 底座：一张「空货架」 -->
        <rect
          x="16"
          y="30"
          width="64"
          height="30"
          rx="6"
          stroke="currentColor"
          stroke-width="2"
          stroke-opacity="0.5"
        />
        <path d="M26 30v30M70 30v30" stroke="currentColor" stroke-width="2" stroke-opacity="0.25" />
        <!-- 上方漂浮的卡片：暗示「本该有内容」 -->
        <rect
          x="30"
          y="12"
          width="24"
          height="16"
          rx="4"
          stroke="currentColor"
          stroke-width="2"
          stroke-opacity="0.35"
        />
        <circle
          cx="66"
          cy="18"
          r="5"
          stroke="currentColor"
          stroke-width="2"
          stroke-opacity="0.25"
        />
        <!-- 错误态：在底座上加一个感叹号 -->
        <g v-if="isError" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M48 38v10" />
          <path d="M48 53v1.5" />
        </g>
      </svg>
    </div>

    <p class="empty-state__text">{{ text }}</p>

    <div v-if="$slots.default || isError" class="empty-state__actions">
      <slot>
        <el-button v-if="isError" type="primary" @click="emit('retry')">重新加载</el-button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 展示类型：empty 无数据 / error 加载失败 @type {'empty'|'error'} */
  type: { type: String, default: 'empty', validator: (v) => ['empty', 'error'].includes(v) },
  /** 描述文案；留空时按 type 取默认文案 @type {string} */
  description: { type: String, default: '' },
  /** 插图尺寸（px） @type {number} */
  imageSize: { type: Number, default: 90 },
  /** 容器最小高度，如 '200px'；用于避免弹窗内空状态过高 @type {string} */
  minHeight: { type: String, default: 'auto' }
})

/** 重新加载（type='error' 时默认提供重试按钮） */
const emit = defineEmits(['retry'])

const isError = computed(() => props.type === 'error')

/** 优先用调用方文案，未传时按类型取默认 */
const text = computed(
  () => props.description || (isError.value ? '数据加载失败，请稍后重试' : '暂无数据')
)

/** 插画宽度跟随 imageSize（高度按 4:3 自动推算） */
const artStyle = computed(() => ({
  width: `${props.imageSize}px`,
  height: `${Math.round(props.imageSize * 0.75)}px`
}))
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-8 $space-4;
  text-align: center;

  &__art {
    color: var(--app-color-primary);
    opacity: 0.55;

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    &.is-error {
      color: var(--el-color-warning);
    }
  }

  &__text {
    margin: 0;
    color: var(--app-text-3);
    font-size: $font-14;
  }

  &__actions {
    margin-top: $space-1;
  }
}
</style>
