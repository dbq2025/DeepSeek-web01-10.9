<!--
  后台管理 Layout
  职责：组合侧边菜单、顶栏与子路由出口，构成后台整体骨架
  说明：各子页面自行负责内容区留白，此处只提供滚动容器与页面底色
-->
<template>
  <div class="admin-layout">
    <SidebarCom />
    <div class="admin-layout__main">
      <HeaderCom />
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import SidebarCom from '@/components/admin/SidebarCom.vue'
import HeaderCom from '@/components/admin/HeaderCom.vue'
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color-page);

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }
}
</style>
