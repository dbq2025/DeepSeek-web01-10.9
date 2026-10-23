<!--
  登录 / 注册页共用外壳
  职责：左右分栏 —— 左侧品牌区（深色渐变 + 标志 + 一句话主张 + 三个卖点），
       右侧表单区（420px 居中卡片），让两个认证页只关心各自的表单
  响应式：≤992px 隐藏左侧品牌区，只保留表单卡（竖屏空间有限，避免表单被挤到折叠线以下）
-->
<template>
  <div class="auth-shell">
    <!-- 左：品牌区 -->
    <aside class="auth-shell__brand">
      <div class="auth-shell__brand-inner">
        <div class="auth-shell__logo">
          <BrandMark :size="30" />
          <span>电子商务平台</span>
        </div>

        <h2 class="auth-shell__slogan">一站式电商管理<br />从商品到订单的完整闭环</h2>

        <ul class="auth-shell__points">
          <li v-for="point in POINTS" :key="point">
            <el-icon><Select /></el-icon>
            <span>{{ point }}</span>
          </li>
        </ul>

        <p class="auth-shell__brand-foot">前端开发技术课程设计 · 教学演示项目</p>
      </div>
    </aside>

    <!-- 右：表单区 -->
    <main class="auth-shell__main">
      <div class="auth-shell__card">
        <header class="auth-shell__head">
          <h1 class="auth-shell__title">{{ title }}</h1>
          <p v-if="subtitle" class="auth-shell__subtitle">{{ subtitle }}</p>
        </header>

        <slot />

        <div v-if="$slots.foot" class="auth-shell__foot">
          <slot name="foot" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { Select } from '@element-plus/icons-vue'
import BrandMark from '@/components/common/BrandMark.vue'

defineProps({
  /** 主标题 @type {string} */
  title: { type: String, required: true },
  /** 副标题 / 说明文案 @type {string} */
  subtitle: { type: String, default: '' }
})

/** 三个卖点：与系统真实能力对应，不写夸大宣传 */
const POINTS = ['商品与类型全生命周期管理', '订单状态流转与库存联动', '前台购物车到下单完整链路']
</script>

<style scoped lang="scss">
.auth-shell {
  display: flex;
  min-height: 100vh;
  background: var(--app-bg-card);

  // ---------------- 左侧品牌区（45%）
  &__brand {
    position: relative;
    display: flex;
    flex: 0 0 45%;
    align-items: center;
    overflow: hidden;
    padding: $space-10;
    background: linear-gradient(145deg, #101a35 0%, #22347a 55%, #3355e0 100%);
    color: #fff;

    // 两条弧线做背景装饰，避免纯色渐变太平
    &::before,
    &::after {
      position: absolute;
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 50%;
      content: '';
    }

    &::before {
      right: -140px;
      bottom: -180px;
      width: 460px;
      height: 460px;
    }

    &::after {
      right: -60px;
      bottom: -100px;
      width: 280px;
      height: 280px;
      border-color: rgb(255 255 255 / 8%);
    }
  }

  &__brand-inner {
    position: relative;
    z-index: 1;
    max-width: 420px;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: $space-10;
    font-size: $font-16;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  &__slogan {
    margin: 0 0 $space-8;
    font-size: $font-30;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.32;
  }

  &__points {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgb(255 255 255 / 78%);
      font-size: $font-14;
    }

    .el-icon {
      color: rgb(255 255 255 / 55%);
    }
  }

  &__brand-foot {
    margin: $space-10 0 0;
    color: rgb(255 255 255 / 40%);
    font-size: $font-12;
  }

  // ---------------- 右侧表单区
  &__main {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: $space-10 $space-5;
  }

  &__card {
    width: 100%;
    max-width: 420px;
  }

  &__head {
    margin-bottom: $space-6;
  }

  &__title {
    margin: 0;
    color: var(--app-text-1);
    font-size: $font-20;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  &__subtitle {
    margin: 6px 0 0;
    color: var(--app-text-3);
    font-size: $font-13;
  }

  &__foot {
    margin-top: $space-5;
    padding-top: $space-4;
    border-top: 1px solid var(--app-bg-subtle);
    color: var(--app-text-3);
    font-size: $font-13;
    text-align: center;

    // 插槽内容来自父组件作用域，需用 :deep 才能命中
    :deep(a) {
      color: var(--app-color-primary);
      font-weight: 500;
      text-decoration: none;
    }
  }
}

// ≤992px：隐藏品牌区，表单占满
@include respond-below('md') {
  .auth-shell__brand {
    display: none;
  }

  .auth-shell__main {
    padding: $space-6 $space-5;
  }
}
</style>
