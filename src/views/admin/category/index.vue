<!--
  商品类型管理页
  职责：类型列表（名称筛选 + 分页）+ 新增 / 编辑弹窗 + 删除二次确认
  说明：删除会命中 mock 端的业务规则（类型下仍有商品则拒绝删除），
       失败提示由 api/request.js 统一弹出，页面只负责在成功后刷新
-->
<template>
  <div class="category">
    <SearchForm
      :model-value="query"
      :fields="searchFields"
      :loading="loading"
      @search="search"
      @reset="reset"
    >
      <el-button type="primary" @click="openForm()">新增类型</el-button>
    </SearchForm>

    <section class="category__panel">
      <DataTable :columns="columns" :data="list" :loading="loading" show-index>
        <template #empty>
          <EmptyState v-if="error" type="error" @retry="load" />
          <EmptyState v-else description="暂无商品类型" />
        </template>

        <template #action="{ row }">
          <el-button link type="primary" @click="openForm(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </DataTable>

      <Pagination
        :page="query.page"
        :page-size="query.pageSize"
        :total="total"
        @page-change="changePage"
        @size-change="changeSize"
      />
    </section>

    <FormDialog
      v-model="visible"
      :title="title"
      :model="form"
      :rules="rules"
      :loading="saving"
      @confirm="onSave"
    >
      <el-form-item label="类型名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入类型名称" maxlength="20" show-word-limit />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="form.sort" :min="1" :step="1" />
        <span class="category__field-tip">数字越小越靠前</span>
      </el-form-item>
    </FormDialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/common/SearchForm.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import FormDialog from '@/components/common/FormDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { useCategoryStore } from '@/store/modules/category'
import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi
} from '@/api/admin/category'
import { nonNegativeInteger, required } from '@/utils/validate'

const categoryStore = useCategoryStore()

const { loading, error, list, total, query, load, search, reset, changePage, changeSize } =
  useTable(getCategoryListApi, { defaultQuery: { name: '' }, pageSize: 10 })

// 重命名为 editingRow：避免与 <template #action="{ row }"> 的插槽作用域变量同名（vue/no-template-shadow）
const { visible, isEdit, row: editingRow, title, open, close } = useDialog('商品类型')

const saving = ref(false)
const form = reactive({ name: '', sort: 1 })
const rules = {
  name: [required('类型名称')],
  sort: [nonNegativeInteger('排序')]
}

const searchFields = [{ prop: 'name', label: '类型名称' }]

const columns = [
  { prop: 'id', label: 'ID', width: 90 },
  { prop: 'name', label: '类型名称', minWidth: 160 },
  { prop: 'sort', label: '排序', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', type: 'date', width: 180 },
  { label: '操作', type: 'action', width: 140, align: 'center', fixed: 'right' }
]

/**
 * 打开新增 / 编辑弹窗
 * @param {object|null} [payload=null] 编辑时传行数据，新增时留空
 * @returns {void}
 */
function openForm(payload = null) {
  Object.assign(form, { name: payload?.name || '', sort: payload?.sort ?? 1 })
  open(payload)
}

/** 保存：新增 / 修改共用，成功后刷新列表并让类型缓存失效 */
async function onSave() {
  saving.value = true
  try {
    if (isEdit.value && editingRow.value) {
      await updateCategoryApi({ ...form, id: editingRow.value.id })
      ElMessage.success('修改成功')
    } else {
      await createCategoryApi({ ...form })
      ElMessage.success('新增成功')
    }
    close()
    categoryStore.reset()
    await load()
  } catch {
    // 失败提示已由 request.js 统一处理（如「该类型名称已存在」）
  } finally {
    saving.value = false
  }
}

/**
 * 删除类型（二次确认）
 * @param {object} target 行数据
 * @returns {Promise<void>}
 */
async function onDelete(target) {
  try {
    await ElMessageBox.confirm(`确定删除类型「${target.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
  } catch {
    return // 用户取消
  }

  try {
    await deleteCategoryApi(target.id)
    ElMessage.success('删除成功')
    categoryStore.reset()
    await load()
  } catch {
    // 失败提示已由 request.js 统一处理（如「该类型下仍有商品，无法删除」）
  }
}
</script>

<style scoped lang="scss">
.category {
  &__panel {
    @include card-surface;

    padding: 16px 16px 8px;
  }

  &__field-tip {
    margin-left: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>
