<!--
  前台顶栏（从 before/layout 拆出）
  职责：Logo + 胶囊搜索框，导航部分交给 SiteNav
  说明：1) 拆分后各文件均 ≤ 300 行，满足工程约束；
       2) 搜索框与 /search 路由的 keyword 双向同步，保证翻页/刷新时关键字不丢；
       3) 点击右侧放大镜或回车都能搜索（不依赖 hover，触屏可用）。
-->
<template>
  <header class="site-header">
    <div class="site-header__inner">
      <router-link class="site-header__logo" to="/home">
        <BrandMark :size="24" />
        <span>电子商务平台</span>
      </router-link>

      <div class="site-header__search">
        <el-input
          v-model="keyword"
          class="site-header__search-input"
          placeholder="搜索商品名称"
          clearable
          @keyup.enter="onSearch"
        >
          <template #prefix>
            <el-icon class="site-header__search-icon"><Search /></el-icon>
          </template>
          <template #suffix>
            <button
              class="site-header__search-btn"
              type="button"
              aria-label="搜索"
              @click="onSearch"
            >
              <el-icon><Search /></el-icon>
            </button>
          </template>
        </el-input>
      </div>

      <SiteNav />
    </div>
  </header>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import BrandMark from '@/components/common/BrandMark.vue'
import SiteNav from '@/components/before/SiteNav.vue'
import { useUserStore } from '@/store/modules/user'
import { getUserProfileApi } from '@/api/before/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const keyword = ref('')

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
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: $site-header-h;
  // 半透明白 + 模糊：内容滚动时不至于「糊成一条灰带」
  background: rgb(255 255 255 / 86%);
  border-bottom: 1px solid var(--app-border);
  backdrop-filter: blur(12px);

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

  // 胶囊搜索框：外层改圆角与高度，内层描边交给 EP 变量
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
}

// 平板：收紧间距
@include respond-below('md') {
  .site-header__inner {
    gap: $space-4;
  }
}

// 手机（≤767px）：顶栏改为两行 —— 首行「Logo + 导航」，次行整宽搜索框。
// 单行排布在 375px 下必然溢出（Logo + 搜索框 + 导航远超可用宽度）。
@include respond-below('sm') {
  .site-header {
    height: auto;
  }

  .site-header__inner {
    flex-wrap: wrap;
    gap: 10px 12px;
    height: auto;
    padding: 10px 12px;
  }

  .site-header__logo {
    font-size: $font-14;
  }

  // 搜索框独占第二行（order 让其排到导航之后）
  .site-header__search {
    order: 3;
    flex: 1 1 100%;
    max-width: none;
    min-width: 0;
  }

  .site-header__search-input :deep(.el-input__wrapper) {
    height: 38px;
  }
}
</style>
