/**
 * Mock 注册入口
 * 说明：使用 vite-plugin-mock，仅 dev + VITE_USE_MOCK=true 时生效
 *       模块中的接口路径需与 api/*.js 保持一致，响应结构符合统一契约
 */
import adminAuth from './modules/admin-auth'
import category from './modules/category'
import goods from './modules/goods'
import order from './modules/order'
import stat from './modules/stat'
import beforeAuth from './modules/before-auth'

// 汇总所有 mock 接口，导出给 vite-plugin-mock 使用
export default [
  ...adminAuth,
  ...category,
  ...goods,
  ...order,
  ...stat,
  ...beforeAuth
]
