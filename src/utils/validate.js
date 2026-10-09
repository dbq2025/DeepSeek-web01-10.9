/**
 * 校验规则
 * 职责：集中维护 Element Plus 表单校验规则，避免各页面重复造轮子
 */

/** 用户名规则：4-16 位字母数字下划线 */
export const USERNAME_RULE = {
  pattern: /^[a-zA-Z0-9_]{4,16}$/,
  message: '用户名为 4-16 位字母、数字或下划线',
  trigger: 'blur'
}

/** 密码规则：6-20 位，不含空格 */
export const PASSWORD_RULE = {
  pattern: /^\S{6,20}$/,
  message: '密码为 6-20 位且不含空格',
  trigger: 'blur'
}

/** 手机号规则 */
export const PHONE_RULE = {
  pattern: /^1[3-9]\d{9}$/,
  message: '请输入正确的手机号',
  trigger: 'blur'
}

/**
 * 生成必填规则
 * @param {string} label 字段中文名
 * @param {string} [trigger='blur'] 触发方式
 * @returns {object} Element Plus 校验规则
 */
export function required(label, trigger = 'blur') {
  return { required: true, message: `请输入${label}`, trigger }
}

/**
 * 生成下拉必选规则
 * @param {string} label 字段中文名
 * @returns {object}
 */
export function requiredSelect(label) {
  return { required: true, message: `请选择${label}`, trigger: 'change' }
}

/**
 * 生成金额规则（大于 0 的数值）
 * @param {string} [label='金额'] 字段中文名
 * @returns {object}
 */
export function positiveNumber(label = '金额') {
  return {
    validator: (rule, value, callback) => {
      const num = Number(value)
      if (value === '' || value === null || value === undefined) {
        callback(new Error(`请输入${label}`))
      } else if (Number.isNaN(num) || num <= 0) {
        callback(new Error(`${label}必须大于 0`))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
}

/**
 * 生成非负整数规则
 * @param {string} [label='数量'] 字段中文名
 * @returns {object}
 */
export function nonNegativeInteger(label = '数量') {
  return {
    validator: (rule, value, callback) => {
      const num = Number(value)
      if (value === '' || value === null || value === undefined) {
        callback(new Error(`请输入${label}`))
      } else if (!Number.isInteger(num) || num < 0) {
        callback(new Error(`${label}必须为不小于 0 的整数`))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }
}
