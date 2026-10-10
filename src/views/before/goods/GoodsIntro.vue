<!--
  商品详情页 —— 商品介绍与参数区块
  职责：纯展示商品描述与规格参数表，不承载交互
  说明：从 detail.vue 拆出，控制详情页单文件行数
-->
<template>
  <section class="goods-intro">
    <h2 class="goods-intro__title">商品详情</h2>
    <p class="goods-intro__desc">{{ goods.description }}</p>
    <!-- 窄屏用单列：三列在 375px 下会把标签与内容挤成竖排，完全不可读 -->
    <el-descriptions :column="isMobile ? 1 : 3" border>
      <el-descriptions-item label="商品编号">{{ goods.id }}</el-descriptions-item>
      <el-descriptions-item label="商品类型">{{ goods.categoryName }}</el-descriptions-item>
      <el-descriptions-item label="上架时间">
        {{ formatDate(goods.createTime, 'YYYY-MM-DD') }}
      </el-descriptions-item>
      <el-descriptions-item label="库存">{{ goods.stock }}</el-descriptions-item>
      <el-descriptions-item label="累计销量">{{ goods.sales }}</el-descriptions-item>
      <el-descriptions-item label="售后服务">七天无理由退换</el-descriptions-item>
    </el-descriptions>
  </section>
</template>

<script setup>
import { formatDate } from '@/utils/format'
import { MOBILE_QUERY, useMediaQuery } from '@/composables/useMediaQuery'

defineProps({
  /** 商品数据 */
  goods: { type: Object, required: true }
})

/** 窄屏切换为单列描述列表 */
const isMobile = useMediaQuery(MOBILE_QUERY)
</script>

<style scoped lang="scss">
.goods-intro {
  @include card-surface;

  padding: 18px 20px 20px;

  &__title {
    margin: 0 0 14px;
    padding-left: 10px;
    border-left: 3px solid $color-primary;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  &__desc {
    margin: 0 0 16px;
    color: var(--el-text-color-regular);
    line-height: 1.8;
  }
}
</style>
