<!--
  商品详情页 —— 商品介绍与参数区块
  职责：纯展示商品描述与规格参数表，不承载交互
  说明：从 detail.vue 拆出，控制详情页单文件行数；区块头改用 SectionHeading 与首页保持一致
-->
<template>
  <section class="goods-intro">
    <SectionHeading title="商品详情" description="规格参数与售后说明" />

    <p class="goods-intro__desc">{{ goods.description }}</p>

    <!-- 窄屏用单列：三列在 375px 下会把标签与内容挤成竖排，完全不可读 -->
    <el-descriptions class="goods-intro__table" :column="isMobile ? 1 : 3" border>
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
import SectionHeading from '@/components/common/SectionHeading.vue'
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
  @include card-surface($space-6);

  &__desc {
    margin: $space-4 0;
    color: var(--app-text-2);
    font-size: $font-14;
    line-height: 1.8;
  }

  &__table {
    :deep(.el-descriptions__label) {
      width: 104px;
      background: var(--app-bg-subtle);
      color: var(--app-text-3);
      font-weight: 500;
    }

    :deep(.el-descriptions__cell) {
      font-size: $font-13;
    }
  }
}
</style>
