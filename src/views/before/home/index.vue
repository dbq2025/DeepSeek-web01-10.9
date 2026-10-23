<!--
  前台首页
  职责：首屏轮播 + 商品类型快捷入口 + 热门推荐商品网格
  数据：/home/banners、/goods/recommend、类型走 categoryStore 缓存
  说明：改造只调整模板结构与样式，所有请求与 catch 兜底逻辑保持不变
-->
<template>
  <div class="home">
    <!-- 首屏：图 + 遮罩 + HTML 文案层 -->
    <HomeHero v-if="banners.length" :banners="banners" />
    <div v-else class="home__hero-skeleton skeleton" />

    <!-- 分类快捷入口 -->
    <section class="home__panel">
      <SectionHeading title="商品分类" description="按品类快速筛选" />
      <CategoryNav :categories="categoryStore.list" />
    </section>

    <!-- 热门推荐 -->
    <section class="home__panel">
      <SectionHeading title="热门推荐" description="近 30 天销量领先">
        <template #extra>
          <router-link class="home__more" to="/search">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </template>
      </SectionHeading>

      <div v-if="loading" class="home__grid">
        <div v-for="n in 8" :key="n" class="home__card-skeleton">
          <div class="skeleton skeleton--media" />
          <div class="skeleton skeleton--title" />
          <div class="skeleton skeleton--text" />
        </div>
      </div>
      <div v-else-if="recommends.length" class="home__grid">
        <GoodsCard v-for="item in recommends" :key="item.id" :goods="item" />
      </div>
      <EmptyState v-else description="暂无推荐商品" />
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import HomeHero from '@/components/before/HomeHero.vue'
import CategoryNav from '@/components/before/CategoryNav.vue'
import GoodsCard from '@/components/before/GoodsCard.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getBannersApi, getRecommendGoodsApi } from '@/api/before/goods'
import { useCategoryStore } from '@/store/modules/category'

const categoryStore = useCategoryStore()

const banners = ref([])
const recommends = ref([])
const loading = ref(true)

/** 加载首页数据（轮播 / 类型 / 推荐，单个接口失败不阻塞其余） */
async function loadHomeData() {
  loading.value = true
  try {
    const [bannerData, recommendData] = await Promise.all([
      getBannersApi().catch(() => []),
      getRecommendGoodsApi(8).catch(() => [])
    ])
    banners.value = bannerData || []
    recommends.value = recommendData || []
    await categoryStore.fetchAll().catch(() => [])
  } finally {
    loading.value = false
  }
}

onMounted(loadHomeData)
</script>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  &__hero-skeleton {
    height: 360px;
    border-radius: var(--app-radius-panel);
  }

  &__panel {
    @include card-surface($space-6);
  }

  &__more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--app-text-3);
    font-size: $font-13;
    text-decoration: none;
    transition: color var(--app-dur) var(--app-ease);
    @include focus-ring;

    &:hover {
      color: var(--app-color-primary);
    }
  }

  // 商品网格：4 列，24px 间距（与卡片内边距构成呼吸感）
  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-5;
    margin-top: $space-5;
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

@include respond-below('lg') {
  .home__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@include respond-below('md') {
  .home__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home__panel {
    padding: $space-4;
  }
}

@include respond-below('sm') {
  .home__grid {
    gap: $space-3;
  }

  .home__hero-skeleton {
    height: 160px;
  }
}
</style>
