<!--
  通用数据表格
  职责：由 columns 配置驱动渲染列（内置 money / date / tag / image / action 五种常用列类型），
       统一 loading、空状态、多选列与序号列，并通过动态插槽开放完全自定义
  插槽：
    - #col-<prop>  自定义某个字段的单元格，作用域参数 { row, column, $index }
    - #action      操作列，配合 columns 中 type: 'action' 的列使用
  用法：
    <DataTable :columns="columns" :data="list" :loading="loading" show-index>
      <template #col-name="{ row }">...</template>
      <template #action="{ row }"><el-button link @click="edit(row)">编辑</el-button></template>
    </DataTable>
-->
<template>
  <el-table
    v-loading="loading"
    class="data-table"
    :data="data"
    :row-key="rowKey"
    :stripe="stripe"
    :border="border"
    :height="height"
    @selection-change="emit('selection-change', $event)"
    @row-click="onRowClick"
  >
    <el-table-column v-if="showSelection" type="selection" width="48" align="center" />
    <el-table-column v-if="showIndex" type="index" label="序号" width="64" align="center" />

    <el-table-column
      v-for="col in columns"
      :key="col.prop || col.label"
      :prop="col.prop"
      :label="col.label"
      :width="col.width"
      :min-width="col.minWidth"
      :align="col.align || 'left'"
      :fixed="col.fixed"
      :sortable="col.sortable"
      :show-overflow-tooltip="col.showOverflowTooltip"
    >
      <template #default="scope">
        <slot v-if="col.type === 'action'" name="action" v-bind="scope" />
        <slot v-else-if="hasColumnSlot(col)" :name="`col-${col.prop}`" v-bind="scope" />
        <StatusTag
          v-else-if="col.type === 'tag'"
          :kind="col.tagKind || 'order'"
          :status="scope.row[col.prop]"
        />
        <template v-else-if="col.type === 'image'">
          <el-image
            v-if="scope.row[col.prop]"
            class="data-table__thumb"
            :src="scope.row[col.prop]"
            :preview-src-list="[scope.row[col.prop]]"
            fit="cover"
            preview-teleported
          />
          <span v-else class="data-table__muted">无图</span>
        </template>
        <span v-else>{{ cellText(col, scope.row) }}</span>
      </template>
    </el-table-column>

    <template #empty>
      <EmptyState :description="emptyText" />
    </template>
  </el-table>
</template>

<script setup>
import { useSlots } from 'vue'
import EmptyState from './EmptyState.vue'
import StatusTag from './StatusTag.vue'
import { formatDate, formatMoney } from '@/utils/format'

defineProps({
  /**
   * 列配置
   * @type {Array<{prop:string,label:string,type?:'money'|'date'|'tag'|'image'|'action',tagKind?:'order'|'goods',width?:string|number,minWidth?:string|number,align?:'left'|'center'|'right',fixed?:boolean|'left'|'right',sortable?:boolean,showOverflowTooltip?:boolean,formatter?:(row:object)=>string}>}
   */
  columns: { type: Array, default: () => [] },
  /** 表格数据 @type {Array<object>} */
  data: { type: Array, default: () => [] },
  /** 是否加载中 @type {boolean} */
  loading: { type: Boolean, default: false },
  /** 行唯一键字段名（用于多选 / 展开状态保持） @type {string} */
  rowKey: { type: String, default: 'id' },
  /** 是否显示多选列 @type {boolean} */
  showSelection: { type: Boolean, default: false },
  /** 是否显示序号列 @type {boolean} */
  showIndex: { type: Boolean, default: false },
  /** 是否斑马纹 @type {boolean} */
  stripe: { type: Boolean, default: true },
  /** 是否显示纵向边框 @type {boolean} */
  border: { type: Boolean, default: false },
  /** 表格固定高度，不传则随内容撑开 @type {string|number|undefined} */
  height: { type: [String, Number], default: undefined },
  /** 空数据文案 @type {string} */
  emptyText: { type: String, default: '暂无数据' }
})

const emit = defineEmits(['selection-change', 'row-click'])

const slots = useSlots()

/**
 * 判断父组件是否为该列提供了自定义插槽（命名规则：col-<prop>）
 * v-if 中不写模板字符串，抽到方法便于阅读与复用
 * @param {object} col 列配置
 * @returns {boolean}
 */
function hasColumnSlot(col) {
  return !!col.prop && !!slots[`col-${col.prop}`]
}

/**
 * 行点击：原样透传 el-table 的三个参数，避免调用方拿到残缺信息
 * @param {object} row 行数据
 * @param {object} column 列实例
 * @param {Event} event 原生事件
 */
function onRowClick(row, column, event) {
  emit('row-click', row, column, event)
}

/**
 * 单元格默认展示文本
 * @param {object} col 列配置
 * @param {object} row 行数据
 * @returns {string}
 */
function cellText(col, row) {
  if (typeof col.formatter === 'function') return col.formatter(row)
  const value = row[col.prop]
  if (value === null || value === undefined || value === '') return '-'
  if (col.type === 'money') return formatMoney(value)
  if (col.type === 'date') return formatDate(value)
  return String(value)
}
</script>

<style scoped lang="scss">
.data-table {
  width: 100%;

  // 表头统一浅色底（用 Element Plus CSS 变量，避免硬编码色值）
  --el-table-header-bg-color: var(--el-fill-color-light);

  &__thumb {
    width: 44px;
    height: 44px;
    border-radius: 4px;
  }

  &__muted {
    color: var(--el-text-color-placeholder);
  }
}
</style>
