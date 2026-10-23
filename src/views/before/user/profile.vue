<!--
  个人信息页
  职责：查看与修改昵称 / 手机号 / 头像
  说明：头像直接用 ImageUpload 的本地 Base64 回退（前台无独立上传接口），
       保存成功同步写回 userStore，顶栏头像与昵称随之更新
-->
<template>
  <div class="profile">
    <PageHeader title="个人信息" description="昵称与头像会同步显示在顶栏，手机号用于下单时预填" />

    <section class="profile__panel">
      <el-skeleton v-if="loading" :rows="6" animated />
      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        class="profile__form"
      >
        <el-form-item label="头像">
          <ImageUpload v-model="form.avatar" tip="支持 jpg / png，不超过 2MB" />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input :model-value="profile?.username" disabled />
        </el-form-item>

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

        <el-form-item label="注册时间">
          <el-input :model-value="formatDate(profile?.createTime)" disabled />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSave">保存修改</el-button>
          <el-button @click="syncFromStore">重置</el-button>
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ImageUpload from '@/components/common/ImageUpload.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { getUserProfileApi, updateUserProfileApi } from '@/api/before/auth'
import { useUserStore } from '@/store/modules/user'
import { NICKNAME_MAX, PHONE_RULE, required } from '@/utils/validate'
import { formatDate } from '@/utils/format'

const userStore = useUserStore()

const formRef = ref(null)
const saving = ref(false)
const loading = ref(true)

/** 展示用资料（store 为准，缺失时由下面接口补齐） */
const profile = computed(() => userStore.profile || {})

const form = reactive({ nickname: '', phone: '', avatar: '' })

const rules = {
  nickname: [required('昵称')],
  phone: [required('手机号'), PHONE_RULE]
}

/** 用 store 中的资料回填表单 */
function syncFromStore() {
  const data = userStore.profile || {}
  form.nickname = data.nickname || ''
  form.phone = data.phone || ''
  form.avatar = data.avatar || ''
}

/** 保存修改 */
async function onSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return // 校验未通过
  }

  saving.value = true
  try {
    const data = await updateUserProfileApi({ ...form })
    userStore.updateProfile(data)
    ElMessage.success('保存成功')
  } catch (error) {
    // 失败提示由 request.js 统一处理
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    if (!userStore.profile) {
      const data = await getUserProfileApi()
      userStore.updateProfile(data)
    }
  } catch {
    // 登录态异常由 request.js 统一处理
  } finally {
    // 无论成功失败都回填表单，避免骨架屏卡住
    syncFromStore()
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.profile {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__panel {
    @include card-surface($space-6);
  }

  &__form {
    max-width: 480px;
  }
}
</style>
