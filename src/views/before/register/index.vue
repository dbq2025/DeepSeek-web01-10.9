<!--
  用户注册页
  职责：账号注册（用户名 / 密码 / 确认密码 / 昵称 / 手机号）
  说明：注册成功后由 useAuth 直接写入登录态并跳转首页，无需再登录一次
-->
<template>
  <AuthShell title="注册新账号" subtitle="三步填完，立即开始购物">
    <el-form ref="formRef" :model="form" :rules="rules" size="large" label-width="0">
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          placeholder="用户名（4-16 位字母、数字或下划线）"
          :prefix-icon="User"
          clearable
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码（6-20 位，不含空格）"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-form-item prop="nickname">
        <el-input v-model="form.nickname" placeholder="昵称（默认与用户名相同）" clearable />
      </el-form-item>

      <el-form-item prop="phone">
        <el-input
          v-model="form.phone"
          placeholder="手机号（选填）"
          :prefix-icon="Iphone"
          maxlength="11"
          clearable
        />
      </el-form-item>

      <el-button
        class="register__submit"
        type="primary"
        size="large"
        :loading="loading"
        @click="onSubmit"
      >
        注 册
      </el-button>
    </el-form>

    <template #foot>
      <p class="register__foot-row">已有账号？<router-link to="/login">返回登录</router-link></p>
    </template>
  </AuthShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Iphone, Lock, User } from '@element-plus/icons-vue'
import AuthShell from '@/components/before/AuthShell.vue'
import { useAuth } from '@/composables/useAuth'
import { PASSWORD_RULE, PHONE_RULE, USERNAME_RULE, required } from '@/utils/validate'

const { register } = useAuth()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: ''
})

/** 确认密码校验：与密码字段保持一致 */
const validateConfirm = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [required('用户名'), USERNAME_RULE],
  password: [required('密码'), PASSWORD_RULE],
  confirmPassword: [{ validator: validateConfirm, trigger: 'blur' }],
  phone: [PHONE_RULE]
}

/** 提交注册 */
async function onSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return // 校验未通过
  }

  loading.value = true
  try {
    await register({
      username: form.username,
      password: form.password,
      nickname: form.nickname,
      phone: form.phone
    })
  } catch (error) {
    // 失败提示由 request.js 统一处理（如「该用户名已被注册」）
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register {
  &__submit {
    width: 100%;
  }

  &__foot-row {
    margin: 0;
  }
}
</style>
