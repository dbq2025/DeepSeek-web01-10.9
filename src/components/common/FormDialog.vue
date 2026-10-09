<!--
  通用表单弹窗
  职责：统一「新增 / 编辑」弹窗的标题、宽度、底部按钮与表单校验；
       校验不通过时不触发 confirm 事件，页面的保存逻辑无需再判校验
  插槽：
    - 默认插槽：el-form-item 表单项
    - #footer：需要自定义底部按钮时使用（不写则用内置「取消 / 确定」）
  用法：
    <FormDialog v-model="visible" :title="title" :model="form" :rules="rules"
      :loading="saving" @confirm="onSave">
      <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
    </FormDialog>
  说明：props 刻意控制在 8 个以内（CLAUDE.md 2.3 拆分阈值），
       按钮文案等次要定制交给 #footer 插槽，而非继续堆 props
-->
<template>
  <el-dialog
    class="form-dialog"
    :model-value="modelValue"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
    @closed="emit('closed')"
  >
    <el-form ref="formRef" :model="model" :rules="rules" :label-width="labelWidth">
      <slot />
    </el-form>

    <template #footer>
      <slot name="footer">
        <el-button :disabled="loading" @click="onCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onConfirm">确定</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  /** 弹窗显隐（v-model） @type {boolean} */
  modelValue: { type: Boolean, default: false },
  /** 弹窗标题 @type {string} */
  title: { type: String, default: '' },
  /** 弹窗宽度 @type {string|number} */
  width: { type: [String, Number], default: '520px' },
  /** 表单数据对象（el-form 校验需要） @type {object} */
  model: { type: Object, default: () => ({}) },
  /** 校验规则 @type {object} */
  rules: { type: Object, default: () => ({}) },
  /** 表单标签宽度 @type {string} */
  labelWidth: { type: String, default: '90px' },
  /** 确定按钮 loading（由页面在提交接口期间控制） @type {boolean} */
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'closed'])

/** el-form 实例，用于提交前校验 */
const formRef = ref(null)

/** 取消：通知父组件并关闭弹窗 */
function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

/** 确认：先校验，通过后才通知父组件提交 */
async function onConfirm() {
  if (!formRef.value) {
    emit('confirm')
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    // 校验不通过：保持弹窗打开，让用户修正后重试
    return
  }
  emit('confirm')
}

// 暴露 formRef 的原因：页面在「保存接口失败」等场景下需要手动清除校验提示（clearValidate）
defineExpose({ formRef })
</script>
