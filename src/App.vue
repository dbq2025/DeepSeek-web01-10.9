<!--
  App.vue —— 根组件
  职责：提供一级路由出口；后台与前台各自的 Layout 由子路由承担
-->
<template>
  <router-view />
</template>

<script setup>
// 根组件无需业务逻辑
</script>

<style>
#app {
  height: 100%;
}
</style>
