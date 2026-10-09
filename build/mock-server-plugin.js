/**
 * 自研 Vite Mock 中间件插件
 *
 * 为什么不用 vite-plugin-mock？
 *   它内部用 bundle-require 把每个 mock 文件打包成 `_xxx.bundled_*.mjs` 写到源文件同级目录，
 *   再 require、再**删除**。这在受限环境下有两个硬伤：
 *     1. 打包产物落在被 glob 的目录里，若不排除会随热重载逐轮翻倍；
 *     2. 依赖「删除文件」这一动作，一旦删除被拦截，mock 会整体失效。
 *   本项目改为直接以 Node ESM 动态 import 加载 mock 模块：无临时文件、无删除、可热重载。
 *
 * 约定：
 *   - mockPath 目录下每个 `.js` 文件默认导出 MockMethod 数组；
 *   - MockMethod 形如 { url, method, response({ url, body, query, headers }) }；
 *   - 共享数据层放在 mockPath 之外（如 src/mock/db.js），用 globalThis 挂单例。
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * 读取请求体（JSON 优先，失败则按表单解析）
 * @param {import('node:http').IncomingMessage} req 请求对象
 * @returns {Promise<object>}
 */
function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        const formData = {}
        new URLSearchParams(raw).forEach((value, key) => {
          formData[key] = value
        })
        resolve(formData)
      }
    })
  })
}

/**
 * 构造 Mock 中间件插件
 * @param {object} options 配置
 * @param {string} options.mockPath mock 模块目录（相对项目根）
 * @param {boolean} [options.enabled=true] 是否启用
 * @returns {import('vite').Plugin}
 */
export function mockServerPlugin({ mockPath, enabled = true }) {
  return {
    name: 'local-vite-mock',
    apply: 'serve',

    configureServer(server) {
      const logger = server.config.logger

      if (!enabled) {
        logger.info('[mock] VITE_USE_MOCK=false，Mock 中间件已关闭')
        return
      }

      const absDir = path.resolve(process.cwd(), mockPath)
      if (!fs.existsSync(absDir)) {
        logger.warn(`[mock] 目录不存在：${absDir}`)
        return
      }

      /** @type {Array|null} 已加载的接口定义 */
      let cache = null
      /** @type {Promise|null} 正在进行的加载任务（避免并发重复加载） */
      let loading = null

      /**
       * 加载 mock 目录下的全部接口定义
       * @returns {Promise<Array>}
       */
      async function load() {
        const files = fs
          .readdirSync(absDir)
          .filter((file) => file.endsWith('.js') && !file.startsWith('_'))
        const items = []
        for (const file of files) {
          // 带时间戳查询串，绕过 Node ESM 模块缓存，实现热重载
          const fileUrl = `${pathToFileURL(path.join(absDir, file)).href}?t=${Date.now()}`
          const mod = await import(fileUrl)
          if (Array.isArray(mod.default)) {
            items.push(...mod.default)
          } else {
            logger.warn(`[mock] ${file} 未默认导出数组，已跳过`)
          }
        }
        cache = items
        logger.info(`[mock] 已加载 ${files.length} 个模块 / ${items.length} 个接口`)
        return items
      }

      /**
       * 确保已加载
       * @returns {Promise<Array>}
       */
      function ensureLoaded() {
        if (cache) return Promise.resolve(cache)
        if (!loading) {
          loading = load().finally(() => {
            loading = null
          })
        }
        return loading
      }

      // 启动时预热一次（不阻塞 Vite 启动）
      ensureLoaded().catch((error) => logger.error(`[mock] 初始加载失败：${error.message}`))

      // 监听 mock 文件变化，自动失效缓存
      server.watcher.add(absDir)
      server.watcher.on('all', (event, file) => {
        if (typeof file === 'string' && file.startsWith(absDir) && !path.basename(file).startsWith('_')) {
          cache = null
          logger.info(`[mock] 检测到 ${path.basename(file)} 变化，缓存已失效，下次请求重新加载`)
        }
      })

      // 注册接口中间件（需早于 Vite 的 SPA 回退）
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || ''
        if (!rawUrl.startsWith('/api/')) return next()

        let items
        try {
          items = await ensureLoaded()
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json;charset=utf-8')
          res.end(JSON.stringify({ code: 500, message: `Mock 加载失败：${error.message}`, data: null }))
          return
        }

        const [pathname, search = ''] = rawUrl.split('?')
        const query = Object.fromEntries(new URLSearchParams(search))
        const method = (req.method || 'GET').toLowerCase()

        const matched = items.find(
          (item) =>
            item &&
            item.url === pathname &&
            String(item.method || 'get').toLowerCase() === method
        )

        if (!matched) return next()

        const body = await readBody(req)
        logger.info(`[mock] ${method.toUpperCase()} ${rawUrl}`)

        try {
          const result =
            typeof matched.response === 'function'
              ? await matched.response({ url: rawUrl, body, query, headers: req.headers })
              : matched.response

          // response 可返回 null 表示已自行处理响应
          if (result === null || result === undefined) return

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json;charset=utf-8')
          res.end(JSON.stringify(result))
        } catch (error) {
          logger.error(`[mock] ${rawUrl} 处理异常：${error.message}`)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json;charset=utf-8')
          res.end(JSON.stringify({ code: 500, message: error.message, data: null }))
        }
      })
    }
  }
}
