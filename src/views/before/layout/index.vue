<!--
  电商前台 Layout
  职责：顶栏 + 内容出口 + 页脚，构成前台整体骨架
  说明：1) 顶栏已拆为 SiteHeader（含搜索 / 导航 / 用户下拉），本文件只保留骨架与页脚；
       2) 内容区上下留白 24 / 40，左右保留 20 gutter，保证 >1200 视口与窄屏过渡自然；
       3) 路由切换加 fade-slide 过渡（P4-1），仅此处与后台 layout 使用，不含 App.vue
-->
<template>
  <div class="site">
    <SiteHeader />

    <main class="site__main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="site__footer">
      <div class="site__footer-inner">
        <p class="site__footer-title">电子商务平台 · 前端开发技术课程设计</p>
        <p class="site__footer-tip">本系统为教学演示项目，数据由前端 Mock 生成，不涉及真实交易</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import SiteHeader from '@/components/before/SiteHeader.vue'
</script>

<style scoped lang="scss">
.site {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--app-bg-page);

  // 内容区：上下留白按方案（24 / 40），左右保留 20 gutter
  &__main {
    flex: 1;
    width: 100%;
    max-width: calc(#{$container-width} + #{$space-10});
    margin: 0 auto;
    padding: $space-6 $space-5 $space-10;
  }

  // 页脚：去掉大块白底，只留 1px 上边框
  &__footer {
    padding: $space-8 0;
    border-top: 1px solid var(--app-border);
    color: var(--app-text-3);
    font-size: $font-13;
    text-align: center;
  }

  &__footer-inner {
    max-width: $container-width;
    margin: 0 auto;
    padding: 0 $space-5;
  }

  &__footer-title {
    margin: 0 0 6px;
    color: var(--app-text-2);
  }

  &__footer-tip {
    margin: 0;
  }
}

@include respond-below('sm') {
  .site__main {
    padding: $space-4 $space-3 $space-8;
  }

  .site__footer {
    padding: $space-5 0;
  }
}
</style>
