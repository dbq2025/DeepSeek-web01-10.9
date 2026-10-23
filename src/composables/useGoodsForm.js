/**
 * 商品表单逻辑（新增 / 编辑共用）
 * 职责：表单状态、校验规则、详情回填、图片上传与提交保存
 * 说明：从 goods/edit.vue 抽出的组合函数，让页面只保留模板与「返回列表」，
 *      同时保证单文件 ≤ 300 行；接口契约与改造前完全一致
 */
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createGoodsApi,
  getGoodsDetailApi,
  updateGoodsApi,
  uploadGoodsImageApi
} from '@/api/admin/goods'
import { GOODS_STATUS } from '@/utils/constants'
import { nonNegativeInteger, positiveNumber, required, requiredSelect } from '@/utils/validate'
import { readFileAsDataURL } from '@/utils/file'

/**
 * @param {object} props 页面 props（含路由注入的 id）
 * @param {object} formRef 表单实例 ref
 * @param {() => void} onSaved 保存成功后的回调（通常是返回列表）
 * @returns {object} 表单状态与方法
 */
export function useGoodsForm(props, formRef, onSaved) {
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
      onSaved()
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

  return { loading, saving, isEdit, form, rules, loadDetail, onSubmit, uploadCover }
}
