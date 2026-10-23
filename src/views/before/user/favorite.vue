<!--
  我的收藏
  职责：收藏商品的网格展示 + 取消收藏 + 快速加入购物车
  说明：/favorite/list 返回的条目形如 { id, goodsId, goods }，此处只取 goods 交给商品卡片
-->
<template>
  <div class="favorite">
    <PageHeader title="我的收藏" description="收藏的商品下架后仍会保留，可随时取消收藏" />

    <div v-loading="loading" class="favorite__body">
      <div v-if="list.length" class="favorite__grid">
        <GoodsCard v-for="item in list" :key="item.id" :goods="item" :show-actions="false">
          <template #actions>
            <el-button
              type="primary"
              size="small"
              :disabled="item.status !== 1"
              @click.stop="onAddCart(item)"
            >
              加入购物车
            </el-button>
            <el-button size="small" @click.stop="onUnfavorite(item)">取消收藏</el-button>
          </template>
        </GoodsCard>
      </div>

      <EmptyState v-else-if="!loading && error" type="error" @retry="loadFavorites" />
      <EmptyState v-else-if="!loading" description="还没有收藏任何商品">
        <el-button type="primary" @click="router.push('/search')">去挑几件</el-button>
      </EmptyState>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import GoodsCard from '@/components/before/GoodsCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { getFavoriteListApi, toggleFavoriteApi } from '@/api/before/order'
import { useCartStore } from '@/store/modules/cart'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(true)
const list = ref([])
/** 加载失败时的错误对象 */
const error = ref(null)

/** 加载收藏列表（转成商品数组） */
async function loadFavorites() {
  loading.value = true
  error.value = null
  try {
    const data = await getFavoriteListApi()
    list.value = (data || []).map((item) => item.goods).filter(Boolean)
  } catch (err) {
    list.value = []
    error.value = err
  } finally {
    loading.value = false
  }
}

/**
 * 取消收藏
 * @param {object} goods 商品
 * @returns {Promise<void>}
 */
async function onUnfavorite(goods) {
  try {
    await toggleFavoriteApi(goods.id)
    ElMessage.success('已取消收藏')
    await loadFavorites()
  } catch {
    // 失败提示由 request.js 统一处理
  }
}

/**
 * 加入购物车
 * @param {object} goods 商品
 * @returns {void}
 */
function onAddCart(goods) {
  cartStore.addItem(goods, 1)
  ElMessage.success('已加入购物车')
}

onMounted(loadFavorites)
</script>

<style scoped lang="scss">
.favorite {
  display: flex;
  flex-direction: column;
  gap: $space-4;

  &__body {
    min-height: 160px;
  }

  // 与首页 / 搜索页共用同一套网格节奏（4 列 / 20px / 4:3 封面）
  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-5;
    align-items: stretch;
  }
}

@include respond-below('lg') {
  .favorite__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@include respond-below('md') {
  .favorite__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@include respond-below('sm') {
  .favorite__grid {
    gap: $space-3;
  }
}
</style>
