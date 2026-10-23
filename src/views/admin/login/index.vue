<!--
  后台管理员登录页
  职责：账号密码校验 → 调用登录接口 → 写入登录态并按 redirect 参数跳转（跳转逻辑收敛在 useAuth）
  说明：错误提示（密码错误 / 无后台权限）由 api/request.js 的响应拦截器统一弹出
-->
<template>
  <div class="login">
    <div class="login__panel">
      <div class="login__brand">
        <BrandMark :size="28" />
        <span>电商管理后台</span>
      </div>

      <h1 class="login__title">登录后台</h1>
      <p class="login__subtitle">电子商务平台前端系统 · 后台管理端</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent>
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-form-item>
          <el-button class="login__submit" type="primary" :loading="loading" @click="onSubmit">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <el-alert
        class="login__demo"
        type="info"
        :closable="false"
        show-icon
        title="演示账号：admin / 123456（普通账号 test、lisi、wangwu 无后台权限）"
      />

      <div class="login__footer">
        <router-link to="/home">返回前台商城</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Lock, User } from '@element-plus/icons-vue'
import BrandMark from '@/components/common/BrandMark.vue'
import { useAuth } from '@/composables/useAuth'
import { required } from '@/utils/validate'

const { loginAsAdmin } = useAuth()

const formRef = ref(null)
const loading = ref(false)

/** 演示项目：预填演示账号，方便快速验收 */
const form = reactive({ username: 'admin', password: '123456' })
const rules = {
  username: [required('用户名')],
  password: [required('密码')]
}

/**
 * 提交登录：先本地校验，再请求接口
 * @returns {Promise<void>}
 */
async function onSubmit() {
  if (!formRef.value || loading.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await loginAsAdmin({ ...form })
  } catch (error) {
    // 失败提示已由 request.js 统一处理，这里仅结束 loading
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
// 后台登录页：深色底 + 居中白卡，与前台登录页的「左右分栏」刻意区分开
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $space-6;
  background:
    radial-gradient(1200px 600px at 15% 0%, rgb(51 85 224 / 28%), transparent 60%),
    radial-gradient(900px 500px at 90% 100%, rgb(122 90 248 / 22%), transparent 55%), $nav-bg;

  &__panel {
    width: 100%;
    max-width: 400px;
    padding: $space-8 $space-6 $space-6;
    background: var(--app-bg-card);
    border-radius: var(--app-radius-panel);
    box-shadow: 0 24px 60px rgb(6 12 28 / 45%);
  }

  &__brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: $space-5;
    color: var(--app-color-primary);
    font-size: $font-14;
    font-weight: 600;
  }

  &__title {
    margin: 0;
    color: var(--app-text-1);
    font-size: $font-20;
    font-weight: 600;
    text-align: center;
  }

  &__subtitle {
    margin: 6px 0 $space-6;
    color: var(--app-text-3);
    font-size: $font-12;
    text-align: center;
  }

  &__submit {
    width: 100%;
  }

  &__demo {
    margin-top: $space-2;
    border-radius: var(--app-radius-control);
  }

  &__footer {
    margin-top: $space-4;
    font-size: $font-13;
    text-align: center;

    a {
      color: var(--app-color-primary);
      font-weight: 500;
      text-decoration: none;
    }
  }
}
</style>
