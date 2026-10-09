<!--
  前台首页（P1 阶段版本：用于验证「请求 → Mock → Store → 渲染」全链路）
  TODO(P4): 替换为完整版——轮播美化、分类导航、商品卡片网格、加载/空状态
-->
<template>
  <div class="home">
    <el-alert
      :title="`全链路已连通：轮播 ${banners.length} 条 · 推荐商品 ${goodsList.length} 件 · 商品类型 ${categoryStore.list.length} 个`"
      type="success"
      :closable="false"
      show-icon
    />

    <el-carousel v-if="banners.length" height="150px" class="home__banner">
      <el-carousel-item v-for="item in banners" :key="item.id">
        <div class="home__banner-item">{{ item.title }}</div>
      </el-carousel-item>
    </el-carousel>

    <h3>商品类型</h3>
    <el-space wrap>
      <el-tag v-for="cate in categoryStore.list" :key="cate.id" type="info">{{ cate.name }}</el-tag>
    </el-space>

    <h3>推荐商品（按销量倒序，来自 Mock 接口）</h3>
    <el-empty v-if="!loading && goodsList.length === 0" description="暂无商品" />
    <el-table v-else v-loading="loading" :data="goodsList" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商品名称" min-width="200" />
      <el-table-column prop="categoryName" label="类型" width="120" />
      <el-table-column prop="price" label="价格" width="110">
        <template #default="{ row }">{{ formatMoney(row.price) }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="90" />
      <el-table-column prop="sales" label="销量" width="90" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBannersApi, getRecommendGoodsApi } from '@/api/before/goods'
import { useCategoryStore } from '@/store/modules/category'
import { formatMoney } from '@/utils/format'

const categoryStore = useCategoryStore()

const loading = ref(false)
const banners = ref([])
const goodsList = ref([])

/**
 * 加载首页数据：轮播 + 推荐商品 + 商品类型
 * @returns {Promise<void>}
 */
async function loadHomeData() {
  loading.value = true
  try {
    const [bannerData, goodsData] = await Promise.all([
      getBannersApi(),
      getRecommendGoodsApi(8)
    ])
    banners.value = bannerData
    goodsList.value = goodsData
    await categoryStore.fetchAll()
  } finally {
    loading.value = false
  }
}

onMounted(loadHomeData)</script>

<style scoped>
.home__banner {
  margin: 16px 0;
}
.home__banner-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #fff;
  background: #409eff;
}
</style>
