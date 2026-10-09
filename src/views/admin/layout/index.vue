<!--
  后台管理 Layout（骨架占位）
  职责：承载后台顶栏、侧边菜单与子路由出口；P3 阶段完善样式与菜单联动
-->
<template>
  <div class="admin-layout">
    <header class="admin-layout__header">
      <span>电子商务平台 · 后台管理系统</span>
      <router-link to="/admin/login">退出登录</router-link>
    </header>

    <div class="admin-layout__body">
      <aside class="admin-layout__aside">
        <ul>
          <li><router-link to="/admin/dashboard">数据统计</router-link></li>
          <li><router-link to="/admin/category">商品类型管理</router-link></li>
          <li><router-link to="/admin/goods">商品信息管理</router-link></li>
          <li><router-link to="/admin/order">订单管理</router-link></li>
          <li><router-link to="/admin/profile">管理员信息</router-link></li>
        </ul>
      </aside>

      <main class="admin-layout__main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
// TODO(P3): 侧边菜单改为由路由表动态生成，接入折叠状态
</script>

<style scoped>
.admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid #dcdfe6;
}
.admin-layout__body {
  display: flex;
  min-height: calc(100vh - 57px);
}
.admin-layout__aside {
  width: 200px;
  padding: 12px;
  border-right: 1px solid #dcdfe6;
}
.admin-layout__aside ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.admin-layout__aside li {
  margin-bottom: 8px;
}
.admin-layout__main {
  flex: 1;
  padding: 20px;
}
</style>
