<!--
  电商前台 Layout
  职责：顶栏（Logo / 搜索 / 导航 / 购物车角标 / 用户下拉）+ 内容出口 + 页脚
  说明：1) 顶栏 72px + 半透明白 + 毛玻璃，滚动时内容不「糊成一条带」；
       2) 搜索框为胶囊，focus 时显示主色环；点击右侧放大镜或回车都能搜索；
       3) 搜索框与 /search 路由的 keyword 双向同步，保证翻页/刷新时关键字不丢；
       4) 路由切换加 fade-slide 过渡（P4-1），仅此处与后台 layout 使用，不含 App.vue
-->
<template>
  <div class="site">
    <header class="site__header">
      <div class="site__inner">
        <router-link class="site__logo" to="/home">
          <BrandMark :size="24" />
          <span>电子商务平台</span>
        </router-link>

        <div class="site__search">
          <el-input
            v-model="keyword"
            class="site__search-input"
            placeholder="搜索商品名称"
            clearable
            @keyup.enter="onSearch"
          >
            <template #prefix>
              <el-icon class="site__search-icon"><Search /></el-icon>
            </template>
            <template #suffix>
              <button class="site__search-btn" type="button" aria-label="搜索" @click="onSearch">
                <el-icon><Search /></el-icon>
              </button>
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
              <el-icon class="site__caret"><ArrowDown /></el-icon>
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
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="site__footer">
      <div class="site__footer-inner">
        <p class="site__footer-title">电子商务平台 · 前端开发技术课程设计</p>
        <p class="site__footer-tip">本系统为教学演示项目，数据由前端 Mock 生成，不涉及真实交易</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import BrandMark from '@/components/common/BrandMark.vue'
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
  background: var(--app-bg-page);

  &__header {
    position: sticky;
    top: 0;
    z-index: 100;
    height: $site-header-h;
    background: rgb(255 255 255 / 86%);
    border-bottom: 1px solid var(--app-border);
    backdrop-filter: blur(12px);
  }

  &__inner {
    display: flex;
    align-items: center;
    gap: $space-6;
    max-width: $container-width;
    height: 100%;
    margin: 0 auto;
    padding: 0 $space-5;
  }

  &__logo {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    color: var(--app-color-primary);
    font-size: $font-16;
    font-weight: 700;
    letter-spacing: -0.01em;
    white-space: nowrap;
    text-decoration: none;
    @include focus-ring;
  }

  &__search {
    flex: 1;
    max-width: 440px;
  }

  // 胶囊搜索框：内部 1px 描边交给 EP 变量，外层只改圆角与高度
  &__search-input {
    :deep(.el-input__wrapper) {
      height: 42px;
      padding: 0 6px 0 14px;
      background: var(--app-bg-subtle);
      border-radius: $radius-pill;
      box-shadow: none;

      &:hover {
        background: var(--app-bg-page);
        box-shadow: 0 0 0 1px var(--app-border) inset;
      }

      &.is-focus {
        background: var(--app-bg-card);
        box-shadow:
          0 0 0 1px var(--app-color-primary) inset,
          0 0 0 3px var(--el-color-primary-light-9);
      }
    }
  }

  &__search-icon {
    color: var(--app-text-3);
    font-size: 15px;
  }

  &__search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    background: var(--app-color-primary);
    border: none;
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    transition: background var(--app-dur) var(--app-ease);
    @include focus-ring;

    &:hover {
      background: var(--app-color-primary-dark);
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: $space-5;
    margin-left: auto;
    font-size: $font-14;

    a {
      // 窄屏空间紧张时必须禁止换行，否则「购物车」会被压成竖排
      position: relative;
      flex: none;
      padding: 4px 0;
      white-space: nowrap;
      color: var(--app-text-2);
      text-decoration: none;
      transition: color var(--app-dur) var(--app-ease);
      @include focus-ring;

      // 选中态：2px 主色下划线（区别于改造前的「只变字色」）
      &::after {
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 2px;
        background: var(--app-color-primary);
        border-radius: 2px;
        opacity: 0;
        transform: scaleX(0.4);
        transition:
          opacity var(--app-dur) var(--app-ease),
          transform var(--app-dur) var(--app-ease);
        content: '';
      }

      &:hover {
        color: var(--app-color-primary);
      }

      &.router-link-active {
        color: var(--app-color-primary);
        font-weight: 500;

        &::after {
          opacity: 1;
          transform: scaleX(1);
        }
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
    height: 36px;
    padding: 0 10px 0 4px;
    border: 1px solid transparent;
    border-radius: $radius-pill;
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

  &__user-name {
    max-width: 90px;
    @include ellipsis;
  }

  &__caret {
    color: var(--app-text-3);
    font-size: 12px;
  }

  &__login {
    color: var(--app-color-primary) !important;
    font-weight: 500;
  }

  // 内容区：上下留白按方案（24 / 40），左右保留 20 gutter 便于窄屏与 >1200 视口过渡
  &__main {
    flex: 1;
    width: 100%;
    max-width: calc(#{$container-width} + #{$space-10});
    margin: 0 auto;
    padding: $space-6 $space-5 $space-10;
  }

  // 页脚：去掉大块白底，只留 1px 上边框
  &__footer {
    padding: $space-8 0;
    border-top: 1px solid var(--app-border);
    color: var(--app-text-3);
    font-size: $font-13;
    text-align: center;
  }

  &__footer-inner {
    max-width: $container-width;
    margin: 0 auto;
    padding: 0 $space-5;
  }

  &__footer-title {
    margin: 0 0 6px;
    color: var(--app-text-2);
  }

  &__footer-tip {
    margin: 0;
  }
}

// 平板：收紧间距并隐藏次要导航
@include respond-below('md') {
  .site__inner {
    gap: $space-4;
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
// 单行排布在 375px 下必然溢出（Logo + 搜索框 + 导航远超可用宽度）。
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
    font-size: $font-14;
  }

  // 搜索框独占第二行（order 让其排到导航之后）
  .site__search {
    order: 3;
    flex: 1 1 100%;
    max-width: none;
    min-width: 0;
  }

  .site__search-input :deep(.el-input__wrapper) {
    height: 38px;
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

  .site__main {
    padding: $space-4 $space-3 $space-8;
  }

  .site__footer {
    padding: $space-5 0;
  }
}
</style>
