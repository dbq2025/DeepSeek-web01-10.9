<!--
  后台侧边菜单
  职责：根据路由表 `/admin` 的子路由（带 meta.icon 的）自动生成菜单项，并与 appStore 折叠状态联动
  扩展方式：新增后台页面时，在 router/modules/admin.js 里补 meta.title + meta.icon，
           再到下方 ICON_MAP 登记同名图标即可，菜单会自动出现
  视觉：深色导航（#111928），展开 232px / 折叠 72px，菜单项 44px 高、10px 圆角
-->
<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <router-link class="sidebar__brand" to="/admin/dashboard">
      <BrandMark :size="26" />
      <span v-if="!collapsed" class="sidebar__brand-text">电商管理后台</span>
    </router-link>

    <el-menu
      class="sidebar__menu"
      :default-active="activeMenu"
      :collapse="collapsed"
      :collapse-transition="false"
      router
    >
      <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
        <el-icon><component :is="ICON_MAP[item.icon]" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>

    <div v-if="!collapsed" class="sidebar__foot">
      <span class="sidebar__version">v1.0</span>
      <span class="sidebar__divider">·</span>
      <span>课程设计</span>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataLine, Goods, List, Menu as MenuIcon, User } from '@element-plus/icons-vue'
import BrandMark from '@/components/common/BrandMark.vue'
import { useAppStore } from '@/store/modules/app'

/**
 * 路由 meta.icon 名称 → 图标组件
 * 说明：只显式引入用到的图标而非 `import * as Icons`，避免把整套图标库打进产物
 */
const ICON_MAP = { DataLine, Menu: MenuIcon, Goods, List, User }

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)

/** 菜单项：取 /admin 路由下声明了 meta.icon 的子路由，保持路由表声明顺序 */
const menus = computed(() => {
  const adminRoute = router.options.routes.find((item) => item.path === '/admin')
  return (adminRoute?.children || [])
    .filter((child) => child.meta?.icon && child.meta?.title)
    .map((child) => ({
      path: `/admin/${child.path}`,
      title: child.meta.title,
      icon: child.meta.icon
    }))
})

/** 当前高亮菜单：子页面（如 /admin/goods/create）需高亮其所属列表菜单 */
const activeMenu = computed(() => {
  const hit = menus.value.find(
    (item) => route.path === item.path || route.path.startsWith(`${item.path}/`)
  )
  return hit ? hit.path : route.path
})
</script>

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex: none;
  flex-direction: column;
  width: $admin-sidebar-w;
  height: 100%;
  overflow: hidden;
  background: $nav-bg;
  transition: width var(--app-dur-slow) var(--app-ease);

  &--collapsed {
    width: $admin-sidebar-collapsed-w;
  }

  &__brand {
    display: flex;
    flex: none;
    align-items: center;
    gap: 10px;
    height: $admin-header-h;
    padding: 0 20px;
    color: $nav-text-active;
    text-decoration: none;
    @include focus-ring;

    // 折叠态收窄内边距，让图标居中
    .sidebar--collapsed & {
      justify-content: center;
      padding: 0;
    }
  }

  &__brand-text {
    @include ellipsis;

    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  &__menu {
    flex: 1;
    padding-top: $space-2;
    overflow-x: hidden;
    overflow-y: auto;

    // 折叠后 el-menu 自身宽度由组件控制，这里保证不出现横向滚动条
    &:not(.el-menu--collapse) {
      width: 100%;
    }

    // 折叠态只显示图标，用 $nav-text 保证对比度 ≥ 4.5:1
    :deep(.el-menu-item .el-icon) {
      color: inherit;
    }
  }

  &__foot {
    display: flex;
    flex: none;
    align-items: center;
    gap: 4px;
    padding: 14px 20px;
    border-top: 1px solid rgb(255 255 255 / 6%);
    color: $nav-text;
    font-size: $font-12;
  }

  &__version {
    font-variant-numeric: tabular-nums;
  }

  &__divider {
    opacity: 0.5;
  }
}
</style>
