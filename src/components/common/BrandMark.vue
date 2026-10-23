<!--
  平台标志（内联 SVG）
  职责：后台侧栏与前台顶栏共用的品牌图形，替代各页各自拼图标 + 文字的做法
  说明：用 currentColor 描边/填充，故颜色由使用方通过 CSS color 决定，
       不在这里写死色值（符合「色值只出现在 variables.scss」的约定）
-->
<template>
  <svg
    class="brand-mark"
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <!-- 外框：购物袋轮廓 -->
    <path
      d="M7 11.5h18l-1.6 13a3 3 0 0 1-3 2.6H11.6a3 3 0 0 1-3-2.6L7 11.5Z"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
    <!-- 提手 -->
    <path
      d="M12 11.5V9a4 4 0 0 1 8 0v2.5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <!-- 底部高光块：暗示「货架 / 已成单」 -->
    <rect x="11" y="17" width="10" height="4" rx="2" fill="currentColor" opacity="0.9" />
  </svg>
</template>

<script setup>
defineProps({
  /** 尺寸（像素，正方形） @type {number} */
  size: { type: Number, default: 24 }
})
</script>

<style scoped lang="scss">
.brand-mark {
  display: block;
  flex: none;
  color: inherit;
}
</style>
