<!--
  后台侧边菜单
  职责：根据路由表 `/admin` 的子路由（带 meta.icon 的）自动生成菜单项，并与 appStore 折叠状态联动
  扩展方式：新增后台页面时，在 router/modules/admin.js 里补 meta.title + meta.icon，
           再到下方 ICON_MAP 登记同名图标即可，菜单会自动出现
-->
<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__logo">{{ collapsed ? '后台' : '电商管理后台' }}</div>

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
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DataLine, Goods, List, Menu as MenuIcon, User } from '@element-plus/icons-vue'
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
  flex-direction: column;
  width: 210px;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  transition: width 0.2s;

  &--collapsed {
    width: 64px;
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    color: var(--el-color-primary);
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__menu {
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;
    border-right: none;

    // 折叠后 el-menu 自身宽度由组件控制，这里保证不出现横向滚动条
    &:not(.el-menu--collapse) {
      width: 100%;
    }
  }
}
</style>
