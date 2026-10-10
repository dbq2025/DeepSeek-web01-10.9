/**
 * Mock 内存数据库（单例容器）
 * 职责：持有全局唯一的模拟数据库，供各 mock 模块读写
 *
 * 设计说明（重要）：
 * 1. mock 模块由 build/mock-server-plugin.js 用 Node 原生 ESM 动态 import 加载，
 *    热重载时会带 ?t= 时间戳重新导入、得到全新模块实例，
 *    因此共享数据必须挂 globalThis 单例，保证所有接口读写同一份数据。
 * 2. Mock 运行在 Node（Vite dev server）进程内，没有 localStorage；
 *    数据存活于 dev server 进程，浏览器刷新不丢，重启 dev server 才重置为种子数据。
 * 3. 本文件只负责「容器 + 单例」：种子数据构成见 seed.js，占位图生成见 svg.js。
 *
 * 注意：本文件及其依赖（seed.js / svg.js / helpers.js）都位于 mockPath（src/mock/modules）
 *      之外，不会被 Mock 中间件当作接口文件加载。
 */
import { createSeed } from './seed.js'

/** globalThis 上的数据库键名 */
const GLOBAL_KEY = '__ECOM_MOCK_DB__'

/**
 * 获取（或初始化）全局唯一的模拟数据库
 * @returns {object} 模拟数据库
 */
export function getDb() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = createSeed()
  }
  return globalThis[GLOBAL_KEY]
}
