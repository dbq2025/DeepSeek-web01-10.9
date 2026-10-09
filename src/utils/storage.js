/**
 * localStorage 封装
 * 职责：统一前缀、JSON 序列化、异常兜底（隐私模式 / 容量超限时不抛错）
 */

const PREFIX = 'ecom_'

/**
 * 拼接带前缀的完整 key
 * @param {string} key 业务 key
 * @returns {string}
 */
function fullKey(key) {
  return `${PREFIX}${key}`
}

/**
 * 读取并反序列化
 * @param {string} key 业务 key
 * @param {*} [defaultValue=null] 读取失败时的默认值
 * @returns {*}
 */
export function getItem(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(fullKey(key))
    if (raw === null) return defaultValue
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`[storage] 读取 ${key} 失败:`, error)
    return defaultValue
  }
}

/**
 * 序列化并写入
 * @param {string} key 业务 key
 * @param {*} value 待存储的值
 * @returns {boolean} 是否写入成功
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[storage] 写入 ${key} 失败:`, error)
    return false
  }
}

/**
 * 删除指定 key
 * @param {string} key 业务 key
 * @returns {void}
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(fullKey(key))
  } catch (error) {
    console.warn(`[storage] 删除 ${key} 失败:`, error)
  }
}

/**
 * 清空本应用写入的所有缓存
 * @returns {void}
 */
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch (error) {
    console.warn('[storage] 清空失败:', error)
  }
}
