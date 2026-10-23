<!--
  通用图片上传
  职责：选择本地图片 → 校验类型与体积 → 交给 uploadFn 上传（未注入时回退为本地 base64 预览）
  说明：组件不直接 import 具体 api 模块，上传能力由页面通过 uploadFn 注入，
       这样同一组件既能服务后台「商品图片」，也能服务前台「头像」等不同接口
  用法：
    <ImageUpload v-model="form.cover" tip="建议 800x800，2MB 以内" :upload-fn="doUpload" />
    // doUpload = async (file) => { const base64 = await readFileAsDataURL(file); return (await uploadGoodsImageApi(base64)).url }
-->
<template>
  <div class="image-upload">
    <el-upload
      :show-file-list="false"
      :auto-upload="false"
      action="#"
      accept="image/*"
      :disabled="disabled || uploading"
      :on-change="onFileChange"
    >
      <div class="image-upload__box" :style="boxStyle">
        <img v-if="modelValue" class="image-upload__image" :src="modelValue" alt="已选图片" />
        <div v-else class="image-upload__placeholder">
          <el-icon class="image-upload__icon"><Plus /></el-icon>
          <span>{{ uploading ? '处理中…' : '点击上传' }}</span>
        </div>
      </div>
    </el-upload>

    <p v-if="tip" class="image-upload__tip">{{ tip }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { readFileAsDataURL, validateImageFile } from '@/utils/file'

const props = defineProps({
  /** 图片地址（v-model），后端返回的 URL 或本地 base64 均可 @type {string} */
  modelValue: { type: String, default: '' },
  /** 预览框宽度 @type {string} */
  width: { type: String, default: '148px' },
  /** 预览框高度 @type {string} */
  height: { type: String, default: '148px' },
  /** 预览框下方提示文案 @type {string} */
  tip: { type: String, default: '' },
  /** 允许的最大体积（MB） @type {number} */
  maxSize: { type: Number, default: 2 },
  /** 是否禁用 @type {boolean} */
  disabled: { type: Boolean, default: false },
  /**
   * 自定义上传函数，返回图片地址；未注入时使用本地 base64 预览
   * @type {((file: File) => Promise<string>) | null}
   */
  uploadFn: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue', 'success', 'error'])

/** 是否正在处理（读取 / 上传） */
const uploading = ref(false)

/** 预览框尺寸：来自 props 的动态尺寸，允许内联 style（CLAUDE.md 第 7 章例外条款） */
const boxStyle = computed(() => ({ width: props.width, height: props.height }))

/**
 * 选择文件后的处理链路：校验 → 上传（或本地转 base64）→ 回写 v-model
 * @param {{ raw: File }} uploadFile el-upload 的 change 回调参数
 * @returns {Promise<void>}
 */
async function onFileChange(uploadFile) {
  const file = uploadFile?.raw
  const { valid, message } = validateImageFile(file, props.maxSize)
  if (!valid) {
    ElMessage.error(message)
    return
  }

  uploading.value = true
  try {
    const url = props.uploadFn ? await props.uploadFn(file) : await readFileAsDataURL(file)
    emit('update:modelValue', url)
    emit('success', url)
  } catch (error) {
    emit('error', error)
    ElMessage.error(error?.message || '图片上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped lang="scss">
.image-upload {
  display: inline-block;

  &__box {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    background: var(--app-bg-subtle);
    border: 1px dashed var(--app-border-strong);
    border-radius: 6px;
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--app-text-3);
    font-size: 12px;
  }

  &__icon {
    font-size: 22px;
  }

  &__tip {
    margin: 6px 0 0;
    color: var(--app-text-3);
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
