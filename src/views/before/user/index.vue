<!--
  个人中心（父级布局）
  职责：左侧身份卡与导航菜单 + 右侧子路由出口（个人信息）
  说明：菜单项 index 直接用路由路径，配合 el-menu 的 router 模式实现跳转
-->
<template>
  <div class="user-center">
    <aside class="user-center__side">
      <div class="user-center__card">
        <el-avatar :size="60" :src="userStore.profile?.avatar || ''">
          {{ nicknameFirst }}
        </el-avatar>
        <p class="user-center__nickname">{{ userStore.profile?.nickname || '未登录' }}</p>
        <p class="user-center__account">@{{ userStore.profile?.username || '-' }}</p>
      </div>

      <el-menu :default-active="route.path" router class="user-center__menu">
        <el-menu-item index="/user/profile">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </el-menu-item>
        <el-menu-item index="/order/list">
          <el-icon><List /></el-icon>
          <span>我的订单</span>
        </el-menu-item>
        <el-menu-item index="/favorite">
          <el-icon><Star /></el-icon>
          <span>我的收藏</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="user-center__content">
      <router-view />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { List, Star, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { getUserProfileApi } from '@/api/before/auth'

const route = useRoute()
const userStore = useUserStore()

/** 头像兜底文案 */
const nicknameFirst = computed(() => (userStore.profile?.nickname || 'U').slice(0, 1))

// 直接进入个人中心地址时 profile 可能为空，拉一次接口补齐
onMounted(async () => {
  if (userStore.profile) return
  try {
    const data = await getUserProfileApi()
    userStore.updateProfile(data)
  } catch (error) {
    // 登录态异常由 request.js 统一处理
  }
})
</script>

<style scoped lang="scss">
.user-center {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;

  &__side {
    @include card-surface;

    overflow: hidden;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 22px 12px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__nickname {
    margin: 6px 0 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    font-weight: 600;
  }

  &__account {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  &__menu {
    border-right: none;
  }

  &__content {
    min-height: 320px;
  }
}

@include respond-below('md') {
  .user-center {
    grid-template-columns: 1fr;
  }
}
</style>
