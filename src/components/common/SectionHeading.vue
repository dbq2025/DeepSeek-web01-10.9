<!--
  区块标题（前台首页 / 搜索 / 收藏共用）
  职责：统一「左侧竖条 + 标题 → 右侧补充操作」的区块头样式
  用法：<SectionHeading title="热门推荐">
          <template #extra><router-link ...>查看全部 →</router-link></template>
        </SectionHeading>
-->
<template>
  <div class="section-heading" :class="{ 'section-heading--plain': !bar }">
    <div class="section-heading__left">
      <h2 class="section-heading__title">{{ title }}</h2>
      <span v-if="description" class="section-heading__desc">{{ description }}</span>
    </div>
    <div v-if="$slots.extra" class="section-heading__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** 区块标题 @type {string} */
  title: { type: String, required: true },
  /** 标题右侧补充说明 @type {string} */
  description: { type: String, default: '' },
  /** 是否显示左侧主色竖条 @type {boolean} */
  bar: { type: Boolean, default: true }
})
</script>

<style scoped lang="scss">
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;

  &__left {
    display: flex;
    align-items: baseline;
    gap: $space-3;
    min-width: 0;
    padding-left: 10px;
    border-left: 3px solid var(--app-color-primary);
  }

  // 无竖条变体：用于卡片内部的小节标题
  &--plain &__left {
    padding-left: 0;
    border-left: none;
  }

  &__title {
    margin: 0;
    color: var(--app-text-1);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  &__desc {
    @include ellipsis;

    color: var(--app-text-3);
    font-size: $font-13;
  }

  &__extra {
    display: flex;
    flex: none;
    align-items: center;
    gap: $space-2;
  }
}

@include respond-below('sm') {
  .section-heading__desc {
    display: none;
  }
}
</style>
