<!--
  管理员信息页
  职责：展示只读的账号 / 角色信息，以及可编辑的昵称、手机号、头像
  说明：登录态只持久化 token 与 role，刷新后 profile 为空，故挂载时会补拉一次；
       头像走 ImageUpload 的本地 base64 回退分支（不注入 uploadFn），不依赖商品上传接口
-->
<template>
  <div class="profile">
    <section class="profile__panel">
      <h3 class="profile__subtitle">账号信息</h3>
      <el-descriptions v-loading="loading" :column="1" border>
        <el-descriptions-item label="登录账号">{{ profile?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账号角色">{{ roleText }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(profile?.createTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </section>

    <section class="profile__panel">
      <h3 class="profile__subtitle">资料修改</h3>
      <el-form ref="formRef" class="profile__form" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            placeholder="请输入昵称"
            :maxlength="NICKNAME_MAX"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <ImageUpload
            v-model="form.avatar"
            width="120px"
            height="120px"
            tip="支持 jpg / png，2MB 以内"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { useUserStore } from '@/store/modules/user'
import { getAdminProfileApi, updateAdminProfileApi } from '@/api/admin/auth'
import { formatDate } from '@/utils/format'
import { NICKNAME_MAX, PHONE_RULE, required } from '@/utils/validate'

const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)

const form = reactive({ nickname: '', phone: '', avatar: '' })

const rules = {
  nickname: [required('昵称')],
  phone: [PHONE_RULE]
}

const profile = computed(() => userStore.profile)
const roleText = computed(() => (profile.value?.role === 'admin' ? '系统管理员' : '普通用户'))

/** 用 store 中的资料回填表单 */
function fillForm() {
  const source = userStore.profile || {}
  Object.assign(form, {
    nickname: source.nickname || '',
    phone: source.phone || '',
    avatar: source.avatar || ''
  })
}

/** 加载资料：store 里没有（刷新后）则补拉一次 */
async function loadProfile() {
  loading.value = true
  try {
    if (!userStore.profile) {
      const data = await getAdminProfileApi()
      userStore.updateProfile(data)
    }
    fillForm()
  } catch (error) {
    // 失败提示已由 request.js 统一处理
  } finally {
    loading.value = false
  }
}

/** 重置为当前已保存的资料 */
function resetForm() {
  fillForm()
  formRef.value?.clearValidate()
}

/** 保存资料并同步到登录态 */
async function onSubmit() {
  if (!formRef.value || saving.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const data = await updateAdminProfileApi({ ...form })
    userStore.updateProfile(data)
    fillForm()
    ElMessage.success('保存成功')
  } catch (error) {
    // 失败提示已由 request.js 统一处理
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped lang="scss">
.profile {
  &__panel {
    @include card-surface;

    max-width: 720px;
    margin-bottom: 16px;
  }

  &__subtitle {
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    font-size: 15px;
  }

  &__form {
    max-width: 520px;
  }
}
</style>
