<!--
  登录 / 注册页共用外壳
  职责：品牌区 + 居中卡片 + 底部插槽，让两个认证页只关心各自的表单
-->
<template>
  <div class="auth-shell">
    <div class="auth-shell__card">
      <div class="auth-shell__brand">
        <el-icon class="auth-shell__logo" :size="32"><ShoppingCart /></el-icon>
        <h1 class="auth-shell__title">{{ title }}</h1>
        <p class="auth-shell__subtitle">{{ subtitle }}</p>
      </div>

      <slot />

      <div class="auth-shell__foot">
        <slot name="foot" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShoppingCart } from '@element-plus/icons-vue'

defineProps({
  /** 主标题 */
  title: { type: String, required: true },
  /** 副标题 / 说明文案 */
  subtitle: { type: String, default: '' }
})
</script>

<style scoped lang="scss">
.auth-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--el-bg-color-page);

  &__card {
    width: 100%;
    max-width: 420px;
    padding: 32px 32px 24px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
    box-shadow: 0 8px 30px rgb(0 0 0 / 6%);
  }

  &__brand {
    margin-bottom: 24px;
    text-align: center;
  }

  &__logo {
    color: $color-primary;
  }

  &__title {
    margin: 10px 0 6px;
    font-size: 22px;
    color: var(--el-text-color-primary);
  }

  &__subtitle {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__foot {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 13px;
    text-align: center;

    a {
      color: $color-primary;
      text-decoration: none;
    }
  }
}
</style>
