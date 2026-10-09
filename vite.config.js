/**
 * Vite 构建配置
 * 职责：路径别名、Vue 插件、Element Plus 按需引入、开发期 Mock 中间件
 */
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { mockServerPlugin } from './build/mock-server-plugin.js'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const useMock = env.VITE_USE_MOCK === 'true'

  return {
    plugins: [
      vue(),

      // Element Plus 与 Vue API 自动按需引入
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      }),

      // 开发期 Mock（仅 dev 且 VITE_USE_MOCK=true 时生效）
      // 使用自研中间件：直接以 Node ESM 动态 import 加载 mock 模块，
      // 无临时文件、无删除动作，可安全热重载（见 build/mock-server-plugin.js）
      // 约定：mockPath 目录下每个 .js 默认导出 MockMethod 数组；
      // 共享数据层（db.js / helpers.js）必须放在该目录之外（见 src/mock/）
      mockServerPlugin({
        mockPath: 'src/mock/modules',
        enabled: command === 'serve' && useMock
      })
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    css: {
      preprocessorOptions: {
        scss: {
          // 使用 Dart Sass 现代 API，避免 legacy-js-api 弃用警告
          api: 'modern-compiler'
        }
      }
    },

    server: {
      host: '127.0.0.1',
      port: 5173,
      // 不自动打开浏览器，启动后手动访问终端提示的地址
      open: false
    }
  }
})
