<!--
  通用分页
  职责：包裹 el-pagination，对外只暴露 page-change / size-change 两个事件，
       页面可直接接到 useTable 的 changePage / changeSize，无需关心内部细节
  用法：
    <Pagination :page="query.page" :page-size="query.pageSize" :total="total"
      @page-change="changePage" @size-change="changeSize" />
-->
<template>
  <div class="pagination">
    <el-pagination
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      :page-sizes="pageSizes"
      :layout="layout"
      :background="background"
      :disabled="disabled"
      @current-change="onPageChange"
      @size-change="onSizeChange"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  /** 当前页码 @type {number} */
  page: { type: Number, default: 1 },
  /** 每页条数 @type {number} */
  pageSize: { type: Number, default: 10 },
  /** 总条数 @type {number} */
  total: { type: Number, default: 0 },
  /** 可选每页条数 @type {Array<number>} */
  pageSizes: { type: Array, default: () => [10, 20, 50] },
  /** 分页布局 @type {string} */
  layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  /** 是否使用背景色按钮 @type {boolean} */
  background: { type: Boolean, default: true },
  /** 是否禁用 @type {boolean} */
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['page-change', 'size-change'])

/**
 * 页码变化
 * 注意：改每页条数时 el-pagination 可能连带触发 current-change，
 * 此处用「与当前 prop 相同则忽略」挡住，避免重复请求接口
 * @param {number} page 新页码
 */
function onPageChange(page) {
  if (page === props.page) return
  emit('page-change', page)
}

/**
 * 每页条数变化
 * 注意：page 的重置由 useTable.changeSize 内部完成，此处不重复 emit 页码
 * @param {number} size 新每页条数
 */
function onSizeChange(size) {
  if (size === props.pageSize) return
  emit('size-change', size)
}
</script>

<style scoped lang="scss">
.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
</style>
