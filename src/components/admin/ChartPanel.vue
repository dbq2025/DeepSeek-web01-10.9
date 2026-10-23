<!--
  图表面板（后台统计页 / 后续报表页复用）
  职责：统一「卡头（标题 + 副题 + 操作）→ 图表区（弹性拉伸）→ 卡脚」结构，
       消除改造前「图表固定 320px、卡片下方留大片空白」的问题
  用法：<ChartPanel title="近 6 个月销售趋势" subtitle="...">
          <div ref="chartRef" class="chart-canvas" />
        </ChartPanel>
-->
<template>
  <section class="chart-panel">
    <header class="chart-panel__head">
      <div class="chart-panel__text">
        <h3 class="chart-panel__title">{{ title }}</h3>
        <p v-if="subtitle || $slots.subtitle" class="chart-panel__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="chart-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="chart-panel__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="chart-panel__foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup>
defineProps({
  /** 面板标题 @type {string} */
  title: { type: String, required: true },
  /** 副标题（说明统计口径） @type {string} */
  subtitle: { type: String, default: '' }
})
</script>

<style scoped lang="scss">
.chart-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $space-5;
  background: var(--app-bg-card);
  border: 1px solid transparent;
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-card);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-3;
  }

  &__text {
    min-width: 0;
  }

  &__title {
    margin: 0;
    color: var(--app-text-1);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
  }

  &__subtitle {
    margin: 4px 0 0;
    color: var(--app-text-3);
    font-size: $font-12;
  }

  &__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: $space-2;
  }

  // 图表区弹性撑满剩余高度，最小 300px（保证小屏也有可读尺寸）
  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 300px;
    margin-top: $space-4;
  }

  &__foot {
    padding-top: $space-3;
    border-top: 1px solid var(--app-bg-subtle);
  }
}

// 面板内的图表画布：跟随父容器拉伸，不再写死 height
.chart-panel :deep(.chart-canvas) {
  flex: 1;
  width: 100%;
  min-height: 280px;
}
</style>
