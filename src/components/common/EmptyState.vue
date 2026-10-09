<!--
  通用空状态
  职责：统一列表 / 页面无数据时的提示与操作区，避免各页面各写一套 el-empty 文案
  用法：
    <EmptyState description="暂无商品类型">
      <el-button type="primary" @click="open()">新增类型</el-button>
    </EmptyState>
-->
<template>
  <div class="empty-state" :style="{ minHeight }">
    <el-empty :description="description" :image-size="imageSize">
      <slot />
    </el-empty>
  </div>
</template>

<script setup>
defineProps({
  /** 空状态描述文案 @type {string} */
  description: { type: String, default: '暂无数据' },
  /** 插图尺寸（px） @type {number} */
  imageSize: { type: Number, default: 90 },
  /** 容器最小高度，如 '200px'；用于避免弹窗内空状态过高 @type {string} */
  minHeight: { type: String, default: 'auto' }
})
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
