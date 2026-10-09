/**
 * 文件处理工具
 * 职责：图片类型/大小校验、本地文件转 DataURL（供上传组件在无后端时预览）
 */

/** 图片 MIME 前缀 */
const IMAGE_MIME_PREFIX = 'image/'

/**
 * 判断是否为图片文件
 * @param {File} file 文件对象
 * @returns {boolean}
 */
export function isImageFile(file) {
  return !!file && typeof file.type === 'string' && file.type.startsWith(IMAGE_MIME_PREFIX)
}

/**
 * 校验图片文件（类型 + 体积）
 * @param {File} file 文件对象
 * @param {number} [maxSizeMB=2] 允许的最大体积（MB）
 * @returns {{ valid: boolean, message: string }} 校验结果，valid 为 false 时 message 说明原因
 */
export function validateImageFile(file, maxSizeMB = 2) {
  if (!file) return { valid: false, message: '请选择图片文件' }
  if (!isImageFile(file)) return { valid: false, message: '只能上传图片格式的文件' }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, message: `图片大小不能超过 ${maxSizeMB} MB` }
  }
  return { valid: true, message: '' }
}

/**
 * 把本地文件读成 DataURL（base64）
 * @param {File} file 文件对象
 * @returns {Promise<string>} DataURL 字符串
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取本地文件失败'))
    reader.readAsDataURL(file)
  })
}
