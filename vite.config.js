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
import { viteMockServe } from 'vite-plugin-mock'

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
      viteMockServe({
        mockPath: 'src/mock',
        enable: command === 'serve' && useMock,
        logger: true
      })
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
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
