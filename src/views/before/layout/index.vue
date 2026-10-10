<!--
  电商前台 Layout
  职责：顶栏（Logo / 搜索 / 导航 / 购物车角标 / 用户下拉）+ 内容出口 + 页脚
  说明：搜索框与 /search 路由的 keyword 双向同步，保证在搜索页翻页/刷新时关键字不丢
-->
<template>
  <div class="site">
    <header class="site__header">
      <div class="site__inner">
        <router-link class="site__logo" to="/home">
          <el-icon :size="22"><ShoppingCart /></el-icon>
          <span>电子商务平台</span>
        </router-link>

        <div class="site__search">
          <el-input v-model="keyword" placeholder="搜索商品名称" clearable @keyup.enter="onSearch">
            <template #append>
              <el-button :icon="Search" @click="onSearch" />
            </template>
          </el-input>
        </div>

        <nav class="site__nav">
          <router-link to="/home">首页</router-link>
          <router-link to="/cart">
            购物车
            <el-badge
              v-if="cartStore.totalCount > 0"
              :value="cartStore.totalCount"
              class="site__badge"
            />
          </router-link>
          <router-link to="/order/list">我的订单</router-link>
          <router-link to="/favorite">我的收藏</router-link>

          <el-dropdown v-if="userStore.isLogin" @command="onCommand">
            <span class="site__user">
              <el-avatar :size="26" :src="userStore.profile?.avatar || ''">
                {{ nicknameFirst }}
              </el-avatar>
              <span class="site__user-name">{{ userStore.profile?.nickname || '已登录' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="favorite">我的收藏</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <router-link v-else class="site__login" to="/login">登录 / 注册</router-link>
        </nav>
      </div>
    </header>

    <main class="site__main">
      <router-view />
    </main>

    <footer class="site__footer">
      <p class="site__footer-title">电子商务平台 · 前端开发技术课程设计</p>
      <p class="site__footer-tip">本系统为教学演示项目，数据由前端 Mock 生成，不涉及真实交易</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Search, ShoppingCart } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'
import { useAuth } from '@/composables/useAuth'
import { getUserProfileApi } from '@/api/before/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const { logout } = useAuth()

const keyword = ref('')

/** 头像兜底文案：取昵称首字 */
const nicknameFirst = computed(() => (userStore.profile?.nickname || 'U').slice(0, 1))

// 路由变化时回填关键字（直接在地址栏进搜索页 / 后退时保持一致）
watch(
  () => route.query.keyword,
  (value) => {
    if (route.path === '/search') keyword.value = typeof value === 'string' ? value : ''
  },
  { immediate: true }
)

/** 顶栏搜索：跳转搜索页并带上关键字 */
function onSearch() {
  const value = keyword.value.trim()
  router.push({ path: '/search', query: value ? { keyword: value } : {} })
}

/**
 * 用户下拉菜单命令
 * @param {'profile'|'orders'|'favorite'|'logout'} command 菜单项
 * @returns {void}
 */
function onCommand(command) {
  const map = { profile: '/user/profile', orders: '/order/list', favorite: '/favorite' }
  if (command === 'logout') {
    logout('user')
    return
  }
  router.push(map[command])
}

// user store 只持久化 token / role，刷新后 profile 为空，
// 这里补拉一次用户资料，避免顶栏昵称与头像丢失
onMounted(async () => {
  if (!userStore.isLogin || userStore.profile) return
  try {
    const data = await getUserProfileApi()
    userStore.updateProfile(data)
  } catch (error) {
    // 登录态异常由 request.js 统一处理
  }
})
</script>

<style scoped lang="scss">
.site {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--el-bg-color-page);

  &__header {
    position: sticky;
    top: 0;
    z-index: 100;
    height: $header-height;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  &__inner {
    display: flex;
    align-items: center;
    gap: 28px;
    max-width: $container-width;
    height: 100%;
    margin: 0 auto;
    padding: 0 20px;
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $color-primary;
    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
    text-decoration: none;
  }

  &__search {
    flex: 1;
    max-width: 420px;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 22px;
    margin-left: auto;
    font-size: 14px;

    a {
      // 窄屏空间紧张时必须禁止换行，否则「购物车」会被压成竖排
      flex: none;
      white-space: nowrap;
      color: var(--el-text-color-regular);
      text-decoration: none;
      transition: color 0.2s;

      &:hover,
      &.router-link-active {
        color: $color-primary;
      }
    }
  }

  &__badge {
    margin-left: 6px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    outline: none;
  }

  &__user-name {
    max-width: 90px;
    @include ellipsis;
  }

  &__login {
    color: $color-primary !important;
  }

  &__main {
    flex: 1;
    width: 100%;
    max-width: $container-width;
    margin: 0 auto;
    padding: 20px;
  }

  &__footer {
    padding: 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    color: var(--el-text-color-secondary);
    text-align: center;
    font-size: 13px;
  }

  &__footer-title {
    margin: 0 0 6px;
    color: var(--el-text-color-regular);
  }

  &__footer-tip {
    margin: 0;
  }
}

// 平板：收紧间距并隐藏次要导航
@include respond-below('md') {
  .site__inner {
    gap: 16px;
  }

  .site__nav {
    gap: 14px;
  }

  .site__nav a:nth-child(3),
  .site__nav a:nth-child(4) {
    display: none;
  }
}

// 手机（≤767px）：顶栏改为两行 —— 首行「Logo + 购物车 + 用户」，次行整宽搜索框。
// 单行排布在 375px 下必然溢出（Logo 140 + 搜索框 + 导航 220 远超 335 可用宽度）。
@include respond-below('sm') {
  .site__header {
    height: auto;
  }

  .site__inner {
    flex-wrap: wrap;
    gap: 10px 12px;
    height: auto;
    padding: 10px 12px;
  }

  .site__logo {
    font-size: 16px;
  }

  // 搜索框独占第二行（order 让其排到导航之后）
  .site__search {
    order: 3;
    flex: 1 1 100%;
    max-width: none;
    min-width: 0;
  }

  .site__nav {
    margin-left: auto;
  }

  // Logo 已指向 /home，首页入口在手机端属冗余，隐藏以腾出空间
  .site__nav a:nth-child(1) {
    display: none;
  }

  .site__user-name {
    max-width: 56px;
  }
}
</style>
