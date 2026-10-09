<!--
  商品新增 / 编辑页（两个路由共用同一组件）
  职责：由路由 props.id 决定「新增」还是「编辑」，同一套表单与校验
  说明：保存成功后返回列表页；列表页会从 goodsStore.adminQuery 恢复原筛选条件，上下文不丢
-->
<template>
  <div class="goods-edit">
    <el-page-header class="goods-edit__header" @back="goBack">
      <template #content>
        <span class="goods-edit__title">{{ isEdit ? '编辑商品' : '新增商品' }}</span>
      </template>
    </el-page-header>

    <section class="goods-edit__panel">
      <el-form
        ref="formRef"
        v-loading="loading"
        class="goods-edit__form"
        :model="form"
        :rules="rules"
        label-width="96px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入商品名称"
            maxlength="60"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="商品类型" prop="categoryId">
          <el-select v-model="form.categoryId" class="goods-edit__field" placeholder="请选择商品类型">
            <el-option
              v-for="opt in categoryStore.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="10" />
          <span class="goods-edit__field-tip">单位：元</span>
        </el-form-item>

        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" />
          <span class="goods-edit__field-tip">单位：件</span>
        </el-form-item>

        <el-form-item label="上架状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="GOODS_STATUS.ON"
            :inactive-value="GOODS_STATUS.OFF"
            inline-prompt
            active-text="上架"
            inactive-text="下架"
          />
        </el-form-item>

        <el-form-item label="商品图片" prop="cover">
          <ImageUpload
            v-model="form.cover"
            tip="支持 jpg / png，2MB 以内，建议使用正方形图片"
            :upload-fn="uploadCover"
          />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入商品描述"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSubmit">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ImageUpload from '@/components/common/ImageUpload.vue'
import { useCategoryStore } from '@/store/modules/category'
import {
  createGoodsApi,
  getGoodsDetailApi,
  updateGoodsApi,
  uploadGoodsImageApi
} from '@/api/admin/goods'
import { GOODS_STATUS } from '@/utils/constants'
import { nonNegativeInteger, positiveNumber, required, requiredSelect } from '@/utils/validate'
import { readFileAsDataURL } from '@/utils/file'

const props = defineProps({
  /** 路由参数 id：编辑态有值，新增态为空 @type {string|number} */
  id: { type: [String, Number], default: '' }
})

const router = useRouter()
const categoryStore = useCategoryStore()

const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const isEdit = computed(() => !!props.id)

const form = reactive({
  name: '',
  categoryId: '',
  price: 0,
  stock: 0,
  status: GOODS_STATUS.ON,
  cover: '',
  description: ''
})

const rules = {
  name: [required('商品名称')],
  categoryId: [requiredSelect('商品类型')],
  price: [positiveNumber('价格')],
  stock: [nonNegativeInteger('库存')]
}

/** 返回列表页（筛选条件保存在 goodsStore，无需在此传参） */
function goBack() {
  router.push('/admin/goods')
}

/** 编辑态：加载商品详情回填表单 */
async function loadDetail() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const detail = await getGoodsDetailApi(props.id)
    Object.assign(form, {
      name: detail.name,
      categoryId: detail.categoryId,
      price: detail.price,
      stock: detail.stock,
      status: detail.status,
      cover: detail.cover,
      description: detail.description
    })
  } catch (error) {
    // 失败提示已由 request.js 统一处理
  } finally {
    loading.value = false
  }
}

/** 提交保存：新增 / 编辑共用 */
async function onSubmit() {
  if (!formRef.value || saving.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await updateGoodsApi({ ...form, id: Number(props.id) })
      ElMessage.success('保存成功')
    } else {
      await createGoodsApi({ ...form })
      ElMessage.success('新增成功')
    }
    goBack()
  } catch (error) {
    // 失败提示已由 request.js 统一处理
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

onMounted(() => {
  categoryStore.fetchAll()
  loadDetail()
})
</script>

<style scoped lang="scss">
.goods-edit {
  &__header {
    margin-bottom: 16px;
  }

  &__title {
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 500;
  }

  &__panel {
    @include card-surface;

    padding: 24px 24px 8px;
  }

  &__form {
    max-width: 620px;
  }

  &__field {
    width: 100%;
  }

  &__field-tip {
    margin-left: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}
</style>
