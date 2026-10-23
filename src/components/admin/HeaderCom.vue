<!--
  后台顶栏
  职责：侧边栏折叠开关 + 面包屑 + 管理员下拉菜单（个人信息 / 退出登录）
  说明：登录态持久化只保留 token 与 role，刷新页面后 profile 为空，
       故此处会在挂载时补拉一次管理员信息
-->
<template>
  <header class="header">
    <div class="header__left">
      <el-icon
        class="header__toggle"
        :title="collapsed ? '展开菜单' : '收起菜单'"
        @click="appStore.toggleSidebar()"
      >
        <Expand v-if="collapsed" />
        <Fold v-else />
      </el-icon>

      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <el-dropdown class="header__right" @command="onCommand">
      <span class="header__user">
        <el-avatar :size="28" :src="avatar">
          <el-icon><UserFilled /></el-icon>
        </el-avatar>
        <span class="header__nickname">{{ nickname }}</span>
        <el-icon class="header__caret"><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">个人信息</el-dropdown-item>
          <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </header>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Expand, Fold, UserFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { useAuth } from '@/composables/useAuth'
import { getAdminProfileApi } from '@/api/admin/auth'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { logout } = useAuth()

const collapsed = computed(() => appStore.sidebarCollapsed)
const avatar = computed(() => userStore.profile?.avatar || '')
const nickname = computed(() => userStore.profile?.nickname || '管理员')

/** 面包屑：取当前匹配链上声明了 title 的路由 */
const breadcrumbs = computed(() =>
  route.matched
    .filter((item) => item.meta?.title)
    .map((item) => ({ path: item.path, title: item.meta.title }))
)

/**
 * 下拉菜单命令处理
 * @param {string} command 命令名（profile / logout）
 * @returns {void}
 */
function onCommand(command) {
  if (command === 'profile') {
    router.push('/admin/profile')
    return
  }
  if (command === 'logout') {
    logout('admin')
  }
}

onMounted(async () => {
  if (userStore.profile) return
  try {
    const data = await getAdminProfileApi()
    userStore.updateProfile(data)
  } catch (error) {
    // 拉取失败已由 request.js 统一提示，此处不阻断页面渲染
  }
})
</script>

<style scoped lang="scss">
.header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: $admin-header-h;
  padding: 0 $space-6;
  // 半透明白 + 模糊：内容滚动时不至于「糊成一条灰带」
  background: rgb(255 255 255 / 82%);
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(12px);

  &__left {
    display: flex;
    align-items: center;
    gap: $space-4;
  }

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--app-radius-control);
    color: var(--app-text-2);
    font-size: 18px;
    cursor: pointer;
    transition:
      background var(--app-dur) var(--app-ease),
      color var(--app-dur) var(--app-ease);
    @include focus-ring;

    &:hover {
      background: var(--app-bg-subtle);
      color: var(--app-color-primary);
    }
  }

  &__user {
    display: flex;
    align-items: center;
    gap: $space-2;
    height: 40px;
    padding: 0 10px 0 6px;
    border: 1px solid transparent;
    border-radius: var(--app-radius-pill);
    color: var(--app-text-2);
    cursor: pointer;
    outline: none;
    transition:
      background var(--app-dur) var(--app-ease),
      border-color var(--app-dur) var(--app-ease);

    &:hover {
      background: var(--app-bg-subtle);
      border-color: var(--app-border);
    }
  }

  &__nickname {
    max-width: 120px;
    font-size: $font-14;
    font-weight: 500;
    @include ellipsis;
  }

  &__caret {
    color: var(--app-text-3);
    font-size: 12px;
  }
}

@include respond-below('sm') {
  .header {
    padding: 0 $space-4;
  }

  .header__nickname {
    display: none;
  }
}
</style>
