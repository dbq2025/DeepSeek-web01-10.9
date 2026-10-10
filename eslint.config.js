/**
 * ESLint 扁平配置（Flat Config，ESLint 9）
 * 职责：静态检查 JS 与 Vue SFC；格式化交给 Prettier，两者不重叠（末尾 prettierConfig 关闭冲突规则）
 * 运行：npm run lint
 */
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'docs/**', 'coverage/**']
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // 必须放在最后：关闭所有与 Prettier 冲突的格式化规则，避免「lint 报错 = 格式差异」
  prettierConfig,

  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // 本项目页面文件统一用 index.vue / 404.vue，无法满足多词组件名要求
      'vue/multi-word-component-names': 'off',
      // 允许以 _ 开头的未使用参数（如解构排除字段）
      // ignoreRestSiblings: 允许 `const { password, ...rest } = user` 这种「解构排除敏感字段」写法
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }
      ],
      // 模板中允许使用 v-html（本项目未用于渲染用户输入，风险可控）
      'vue/no-v-html': 'off',
      // 允许在模板中使用 v-for 的 index（静态列表场景）
      'vue/require-v-for-key': 'error'
    }
  },

  // 构建脚本运行在 Node 环境，允许使用 console 等
  {
    files: ['build/**/*.js', 'vite.config.js'],
    rules: {
      'no-console': 'off'
    }
  }
]
