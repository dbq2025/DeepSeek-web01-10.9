<!--
  后台管理员登录页
  职责：账号密码校验 → 调用登录接口 → 写入登录态并按 redirect 参数跳转（跳转逻辑收敛在 useAuth）
  说明：错误提示（密码错误 / 无后台权限）由 api/request.js 的响应拦截器统一弹出
-->
<template>
  <div class="login">
    <div class="login__panel">
      <h1 class="login__title">电商管理后台</h1>
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
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-dark-2),
    var(--el-color-primary-light-3)
  );

  &__panel {
    width: 100%;
    max-width: 380px;
    padding: 32px 28px 24px;
    background: var(--el-bg-color);
    border-radius: 10px;
    box-shadow: 0 8px 28px rgb(0 0 0 / 14%);
  }

  &__title {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 22px;
    text-align: center;
  }

  &__subtitle {
    margin: 6px 0 24px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: center;
  }

  &__submit {
    width: 100%;
  }

  &__footer {
    margin-top: 16px;
    font-size: 13px;
    text-align: center;
  }
}
</style>
