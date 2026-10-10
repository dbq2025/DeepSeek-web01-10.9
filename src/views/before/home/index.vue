<!--
  前台首页
  职责：轮播广告 + 商品类型快捷入口 + 热门推荐商品网格
  数据：/home/banners、/goods/recommend、类型走 categoryStore 缓存
-->
<template>
  <div class="home">
    <!-- 轮播 -->
    <el-carousel v-if="banners.length" class="home__carousel" height="300px" :interval="4500">
      <el-carousel-item v-for="item in banners" :key="item.id">
        <img class="home__banner" :src="item.image" :alt="item.title" />
      </el-carousel-item>
    </el-carousel>
    <div v-else class="home__carousel"><el-skeleton animated :rows="6" /></div>

    <!-- 分类快捷入口 -->
    <section class="home__panel">
      <h2 class="home__title">商品分类</h2>
      <div class="home__cats">
        <router-link
          v-for="(item, index) in categoryStore.list"
          :key="item.id"
          class="home__cat"
          :to="{ path: '/search', query: { categoryId: item.id } }"
        >
          <span class="home__cat-dot" :style="{ background: dotColors[index % dotColors.length] }" />
          <span class="home__cat-name">{{ item.name }}</span>
        </router-link>
      </div>
    </section>

    <!-- 热门推荐 -->
    <section class="home__panel">
      <div class="home__head">
        <h2 class="home__title">热门推荐</h2>
        <router-link class="home__more" to="/search">查看全部商品 →</router-link>
      </div>

      <div v-if="loading" class="home__grid">
        <el-skeleton v-for="n in 8" :key="n" animated :rows="6" />
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
import GoodsCard from '@/components/before/GoodsCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getBannersApi, getRecommendGoodsApi } from '@/api/before/goods'
import { useCategoryStore } from '@/store/modules/category'

const categoryStore = useCategoryStore()

/** 分类入口的圆点配色（视觉点缀，与商品类型无业务绑定） */
const dotColors = ['#4a7cf7', '#20b2aa', '#f2994a', '#eb5757', '#9b51e0', '#27ae60']

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
  gap: 20px;

  &__carousel {
    overflow: hidden;
    border-radius: 10px;
  }

  &__banner {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  &__panel {
    @include card-surface;

    padding: 16px 20px 20px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    padding-left: 10px;
    border-left: 3px solid $color-primary;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  &__more {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    text-decoration: none;

    &:hover {
      color: $color-primary;
    }
  }

  &__cats {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  &__cat {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 8px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color);
    color: var(--el-text-color-regular);
    font-size: 14px;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      border-color: $color-primary;
      color: $color-primary;
      transform: translateY(-2px);
    }
  }

  &__cat-dot {
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: 50%;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
}

@include respond-below('lg') {
  .home__grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .home__cats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@include respond-below('sm') {
  .home__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .home__cats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
