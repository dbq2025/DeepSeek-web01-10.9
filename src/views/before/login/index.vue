<!--
  用户登录页
  职责：账号密码登录 + 演示账号一键填充 + 跳转注册 / 管理员入口
  说明：登录成功后的落地页由 useAuth 统一处理（优先取 query.redirect）
-->
<template>
  <AuthShell title="电子商务平台" subtitle="欢迎回来，请登录您的账号">
    <el-form ref="formRef" :model="form" :rules="rules" size="large">
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

      <el-button
        class="login__submit"
        type="primary"
        size="large"
        :loading="loading"
        @click="onSubmit"
      >
        登 录
      </el-button>
    </el-form>

    <el-alert class="login__demo" type="info" :closable="false">
      <template #title>
        演示账号：<b>test</b> / <b>123456</b>
        <el-button link type="primary" @click="fillDemo">一键填充</el-button>
      </template>
    </el-alert>

    <template #foot>
      <p class="login__foot-row">还没有账号？<router-link to="/register">立即注册</router-link></p>
      <p class="login__foot-row">
        <router-link to="/admin/login">管理员入口 →</router-link>
      </p>
    </template>
  </AuthShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Lock, User } from '@element-plus/icons-vue'
import AuthShell from '@/components/before/AuthShell.vue'
import { useAuth } from '@/composables/useAuth'
import { PASSWORD_RULE, USERNAME_RULE, required } from '@/utils/validate'

const { loginAsUser } = useAuth()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', password: '' })

const rules = {
  username: [required('用户名'), USERNAME_RULE],
  password: [required('密码'), PASSWORD_RULE]
}

/** 一键填充演示账号（便于演示与自动化测试） */
function fillDemo() {
  form.username = 'test'
  form.password = '123456'
}

/** 提交登录 */
async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return // 校验未通过
  }

  loading.value = true
  try {
    await loginAsUser({ ...form })
  } catch (error) {
    // 失败提示由 request.js 统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login {
  &__submit {
    width: 100%;
  }

  &__demo {
    margin-top: 16px;
  }

  &__foot-row {
    margin: 0 0 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
