/**
 * 弹窗表单通用逻辑（组合函数）
 * 职责：统一「新增 / 编辑」弹窗的显隐、当前行数据、标题
 * 用法：
 *   const { visible, isEdit, row, title, open, close } = useDialog('商品类型')
 */
import { ref, computed } from 'vue'

/**
 * @param {string} [label='数据'] 业务名称，用于生成弹窗标题
 * @returns {object} 弹窗状态与操作方法
 */
export function useDialog(label = '数据') {
  const visible = ref(false)
  const isEdit = ref(false)
  /** 当前操作的行数据（编辑时非空） */
  const row = ref(null)

  /** 弹窗标题 */
  const title = computed(() => (isEdit.value ? `编辑${label}` : `新增${label}`))

  /**
   * 打开弹窗
   * @param {object|null} [payload=null] 编辑时传入行数据，新增时留空
   */
  function open(payload = null) {
    row.value = payload
    isEdit.value = !!payload
    visible.value = true
  }

  /** 关闭弹窗并清理行数据 */
  function close() {
    visible.value = false
    row.value = null
    isEdit.value = false
  }

  return { visible, isEdit, row, title, open, close }
}
