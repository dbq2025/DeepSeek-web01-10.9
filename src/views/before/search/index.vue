<!--
  商品搜索 / 列表页
  职责：关键字 + 类型筛选 + 排序 + 分页的商品网格
  说明：筛选条件由路由 query 驱动（keyword / categoryId），保证顶栏搜索、首页分类入口、
       浏览器前进后退三者行为一致；排序只在页内切换，不写进地址栏
-->
<template>
  <div class="search">
    <div class="search__bar">
      <span class="search__label">商品类型</span>
      <el-select
        v-model="query.categoryId"
        class="search__select"
        placeholder="全部类型"
        clearable
        @change="search"
      >
        <el-option
          v-for="item in categoryStore.list"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>

      <span class="search__label">排序</span>
      <el-radio-group v-model="query.sortBy" @change="search">
        <el-radio-button value="">综合</el-radio-button>
        <el-radio-button value="salesDesc">销量</el-radio-button>
        <el-radio-button value="priceAsc">价格 ↑</el-radio-button>
        <el-radio-button value="priceDesc">价格 ↓</el-radio-button>
      </el-radio-group>
    </div>

    <p class="search__summary">
      <template v-if="query.name">
        关键字「<b>{{ query.name }}</b>」共找到 <b>{{ total }}</b> 件商品
      </template>
      <template v-else>
        共 <b>{{ total }}</b> 件在售商品
      </template>
    </p>

    <div v-if="loading" class="search__grid">
      <el-skeleton v-for="n in 8" :key="n" animated :rows="6" />
    </div>
    <div v-else-if="list.length" class="search__grid">
      <GoodsCard v-for="item in list" :key="item.id" :goods="item" />
    </div>
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

const { loading, list, total, query, load, search, changePage, changeSize } = useTable(
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
  gap: 16px;

  &__bar {
    @include card-surface;

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
  }

  &__label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__select {
    width: 170px;
  }

  &__summary {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 13px;

    b {
      color: $color-price;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

@include respond-below('lg') {
  .search__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@include respond-below('sm') {
  .search__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
