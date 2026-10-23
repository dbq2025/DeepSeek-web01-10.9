<!--
  后台管理 Layout
  职责：组合侧边菜单、顶栏与子路由出口，构成后台整体骨架
  说明：内容区统一 24px 留白与页面底色；路由切换加 fade-slide 过渡（P4-1），
       过渡只加在此处与前台 layout，不加 App.vue，避免双重动画
-->
<template>
  <div class="admin-layout">
    <SidebarCom />
    <div class="admin-layout__main">
      <HeaderCom />
      <main class="admin-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
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
  background: var(--app-bg-page);

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__content {
    flex: 1;
    padding: $space-6;
    overflow-y: auto;
  }
}

@include respond-below('sm') {
  .admin-layout__content {
    padding: $space-4;
  }
}
</style>
