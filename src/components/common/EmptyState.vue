<!--
  通用空状态 / 错误状态
  职责：统一列表与页面的「无数据」「加载失败」提示与操作区，避免各页面各写一套 el-empty

  用法一（无数据）：
      <EmptyState description="暂无商品类型">
        <el-button type="primary" @click="open()">新增类型</el-button>
      </EmptyState>

  用法二（加载失败，配合 useTable 返回的 error，内置「重新加载」按钮并 emit retry）：
      <EmptyState v-if="error" type="error" @retry="load" />
-->
<template>
  <div class="empty-state" :style="{ minHeight }">
    <el-empty :description="text" :image-size="imageSize">
      <template v-if="isError" #image>
        <el-icon class="empty-state__icon" :size="Math.round(imageSize * 0.72)">
          <WarningFilled />
        </el-icon>
      </template>

      <slot>
        <el-button v-if="isError" type="primary" @click="emit('retry')">重新加载</el-button>
      </slot>
    </el-empty>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'

const props = defineProps({
  /** 展示类型：empty 无数据 / error 加载失败 @type {'empty'|'error'} */
  type: { type: String, default: 'empty', validator: (v) => ['empty', 'error'].includes(v) },
  /** 描述文案；留空时按 type 取默认文案 @type {string} */
  description: { type: String, default: '' },
  /** 插图尺寸（px） @type {number} */
  imageSize: { type: Number, default: 90 },
  /** 容器最小高度，如 '200px'；用于避免弹窗内空状态过高 @type {string} */
  minHeight: { type: String, default: 'auto' }
})

/** 重新加载（type='error' 时默认提供重试按钮） */
const emit = defineEmits(['retry'])

const isError = computed(() => props.type === 'error')

/** 优先用调用方文案，未传时按类型取默认 */
const text = computed(
  () => props.description || (isError.value ? '数据加载失败，请稍后重试' : '暂无数据')
)
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;

  &__icon {
    color: var(--el-color-warning);
  }
}
</style>
