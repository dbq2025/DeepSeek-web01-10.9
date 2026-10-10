<!--
  商品详情页 —— 同类商品推荐区块
  职责：按类型拉取同类型在售商品（排除当前商品），无数据时整块不渲染
  说明：从 detail.vue 拆出，避免详情页单文件超过 300 行
-->
<template>
  <section v-if="list.length" class="related">
    <h2 class="related__title">同类商品推荐</h2>
    <div class="related__grid">
      <GoodsCard v-for="item in list" :key="item.id" :goods="item" />
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import GoodsCard from '@/components/before/GoodsCard.vue'
import { getFrontGoodsListApi } from '@/api/before/goods'
import { GOODS_STATUS } from '@/utils/constants'

const props = defineProps({
  /** 当前商品所属类型 */
  categoryId: { type: [Number, String], default: '' },
  /** 需要排除的当前商品 id */
  excludeId: { type: [Number, String], default: '' },
  /** 最多展示条数 */
  limit: { type: Number, default: 4 }
})

const list = ref([])

/** 加载同类商品（多取 1 条以便排除当前商品后仍凑够 limit 条） */
async function loadRelated() {
  if (!props.categoryId) {
    list.value = []
    return
  }
  try {
    const res = await getFrontGoodsListApi({
      page: 1,
      pageSize: props.limit + 1,
      categoryId: props.categoryId,
      status: GOODS_STATUS.ON
    })
    list.value = (res?.list || [])
      .filter((it) => it.id !== Number(props.excludeId))
      .slice(0, props.limit)
  } catch (error) {
    list.value = []
  }
}

watch(() => [props.categoryId, props.excludeId], loadRelated)
onMounted(loadRelated)
</script>

<style scoped lang="scss">
.related {
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

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
}

@include respond-below('md') {
  .related__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
