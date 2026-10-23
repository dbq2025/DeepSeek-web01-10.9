<!--
  首页商品分类快捷入口
  职责：把「圆点 + 文字」升级为「56px 圆形浅色图标底 + 品类名」，6 列网格
  说明：图标按品类名做简单映射（同一类目每次都取同一个图标），
       未命中时回退到通用标签图标，不引入新依赖
-->
<template>
  <nav class="category-nav">
    <router-link
      v-for="(item, index) in categories"
      :key="item.id"
      class="category-nav__item"
      :to="{ path: '/search', query: { categoryId: item.id } }"
    >
      <span class="category-nav__icon" :style="{ '--tint': tint(index) }">
        <el-icon :size="22"><component :is="iconOf(item.name)" /></el-icon>
      </span>
      <span class="category-nav__name">{{ item.name }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { Apple, Basketball, Cellphone, Handbag, Monitor, Reading } from '@element-plus/icons-vue'

defineProps({
  /** 商品类型列表（来自 categoryStore） @type {Array<object>} */
  categories: { type: Array, default: () => [] }
})

/** 品类名关键字 → 图标（命中即用，均为已引入图标，不额外增大产物） */
const ICON_RULES = [
  { keyword: '手机', icon: Cellphone },
  { keyword: '数码', icon: Cellphone },
  { keyword: '家电', icon: Monitor },
  { keyword: '服饰', icon: Handbag },
  { keyword: '鞋包', icon: Handbag },
  { keyword: '图书', icon: Reading },
  { keyword: '文娱', icon: Reading },
  { keyword: '食品', icon: Apple },
  { keyword: '生鲜', icon: Apple },
  { keyword: '运动', icon: Basketball },
  { keyword: '户外', icon: Basketball }
]

/**
 * 取品类对应图标
 * @param {string} name 品类名
 * @returns {object} 图标组件
 */
function iconOf(name) {
  const hit = ICON_RULES.find((rule) => String(name).includes(rule.keyword))
  return hit ? hit.icon : Reading
}

/**
 * 图标底色：按序号取 $dot-colors，保证同屏色彩不重复
 * @param {number} index 序号
 * @returns {string} CSS 变量
 */
function tint(index) {
  return `var(--app-cat-${(index % 6) + 1})`
}
</script>

<style scoped lang="scss">
.category-nav {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: $space-3;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
    padding: $space-4 8px $space-3;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--app-radius-card);
    color: var(--app-text-2);
    text-decoration: none;
    transition:
      background var(--app-dur) var(--app-ease),
      border-color var(--app-dur) var(--app-ease),
      transform var(--app-dur) var(--app-ease);
    @include focus-ring;

    &:hover {
      background: var(--app-bg-card);
      border-color: var(--app-border);
      transform: translateY(-2px);

      .category-nav__icon {
        border-color: var(--app-color-primary);
        color: var(--app-color-primary);
      }
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    // 品类浅底：先给纯色兜底，再交给 color-mix 做 10% 透明叠加
    background: var(--app-bg-subtle);
    background: color-mix(in srgb, var(--tint) 10%, transparent);
    border: 1px solid transparent;
    border-radius: 50%;
    color: var(--tint);
    transition:
      border-color var(--app-dur) var(--app-ease),
      color var(--app-dur) var(--app-ease);
  }

  &__name {
    font-size: $font-13;
    font-weight: 500;
    @include ellipsis;
  }
}

@include respond-below('lg') {
  .category-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@include respond-below('sm') {
  .category-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-2;
  }

  .category-nav__item {
    padding: $space-3 4px $space-2;
  }

  .category-nav__icon {
    width: 48px;
    height: 48px;
  }
}
</style>
