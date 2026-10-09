<!--
  演示页子组件：商品表单弹窗
  职责：承载 FormDialog + ImageUpload 的表单状态与保存逻辑，
       使演示页本身不再同时出现「列表 + 弹窗 + 表单」三类关注点（CLAUDE.md 2.3）
  对外通过 ref 暴露 open(payload)：父页面点击「新增 / 编辑」时调用
-->
<template>
  <FormDialog
    :model-value="visible"
    :title="title"
    :model="form"
    :rules="rules"
    :loading="saving"
    width="560px"
    @update:model-value="onVisibleChange"
    @confirm="onSave"
  >
    <el-form-item label="商品名称" prop="name">
      <el-input v-model="form.name" placeholder="请输入商品名称" />
    </el-form-item>
    <el-form-item label="商品类型" prop="categoryId">
      <el-select v-model="form.categoryId" class="goods-form__field" placeholder="请选择商品类型">
        <el-option
          v-for="opt in categoryStore.options"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="价格" prop="price">
      <el-input-number v-model="form.price" :min="0" :precision="2" :step="10" />
    </el-form-item>
    <el-form-item label="库存" prop="stock">
      <el-input-number v-model="form.stock" :min="0" :step="1" />
    </el-form-item>
    <el-form-item label="商品图片" prop="cover">
      <ImageUpload v-model="form.cover" tip="支持 jpg / png，2MB 以内" :upload-fn="uploadCover" />
    </el-form-item>
  </FormDialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import FormDialog from '@/components/common/FormDialog.vue'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { useDialog } from '@/composables/useDialog'
import { useCategoryStore } from '@/store/modules/category'
import { createGoodsApi, updateGoodsApi, uploadGoodsImageApi } from '@/api/admin/goods'
import { GOODS_STATUS } from '@/utils/constants'
import { nonNegativeInteger, positiveNumber, required, requiredSelect } from '@/utils/validate'
import { readFileAsDataURL } from '@/utils/file'

const emit = defineEmits(['saved'])

const categoryStore = useCategoryStore()
const { visible, isEdit, row, title, open, close } = useDialog('商品')

const form = reactive({ name: '', categoryId: '', price: 0, stock: 0, cover: '' })
const saving = ref(false)

const rules = {
  name: [required('商品名称')],
  categoryId: [requiredSelect('商品类型')],
  price: [positiveNumber('价格')],
  stock: [nonNegativeInteger('库存')]
}

/** 父组件通过 v-model 控制显隐时同步内部状态 */
function onVisibleChange(value) {
  if (value) return
  close()
}

/**
 * 打开弹窗
 * @param {object|null} [payload=null] 编辑时传行数据，新增时留空
 */
function openDialog(payload = null) {
  const source = payload || {}
  Object.assign(form, {
    name: source.name || '',
    categoryId: source.categoryId || '',
    price: source.price ?? 0,
    stock: source.stock ?? 0,
    cover: source.cover || ''
  })
  open(payload)
}

/** 保存：新增 / 修改都调用真实 Mock 接口，成功后通知父页面刷新列表 */
async function onSave() {
  saving.value = true
  try {
    if (isEdit.value && row.value) {
      await updateGoodsApi({ ...form, id: row.value.id })
      ElMessage.success('修改成功')
    } else {
      await createGoodsApi({ ...form, status: GOODS_STATUS.ON })
      ElMessage.success('新增成功')
    }
    close()
    emit('saved')
  } finally {
    saving.value = false
  }
}

/**
 * 图片上传（以 uploadFn 注入给 ImageUpload）
 * 说明：纯前端项目先把本地文件转 Base64，再交给 Mock 上传接口回传地址
 * @param {File} file 本地图片
 * @returns {Promise<string>} 图片地址
 */
async function uploadCover(file) {
  const base64 = await readFileAsDataURL(file)
  const data = await uploadGoodsImageApi(base64)
  return data.url
}

// 暴露 open 供父页面调用（新增/编辑共用入口），其余状态由组件内部闭环管理
defineExpose({ open: openDialog })
</script>

<style scoped lang="scss">
.goods-form__field {
  width: 100%;
}
</style>
