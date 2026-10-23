<!--
  商品搜索 / 列表页
  职责：关键字 + 类型筛选 + 排序 + 分页的商品网格
  说明：筛选条件由路由 query 驱动（keyword / categoryId），保证顶栏搜索、首页分类入口、
       浏览器前进后退三者行为一致；排序只在页内切换，不写进地址栏
-->
<template>
  <div class="search">
    <!-- 筛选工具条：一整块浅色卡片，左「类型胶囊」右「排序分段」 -->
    <div class="search__bar">
      <div class="search__group">
        <span class="search__label">类型</span>
        <el-radio-group
          v-model="query.categoryId"
          class="search__cats is-pill"
          size="small"
          @change="search"
        >
          <el-radio-button :value="''">全部</el-radio-button>
          <el-radio-button v-for="item in categoryStore.list" :key="item.id" :value="item.id">
            {{ item.name }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <div class="search__group search__group--sort">
        <span class="search__label">排序</span>
        <el-radio-group v-model="query.sortBy" class="is-pill" size="small" @change="search">
          <el-radio-button value="">综合</el-radio-button>
          <el-radio-button value="salesDesc">销量</el-radio-button>
          <el-radio-button value="priceAsc">价格 ↑</el-radio-button>
          <el-radio-button value="priceDesc">价格 ↓</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <p class="search__summary">
      <template v-if="query.name">
        关键字「<b>{{ query.name }}</b
        >」共找到 <b>{{ total }}</b> 件商品
      </template>
      <template v-else>
        共 <b>{{ total }}</b> 件在售商品
      </template>
    </p>

    <div v-if="loading" class="search__grid">
      <div v-for="n in 8" :key="n" class="search__card-skeleton">
        <div class="skeleton skeleton--media" />
        <div class="skeleton skeleton--title" />
        <div class="skeleton skeleton--text" />
      </div>
    </div>
    <div v-else-if="list.length" class="search__grid">
      <GoodsCard v-for="item in list" :key="item.id" :goods="item" />
    </div>
    <EmptyState v-else-if="error" type="error" @retry="load" />
    <EmptyState v-else description="没有找到符合条件的商品">
      <el-button type="primary" @click="onResetFilter">清空筛选条件</el-button>
    </EmptyState>

    <Pagination
      v-if="total > 0"
      :page="query.page"
      :page-size="query.pageSize"
      :total="total"
      :page-sizes="[12, 24, 48]"
      @page-change="changePage"
      @size-change="changeSize"
    />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import GoodsCard from '@/components/before/GoodsCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import { useTable } from '@/composables/useTable'
import { getFrontGoodsListApi } from '@/api/before/goods'
import { useCategoryStore } from '@/store/modules/category'
import { GOODS_STATUS } from '@/utils/constants'

const route = useRoute()
const categoryStore = useCategoryStore()

const { loading, error, list, total, query, load, search, changePage, changeSize } = useTable(
  getFrontGoodsListApi,
  {
    // 前台只展示上架商品；immediate 关闭，改为「先同步路由参数再请求」
    defaultQuery: { name: '', categoryId: '', status: GOODS_STATUS.ON, sortBy: '' },
    pageSize: 12,
    immediate: false
  }
)

/** 用当前路由 query 重置筛选条件（keyword / categoryId） */
function syncFromRoute() {
  const { keyword, categoryId } = route.query
  query.name = typeof keyword === 'string' ? keyword : ''
  query.categoryId = categoryId ? Number(categoryId) : ''
  query.page = 1
}

/** 清空所有筛选条件并重新加载 */
function onResetFilter() {
  syncFromRoute()
  query.name = ''
  query.categoryId = ''
  query.sortBy = ''
  return load()
}

// 顶栏搜索 / 首页分类入口 / 浏览器前进后退 → 同步条件后重新请求
watch(
  () => route.query,
  () => {
    if (route.path !== '/search') return
    syncFromRoute()
    load()
  }
)

onMounted(async () => {
  await categoryStore.fetchAll().catch(() => [])
  syncFromRoute()
  load()
})
</script>

<style scoped lang="scss">
.search {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  // 工具条卡片：类型在左、排序靠右，窄屏自动换行
  &__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-3 $space-5;
    padding: $space-4 $space-5;
    background: var(--app-bg-card);
    border-radius: var(--app-radius-card);
    box-shadow: var(--app-shadow-card);
  }

  &__group {
    display: flex;
    align-items: center;
    gap: $space-3;
    min-width: 0;
  }

  &__group--sort {
    margin-left: auto;
  }

  &__label {
    flex: none;
    color: var(--app-text-3);
    font-size: $font-13;
    font-weight: 500;
  }

  // 类型胶囊组：横向可滚，避免 6 个类目挤压排序区
  &__cats {
    flex-wrap: wrap;
  }

  &__summary {
    margin: 0;
    color: var(--app-text-2);
    font-size: $font-13;
    font-weight: 500;

    b {
      color: var(--app-color-price);
      font-variant-numeric: tabular-nums;
    }
  }

  // 与首页保持同一套网格节奏（4 列 / 20px）
  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-5;
    align-items: stretch;
  }

  &__card-skeleton {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-3;
    background: var(--app-bg-card);
    border-radius: var(--app-radius-card);
    box-shadow: var(--app-shadow-card);
  }
}

// 胶囊单选按钮统一观感（与看板时间范围控件同款）
.search :deep(.el-radio-group.is-pill) {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.search :deep(.el-radio-button__inner) {
  padding: 5px 12px;
  background: var(--app-bg-card);
  border: 1px solid var(--app-border);
  border-radius: $radius-pill;
  color: var(--app-text-2);
  font-size: $font-12;
  box-shadow: none;
}

.search :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--app-color-primary);
  border-color: var(--app-color-primary);
  color: #fff;
}

@include respond-below('lg') {
  .search__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@include respond-below('md') {
  .search__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search__group--sort {
    margin-left: 0;
  }
}

@include respond-below('sm') {
  .search__grid {
    gap: $space-3;
  }

  .search__bar {
    padding: $space-3 $space-4;
  }
}
</style>
