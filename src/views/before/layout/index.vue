<!--
  电商前台 Layout（骨架占位）
  职责：承载前台顶栏、页脚与子路由出口；P4 阶段完善导航与购物车角标
-->
<template>
  <div class="before-layout">
    <header class="before-layout__header">
      <router-link to="/home">电子商务平台</router-link>
      <nav>
        <router-link to="/home">首页</router-link>
        <router-link to="/cart">购物车</router-link>
        <router-link to="/order/list">我的订单</router-link>
        <router-link to="/favorite">我的收藏</router-link>
        <router-link to="/user">个人中心</router-link>
        <router-link to="/login">登录</router-link>
      </nav>
    </header>

    <main class="before-layout__main">
      <router-view />
    </main>

    <footer class="before-layout__footer">前端开发技术课程设计 · 电子商务平台</footer>
  </div>
</template>

<script setup>
// TODO(P4): 顶栏搜索框、购物车角标、登录态切换
</script>

<style scoped>
.before-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  border-bottom: 1px solid #dcdfe6;
}
.before-layout__header nav a {
  margin-left: 16px;
}
.before-layout__main {
  min-height: calc(100vh - 121px);
  padding: 24px;
}
.before-layout__footer {
  padding: 16px 24px;
  border-top: 1px solid #dcdfe6;
  color: #909399;
}
</style>
