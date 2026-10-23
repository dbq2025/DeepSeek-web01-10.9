<!--
  前台顶栏导航（从 SiteHeader 拆出）
  职责：首页 / 购物车（含角标）/ 我的订单 / 我的收藏 + 用户下拉
  说明：拆出后 SiteHeader 只负责 Logo 与搜索，两个文件都稳定在 300 行以内；
       未登录时最后一项为「登录 / 注册」入口
-->
<template>
  <nav class="site-nav">
    <router-link to="/home">首页</router-link>
    <router-link to="/cart">
      购物车
      <el-badge
        v-if="cartStore.totalCount > 0"
        :value="cartStore.totalCount"
        class="site-nav__badge"
      />
    </router-link>
    <router-link to="/order/list">我的订单</router-link>
    <router-link to="/favorite">我的收藏</router-link>

    <el-dropdown v-if="userStore.isLogin" @command="onCommand">
      <span class="site-nav__user">
        <el-avatar :size="26" :src="userStore.profile?.avatar || ''">
          {{ nicknameFirst }}
        </el-avatar>
        <span class="site-nav__user-name">{{ userStore.profile?.nickname || '已登录' }}</span>
        <el-icon class="site-nav__caret"><ArrowDown /></el-icon>
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
    <router-link v-else class="site-nav__login" to="/login">登录 / 注册</router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useCartStore } from '@/store/modules/cart'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const { logout } = useAuth()

/** 头像兜底文案：取昵称首字 */
const nicknameFirst = computed(() => (userStore.profile?.nickname || 'U').slice(0, 1))

/**
 * 用户下拉菜单命令：退出登录走 useAuth，其余仅做路由跳转
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
</script>

<style scoped lang="scss">
.site-nav {
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
}

// 平板：收紧间距并隐藏次要导航（我的订单 / 我的收藏）
@include respond-below('md') {
  .site-nav {
    gap: 14px;
  }

  .site-nav a:nth-child(3),
  .site-nav a:nth-child(4) {
    display: none;
  }
}

@include respond-below('sm') {
  // Logo 已指向 /home，首页入口在手机端属冗余，隐藏以腾出空间
  .site-nav a:nth-child(1) {
    display: none;
  }

  .site-nav__user-name {
    max-width: 56px;
  }
}
</style>
