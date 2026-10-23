<!--
  页面标题（后台列表页 / 详情页共用）
  职责：建立「页面标题（20/600）→ 描述（13 灰）→ 右侧操作」的顶端层级，
       解决改造前全站没有页面标题、首屏缺少视觉起点的问题
  用法：<PageHeader title="商品信息管理" description="...">
          <template #actions><el-button ... /></template>
        </PageHeader>
-->
<template>
  <header class="page-header">
    <div class="page-header__text">
      <h1 class="page-header__title">
        {{ title }}
        <span v-if="badge" class="page-header__badge">{{ badge }}</span>
      </h1>
      <p v-if="description || $slots.meta" class="page-header__desc">
        <slot name="meta">{{ description }}</slot>
      </p>
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  /** 页面标题 @type {string} */
  title: { type: String, required: true },
  /** 标题右侧计数徽标（如「共 24 条」） @type {string} */
  badge: { type: String, default: '' },
  /** 标题下方描述 @type {string} */
  description: { type: String, default: '' }
})
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-4;
  margin-bottom: $space-5;

  &__text {
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $space-2;
    margin: 0;
    color: var(--app-text-1);
    font-size: $font-20;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  &__badge {
    padding: 1px 8px;
    background: var(--app-bg-subtle);
    border-radius: $radius-pill;
    color: var(--app-text-3);
    font-size: $font-12;
    font-weight: 500;
  }

  &__desc {
    margin: 6px 0 0;
    color: var(--app-text-3);
    font-size: $font-13;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: $space-2;
  }
}

@include respond-below('sm') {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-3;
  }
}
</style>
