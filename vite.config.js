/**
 * Vite 构建配置
 * 职责：路径别名、Vue 插件、Element Plus 全局注册、开发期 Mock 中间件、SCSS 全局注入
 */
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mockServerPlugin } from './build/mock-server-plugin.js'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const useMock = env.VITE_USE_MOCK === 'true'

  return {
    plugins: [
      vue(),

      // ── 不使用任何编译期自动导入 ────────────────────────────────────────
      // 曾配置过 unplugin-auto-import（imports: ['vue','vue-router','pinia']），但全项目仍是
      // 显式 import，插件从未生效。显式导入可读性更好、也让依赖图保持恒定 ——
      // 而依赖图一旦变化就会触发 Vite 重新预构建，进而清理 .vite/deps 缓存目录。

      // ── Element Plus 采用「全量注册 + 全局样式」而非按需引入 ──────────────
      // 原因：main.js 里 app.use(ElementPlus) 本身就会把整个组件库打进产物，
      // 按需解析器（unplugin-vue-components + ElementPlusResolver）只是额外
      // 为每个用到的组件再注入一份 style/css —— 既与全局 index.css 重复，
      // 又会让 Vite 依赖预构建不断发现新依赖、反复触发重新预构建（实测会因
      // 清理缓存目录被安全策略拦截而直接崩掉 dev server）。
      // 故此处只保留全局注册方案，依赖图恒定，dev server 不再抖动。

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
          api: 'modern-compiler',
          // 让每个组件的 <style lang="scss"> 无需重复 @use 即可直接使用设计变量与 mixin
          // （CLAUDE.md 第 7 章要求「禁止硬编码色值」「媒体查询用 mixin 封装」，
          //   若靠各文件手写 @use 容易漏写，故在此统一注入）
          additionalData: '@use "variables" as *;\n@use "mixins" as *;\n',
          // additionalData 里的裸文件名靠 loadPaths 定位，避免依赖 SCSS 无法解析的 @ 别名
          loadPaths: [fileURLToPath(new URL('./src/assets/styles', import.meta.url))]
        }
      }
    },

    server: {
      host: '127.0.0.1',
      port: 5173,
      // 不自动打开浏览器，启动后手动访问终端提示的地址
      open: false
    },

    build: {
      // 拆包策略：把体积大且更新频率低的第三方库单独成 chunk，
      // 避免它们与业务代码混在一个文件里导致「改一行业务代码就让用户重下 1MB」。
      // 说明：Element Plus 采用全量注册（见上方插件区注释），其 chunk 本身就在 1MB 量级，
      //      属既定选型而非配置问题，故把告警阈值调整到与之匹配，避免无意义的告警噪音。
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
            'vendor-element-plus': ['element-plus', '@element-plus/icons-vue'],
            'vendor-echarts': ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers']
          }
        }
      }
    }
  }
})
