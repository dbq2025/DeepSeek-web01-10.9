<!--
  个人中心（骨架占位）
  职责：个人中心父级布局，含子路由出口（个人信息）；P4 阶段补充侧边菜单
-->
<template>
  <div class="user-center">
    <h2>个人中心</h2>
    <nav>
      <router-link to="/user/profile">个人信息</router-link>
      <router-link to="/favorite">我的收藏</router-link>
    </nav>
    <hr />
    <router-view />
  </div>
</template>

<script setup>
// TODO(P4): 个人中心侧边菜单与登录态展示
</script>

<style scoped>
.user-center nav a {
  margin-right: 12px;
}
</style>
