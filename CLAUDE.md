# CLAUDE.md —— 电子商务平台前端系统工程规范

> 本文件是本项目的**强制工程规范**，用于统一约束每一个功能模块的代码风格、目录结构与实现方式。
> 所有参与者在新增/修改代码前必须先阅读本文件；提交前须逐条自检。
>
> 项目：电子商务平台前端系统（后台管理端 + 电商前台端）
> 技术栈：Vite + Vue 3（组合式 API + `<script setup>`）+ JavaScript + Element Plus + Vue Router 4 + Pinia + Axios + ECharts + 自研 Vite Mock 中间件
> 版本：v1.4　更新：2026-10-10

---

## 0. 总则

1. **一致性优先于个人偏好**：任何风格分歧以本文件为准；本文件未覆盖的，团队内当次讨论后**回写本文件**再执行。
2. **可读性优先于技巧**：禁止为炫技使用难以理解的写法。
3. **分层不可跨越**：页面层只调用 `store` / `composables` / `api`；`api` 层只依赖 `request.js`；组件层不得直接发请求。
4. **一切"方便"的例外都要写注释说明原因**。

---

## 1. 目录与文件命名规范

### 1.1 命名映射表

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| 页面组件（`.vue`） | **PascalCase** 文件名可放宽，但目录用 kebab-case | `views/admin/goods/index.vue`、`views/before/user/favorite.vue` |
| 通用/业务组件（`.vue`） | **PascalCase**（多词） | `GoodsCard.vue`、`FormDialog.vue`、`SidebarCom.vue` |
| 组合函数 | `useXxx.js`（camelCase） | `useTable.js`、`useEcharts.js` |
| Pinia 模块 | `xxx.js`（camelCase），导出 `useXxxStore` | `store/modules/user.js` → `useUserStore` |
| API 模块 | `xxx.js`（camelCase），按业务域拆分 | `api/admin/goods.js` |
| 常量 | `UPPER_SNAKE_CASE` | `ORDER_STATUS`、`ERROR_MAP` |
| 工具函数文件 | `xxx.js`（camelCase） | `storage.js`、`format.js` |
| 目录 | **kebab-case 小写** | `views/admin/`、`components/common/` |
| CSS class | kebab-case 或 BEM-lite | `goods-card`、`goods-card__title` |

### 1.2 强制条款

- **禁止**：中文文件名、含空格的文件名、大写字母目录名。
- **禁止**：组件单名（如 `Card.vue`、`Table.vue`），必须多词，避免与 HTML 标签或 Element Plus 组件冲突。
- **禁止**：同一类文件混用 kebab-case 与 PascalCase。
- 页面文件统一入口名 `index.vue`；子视图可用语义名（`edit.vue`、`detail.vue`、`confirm.vue`）。

---

## 2. Vue SFC 写法规范

### 2.1 文件块顺序

```vue
<template>
  <!-- 模板 -->
</template>

<script setup>
  // 逻辑（统一使用组合式 API + <script setup>）
</script>

<style scoped lang="scss">
  /* 样式 */
</style>
```

### 2.2 props / emits

```js
// ✅ 正确
const props = defineProps({
  /** 商品列表数据 @type {Array<Object>} */
  list: { type: Array, default: () => [] },
  /** 是否加载中 @type {boolean} */
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'submit'])
```

- **强制**：`props` 必须声明 `type`，对象/数组的 `default` 必须用工厂函数 `() => []`。
- **强制**：`emits` 必须用 `defineEmits` 显式声明，**禁止**触发未声明的自定义事件。
- **强制**：每个 prop 上方写一行注释说明含义。
- `defineExpose` 仅在父组件需要调用子组件方法时使用，且必须写明原因。

### 2.3 拆分粒度阈值（硬性）

满足以下**任意一条**即必须拆分子组件：

- 单文件行数 **> 300 行**；
- `<template>` 中出现 **≥ 2 个可复用区块**（如重复的列表项、重复的表单项）；
- 同一组件同时承载 **列表 + 弹窗 + 表单** 三类关注点；
- 单组件 `props > 8` 或 `emits > 6`。

拆分后子组件放同级目录或以父组件名作前缀命名。

### 2.4 模板规范

- **禁止**在模板中书写复杂表达式（超过一个三元 / 含多步运算）→ 抽到 `computed` 或方法。
- `v-for` 必须绑定 `:key`，且 `key` 使用业务唯一 ID，禁止用 `index`（静态列表除外）。
- 组件采用 `PascalCase` 标签引用，闭合标签必须写全。

---

## 3. 组合式 API 与 composables 规范

### 3.1 基本写法

- 统一使用 `ref` / `computed` / `watch` / `watchEffect` 等组合式 API；**禁止** Vue 2 选项式写法混用。
- 逻辑复用一律抽出 `composables/useXxx.js`，**返回对象**（`return { list, loading, fetchList }`），**禁止返回裸数组/裸变量**。

### 3.2 已约定的核心 composables

| 组合函数 | 职责 | 使用场景 |
| --- | --- | --- |
| `useTable` | 列表数据 + 分页 + 筛选条件 + loading | 后台四类列表（类型/商品/订单）统一复用 |
| `useDialog` | 弹窗显隐 + 编辑行数据 | 所有新增/编辑弹窗 |
| `useAuth` | 登录 / 登出 / 角色判断 | 需要鉴权的页面与按钮 |
| `useEcharts` | 图表实例初始化 / resize / 销毁 | 数据统计页 |

### 3.3 强制条款

- 副作用（`setInterval`、`addEventListener`、`watch` 订阅）**必须在 `onUnmounted` 中清理**。
- composable 内部**禁止直接 import 具体页面组件**，需要依赖时通过参数注入。
- composable 内部**禁止直接操作 DOM**（特殊情况需注释说明并封装）。

---

## 4. Pinia Store 规范

### 4.1 统一使用 setup store

```js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { loginApi } from '@/api/before/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const profile = ref(null)
  const isLogin = computed(() => !!token.value)

  async function login(payload) {
    const data = await loginApi(payload)
    token.value = data.token
  }

  return { token, profile, isLogin, login }
}, { persist: { pick: ['token'] } })
```

### 4.2 强制条款

- **state 用 `ref`，getter 用 `computed`，action 用普通函数**。
- store id 与文件名一致（camelCase），导出名 `useXxxStore`。
- **action 内只做状态变更与编排；网络请求必须调到 `api/` 层**，禁止在 store 内直接写 `axios`。
- **禁止在组件内直接修改 store state**（如 `userStore.token = 'x'`），一律通过 action。
- 持久化统一使用 `pinia-plugin-persistedstate`，**白名单**：`user.token`、`app.theme`、`app.sidebarCollapsed`、游客态 `cart`；其余不持久化。
- 购物车：游客态持久化到本地，登录后与服务器数据合并，**合并逻辑必须写在 `cart` store 的 action 中**。

---

## 5. API 层规范

### 5.1 唯一请求实例

- 全项目**唯一** axios 实例位于 `api/request.js`。
- **禁止**在任何组件 / store / composable 中直接 `import axios` 或使用 `fetch`。

### 5.2 request.js 职责

| 阶段 | 职责 |
| --- | --- |
| 创建 | `baseURL = import.meta.env.VITE_API_BASE`、`timeout` |
| 请求拦截 | 注入 `Authorization: Bearer <token>`、开启全局 loading |
| 响应拦截 | 解包 `data`、`code !== 0` 弹错误提示并 reject、`401` 清 token 跳登录、关闭 loading |

### 5.3 统一契约与错误码

- 响应结构固定 `{ code, message, data }`，`code === 0` 为成功（常量 `SUCCESS_CODE`）。
- 错误码集中维护在 `utils/constants.js` 的 `ERROR_MAP`，页面可捕获后做二次处理。

### 5.4 强制条款

- API 按业务域拆分文件（`api/admin/goods.js`、`api/before/cart.js`），**禁止**所有接口堆在一个文件。
- 接口函数命名用动词前缀：`getGoodsList`、`createGoods`、`updateGoodsStatus`、`deleteCategory`。
- 每个接口函数必须写 JSDoc（`@param` / `@returns`）。
- **禁止**在源码中硬编码接口域名、token、密钥，一律走环境变量。

### 5.5 切换真实接口

业务代码**零改动**即可切换：只需修改 `.env.*` 中的 `VITE_USE_MOCK` 与 `VITE_API_BASE`。任何"为接真实接口而改业务代码"的提交都将被驳回。

---

## 6. 路由与权限规范

### 6.1 路由注册

- 路由按子系统拆到 `router/modules/admin.js` 与 `router/modules/before.js`，由 `router/index.js` 合并。
- 页面组件一律**懒加载**：`component: () => import('@/views/...')`。
- 路由 `name` **全局唯一**（重复会导致跳转异常）。

### 6.2 meta 约定

```js
// 业务页（需登录）
meta: { title: '商品管理', requiresAuth: true, role: 'admin', keepAlive: false, icon: 'Goods' }
// 登录 / 注册页（仅游客可访问，已登录时回跳 guestRedirect）
meta: { title: '管理员登录', guestOnly: true, guestRedirect: '/admin/dashboard' }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | String | 页面标题，同时用于侧边栏菜单文案与面包屑 |
| `requiresAuth` | Boolean | 是否要求登录 |
| `role` | `'admin' \| 'user'` | 要求登录时的角色 |
| `guestOnly` | Boolean | 仅未登录可访问（登录 / 注册页） |
| `guestRedirect` | String | `guestOnly` 页在已登录时的回跳地址 |
| `keepAlive` | Boolean | 是否缓存组件（当前未启用） |
| `icon` | String | 后台侧边栏图标名，与 `SidebarCom.vue` 的 `ICON_MAP` 对应 |

### 6.3 守卫

- 所有鉴权逻辑集中在 `router/guard.js`：
  - 前置守卫：判断 `guestOnly`（已登录回跳首页）→ `requiresAuth` / `role`（未登录跳对应登录页并携带 `redirect`，角色不匹配跳 `/404`）；
  - 后置守卫：设置 `document.title`、结束进度条。
- 已登录访问后台登录页但角色非 `admin` 时，直接退回前台 `/`，**不再二次跳转**，避免撞上角色校验落到 404。
- **禁止**在各个组件内散落写鉴权判断。
- 按钮级权限使用 `v-permission` 指令（可选实现）。

### 6.4 权限矩阵

| 区域 | 要求 |
| --- | --- |
| `/admin/*` | 登录且 `role === 'admin'` |
| 前台 `requiresAuth: true` 的页面（购物车 / 订单 / 收藏 / 个人中心） | 登录且 `role === 'user'` |
| 前台公开页（首页 / 搜索 / 详情） | 无需登录；其中"加购 / 立即购买 / 收藏"按钮需登录，未登录时提示并跳登录 |

---

## 7. 样式规范

- 统一使用 **SCSS**；全局变量 / mixin / Element Plus 主题覆盖集中在 `assets/styles/`（`variables.scss`、`mixins.scss`、`element-override.scss`）。
- **`variables.scss` 与 `mixins.scss` 已由 `vite.config.js` 的 `css.preprocessorOptions.scss.additionalData` 自动注入**到每个 `<style lang="scss">`：
  - 组件里**直接**用 `$color-primary`、`@include respond-to('md')`、`@include card-surface` 即可；
  - **禁止**再手写 `@use '@/assets/styles/variables.scss'` —— 同一模块被加载两次会直接报错。
- 组件样式一律 `scoped`；需穿透子组件用 `:deep()`。
- 优先使用 Element Plus 提供的 CSS 变量，**禁止硬编码十六进制色值**（除设计稿明确定义且已提为变量）。
- class 命名使用 BEM-lite 或语义化 kebab-case；**禁止**用内联 `style` 写复杂样式（动态尺寸例外，如上传框宽高）。
- 响应式断点统一：`xs < 768`、`sm ≥ 768`、`md ≥ 992`、`lg ≥ 1200`，用 `mixins.scss` 的 `respond-to()` / `respond-below()` 封装 `@media`，**禁止**硬编码媒体查询宽度。
- 前台（`views/before`）需至少保证首页、商品详情、购物车在移动端可用。

**Element Plus 引入方式（已定，勿改）**：采用 `app.use(ElementPlus, { locale: zhCn })` + 全局 `element-plus/dist/index.css`。
- **禁止**重新引入 `unplugin-vue-components` / `ElementPlusResolver`：它与全局 CSS 重复，且会让 Vite 依赖预构建反复「发现新依赖 → 重新预构建」，而重新预构建需清理 `.vite` 缓存目录，实测会让 dev server 崩溃。
- **禁止**去掉 `{ locale: zhCn }`：Element Plus 默认英文，分页、日期选择器、上传组件等会全部显示英文。
- 命令式组件（`ElMessage` / `ElMessageBox` 等）必须**显式 import**，不要依赖自动引入。

---

## 8. Git 提交规范

### 8.1 提交信息（Conventional Commits）

```
<type>(<scope>): <subject>
```

| type | 含义 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 修复缺陷 |
| `refactor` | 重构（不改行为） |
| `style` | 格式调整（不影响逻辑） |
| `docs` | 文档 |
| `chore` | 构建/依赖/配置 |
| `test` | 测试 |

示例：`feat(goods): 新增商品批量上下架`、`fix(cart): 修复数量为 0 时未自动删除`

### 8.2 分支模型

- `main`：稳定可演示版本；
- `dev`：集成分支；
- `feature/xxx`、`fix/xxx`：功能与修复分支，合并前发起 PR 并至少 **1 人 review**。

### 8.3 强制条款

- 一个功能点一次提交，**禁止**"一次性提交所有改动"。
- **禁止**提交 `node_modules/`、`dist/`、`.env.local`、编辑器配置。
- 提交前必须清理 `console.log` 与注释掉的死代码。

### 8.4 Code Review 检查清单

- [ ] 命名是否符合第 1 章规范
- [ ] 是否补充了 JSDoc（接口函数、composable、props）
- [ ] 是否存在硬编码 URL / token / 密钥
- [ ] 请求是否都经过 `api/request.js`
- [ ] store 状态是否都通过 action 修改
- [ ] 组件是否超过 300 行未拆分
- [ ] 副作用是否已清理
- [ ] 是否残留调试代码

---

## 9. 注释与 JSDoc 规范

- **文件头**：一句话说明模块职责（每个 `.js` / `.vue` 文件顶部）。
- **函数**：写 JSDoc —— `@description` / `@param` / `@returns`；复杂逻辑注释应解释**"为什么"**而非"做了什么"。
- **组件**：`defineProps` 上方逐项注释 prop 含义与取值。
- **禁止**无意义注释（如 `// 定义变量`）。
- TODO 必须带负责人与上下文：`// TODO(姓名): 待接入真实上传接口`。

---

## 10. 禁止事项（Anti-pattern 清单）

> 出现以下任意一项，代码审查直接驳回。

1. ❌ 组件 / store / composable 内直接使用 `axios` 或 `fetch`，绕过 `api/request.js`。
2. ❌ 直接修改 store state，绕过 action。
3. ❌ 在源码中硬编码接口地址、token、密钥、账号密码。
4. ❌ 在 `setup` 顶层创建不清理的定时器 / 事件监听 / 订阅。
5. ❌ 巨型组件（> 300 行不拆）、巨型函数（> 50 行不拆）。
6. ❌ 无类型的参数随意传递（JS 项目也必须用 JSDoc 描述结构）。
7. ❌ 提交 `console.log`、调试代码、大段注释掉的死代码。
8. ❌ 同一类文件混用 kebab-case / PascalCase；中文或含空格的文件名。
9. ❌ 在 `<template>` 中书写复杂表达式（超过一个三元运算）。
10. ❌ 跨子系统直接 `import` 对方的业务组件（`views/admin` 与 `views/before` 互相引用业务组件）——只能从 `components/common/`、`composables/`、`utils/` 复用。
11. ❌ 在 `v-for` 中使用 `index` 作为 `key`（静态列表除外）。
12. ❌ 提交 `node_modules/`、`dist/`、`.env.local`。

---

## 11. 代码检查与格式化规范（ESLint + Prettier）

**工具链**：ESLint 9（flat config，`eslint.config.js`）+ Prettier 3（`.prettierrc`），二者用 `eslint-config-prettier` 关闭冲突规则。

```bash
npm run lint          # eslint .          —— 提交前必须零告警
npm run lint:fix      # eslint . --fix
npm run format        # prettier 写入
npm run format:check  # prettier 校验（CI / 自检用）
```

**格式化基线**（`.prettierrc`，与既有代码保持一致，不要在编辑器里改成默认值）：

| 项 | 值 | 说明 |
| --- | --- | --- |
| `semi` | `false` | 不写行尾分号 |
| `singleQuote` | `true` | 字符串用单引号 |
| `printWidth` | `100` | 超过 100 列换行 |
| `trailingComma` | `none` | 不用尾随逗号 |
| `arrowParens` | `always` | 单参数箭头函数也带括号 |
| `endOfLine` | `lf` | **统一 LF**，避免 Windows CRLF 造成整文件 diff |

**lint 规则的取舍（重要，改之前先读这里）**：

1. `vue/multi-word-component-names` 关闭 —— 项目页面统一放在 `views/<模块>/index.vue`，文件名即模块名（`cart`、`search`），强制多词会破坏目录约定。
2. `no-unused-vars` 开启 `ignoreRestSiblings` —— 允许 `const { password, ...rest } = user` 这种「解构排除敏感字段」的写法。
3. `vue/require-v-for-key` 设为 `error` —— 对应第 10 章第 11 条，禁止用 `index` 当 `key`。
4. `build/**/*.js`、`vite.config.js` 关闭 `no-console` —— 构建脚本允许打日志。
5. **定向豁免必须写明原因**：仅允许在确实必要处用 `<!-- eslint-disable xxx -->` 且紧跟一行注释解释。现有唯一一例是 `components/common/SearchForm.vue` 的 `vue/no-mutating-props`——该组件刻意让筛选表单直接绑定父级 `reactive` 查询对象（而非逐字段 emit），被修改的是父级对象属性，不是 prop 本身。

---

## 附录 A：新增一个标准 CRUD 模块的步骤（以「商品类型管理」为例）

1. `api/admin/category.js`：按统一契约定义 `getCategoryList` / `createCategory` / `updateCategory` / `deleteCategory`（写 JSDoc）；
2. `mock/modules/category.js`：实现对应 mock 接口（分页 + 增删改查）；
3. `store/modules/category.js`：如需跨页面缓存（如下拉选项）则建 store，否则可省；
4. `views/admin/category/index.vue`：使用 `useTable` + `SearchForm` + `DataTable` + `Pagination` + `FormDialog`；
5. `router/modules/admin.js`：注册路由并补 `meta`；
6. 自检本文件第 10 章清单。

## 附录 B：新增一个组件的判断流程

```
这个组件有业务语义吗？
├─ 没有（纯 UI + props/emit 驱动） → 放 components/common/
└─ 有
   ├─ 只属于后台 → components/admin/
   └─ 只属于前台 → components/before/
```

## 附录 C：Mock 层约定（务必遵守）

> Mock 能力由**自研中间件** `build/mock-server-plugin.js` 提供（取代 `vite-plugin-mock`）。
> 它不走"打包成临时文件再 require"的路线，而是**由 Node 原生 ESM 直接 `import()` 加载** mock 模块——
> 零临时文件、零文件删除，可安全热重载。代价是必须遵守 Node ESM 的加载规则（见第 3 条）。

1. **目录边界**：`src/mock/modules/` 是 `mockPath`，中间件只加载该目录下**直接子级**的 `.js` 文件，每个文件的 `export default` 必须是 MockMethod 数组（`{ url, method, response }`）。
   - **共享数据层必须放在外层**：`src/mock/db.js`（数据）、`src/mock/helpers.js`（工具）。
   - 该目录**不放任何临时文件**；如需临时禁用一个接口文件，把文件名改成 `_` 开头即可（中间件会跳过）。
2. **共享状态的写法**：热重载时接口文件会带 `?t=<时间戳>` 重新 `import()`，得到**全新的模块实例**，因此模块级变量无法跨重载保留。**共享数据必须挂到 `globalThis`**：
   ```js
   const GLOBAL_KEY = '__ECOM_MOCK_DB__'
   export function getDb() {
     return (globalThis[GLOBAL_KEY] ||= createSeed())
   }
   ```
3. **禁用 `@/` 别名，且必须写全 `.js` 扩展名**：mock 文件由 Node 直接加载，**不经过 Vite 转换**，既不认识 `@` 别名，也不做扩展名补全。一律这么写：
   ```js
   import { getDb } from '../db.js'            // ✅
   import { ok, fail } from '../helpers.js'    // ✅
   import { ok } from '@/mock/helpers'         // ❌ 别名 + 缺扩展名，必崩
   ```
4. **不要依赖 `vite.config.js` 里的 `ignore` 之类的排除配置**：中间件靠 `_` 前缀 + `.js` 后缀自行筛选，无需额外配置。若将来换回第三方 mock 插件，请先确认它是否会把产物写回被扫描的目录（曾因此产生 383 个临时文件）。
5. **没有 `localStorage`**：mock 跑在 Node 进程里，数据存内存即可（浏览器刷新不丢、重启 dev server 重置）。
6. **响应契约统一**走 `helpers.js` 的 `ok()` / `fail()`，不要在接口文件里手写 `{ code, message, data }`。
7. **业务规则写在 mock 里**，例如「类型下还有商品时不允许删除」「库存不足不允许下单」，这样前端才能真正测到错误分支。

---

## 附录 D：通用组件契约（`components/common/`）

> 这 7 个组件是后台 / 前台共用的 UI 底座。**新增页面必须优先复用它们**，
> 不要在页面里手写一整套 `el-table` + `el-pagination` + 搜索表单。
> 演示与用法示例见 `views/demo/index.vue`（访问 `/demo`）。

| 组件 | 职责 | 关键 props | 事件 / 插槽 |
| --- | --- | --- | --- |
| `SearchForm` | 配置化搜索栏 | `modelValue`（父级 reactive 查询对象）、`fields`、`loading` | `@search`、`@reset`；默认插槽放右侧主操作按钮 |
| `DataTable` | 列配置驱动表格 | `columns`、`data`、`loading`、`showIndex`、`showSelection`、`rowKey`、`emptyText` | `@selection-change`、`@row-click`；插槽 `#col-<prop>`、`#action` |
| `Pagination` | 分页 | `page`、`pageSize`、`total`、`pageSizes` | `@page-change`、`@size-change`（直接接 `useTable`） |
| `StatusTag` | 状态标签 | `kind`（`order` \| `goods`）、`status` | — |
| `ImageUpload` | 图片选择与上传 | `modelValue`、`uploadFn`、`maxSize`、`tip`、`width`、`height` | `@success`、`@error` |
| `FormDialog` | 表单弹窗（内置校验） | `modelValue`、`title`、`model`、`rules`、`loading`、`width`、`labelWidth` | `@confirm`（校验通过才触发）、`@cancel`、`@closed`；插槽 `#footer` |
| `EmptyState` | 空状态 | `description`、`imageSize`、`minHeight` | 默认插槽放操作按钮 |

**`DataTable` 的 `columns` 列类型**：

| `type` | 效果 |
| --- | --- |
| 省略 | 直接输出字段值（空值显示 `-`） |
| `money` | `formatMoney` 格式化（¥1,299.00） |
| `date` | `formatDate` 格式化 |
| `tag` | 渲染 `StatusTag`，需配 `tagKind` |
| `image` | 渲染 `el-image` 缩略图 + 点击预览 |
| `action` | 操作列，内容由 `#action` 插槽提供 |

> 约定：`columns` 中若给了 `prop`，父组件可用 `#col-<prop>` 覆盖该列渲染（优先级高于内置类型）。

**硬性约束**
1. 通用组件**禁止** import 任何 `api/*` 模块——需要接口时通过 props 注入（如 `ImageUpload` 的 `uploadFn`）。
2. 通用组件**禁止** import `views/` 下的业务组件（CLAUDE.md 第 10 章第 10 条）。
3. 新增通用组件必须同时补到本表格，并在 `/demo` 页加上演示。

---

## 附录 E：业务组件清单（`components/admin/` 与 `components/before/`）

> 与附录 D 的区别：这些组件**绑定了具体业务**（读 store、发请求、带路由跳转），
> 因此不允许跨子系统复用（后台不能 import 前台的业务组件，反之亦然）。

### `components/admin/`（后台专用）

| 组件 | 职责 | 关键 props | 事件 / 插槽 |
| --- | --- | --- | --- |
| `StatCard` | 数据统计指标卡 | `label`、`value`、`unit`、`icon`、`color`、`loading` | — |
| `SidebarCom` | 后台侧边菜单 | `collapsed` | 菜单项**由路由表 `meta.icon` + `meta.title` 自动生成**，新增页面无需改此组件 |
| `HeaderCom` | 顶栏（折叠 / 面包屑 / 用户下拉） | — | 内置退出登录；`ICON_MAP` 白名单维护图标 |

### `components/before/`（前台专用）

| 组件 | 职责 | 关键 props | 事件 / 插槽 |
| --- | --- | --- | --- |
| `GoodsCard` | 商品卡片 | `goods`（必填）、`showActions` | `@add-cart`；插槽 `#actions`（自定义底部操作，与默认加购按钮并存） |
| `AuthShell` | 登录 / 注册页共用外壳 | `title`、`subtitle` | 默认插槽放表单；`#foot` 插槽放底部链接 |

> `SidebarCom` 自动生成菜单的实现：读取 `router.options.routes` 中 `path === '/admin'` 的 `children`，
> 过滤出同时具备 `meta.icon` 与 `meta.title` 的路由。**新增后台页面只要补这两个 meta 字段即可上菜单。**

**硬性约束**
1. 业务组件**可以**读 store / 调 api / 用 router，但**不得**被另一子系统引用。
2. 页面内的重复区块（同一文件出现 ≥ 2 次）必须抽成业务组件，例如
   `views/before/order/OrderCard.vue`（订单卡片）、`views/before/goods/GoodsIntro.vue`（商品介绍）。
3. 业务组件同样受第 2.3 节拆分阈值约束（单文件 > 300 行必须拆）。

---

*本规范由团队共同维护；任何修改需经 review 后合并，并在文末修订记录登记。*

| 版本 | 日期 | 修订内容 | 修订人 |
| --- | --- | --- | --- |
| v1.0 | 2026-10-09 | 初版 | — |
| v1.1 | 2026-10-09 | Mock 方案由 `vite-plugin-mock` 改为自研中间件，附录 C 重写 | — |
| v1.2 | 2026-10-09 | 新增附录 D（通用组件契约）；第 7 章补充 SCSS 全局注入与 Element Plus 引入方式 | — |
| v1.3 | 2026-10-10 | 第 6.2/6.3 节补齐路由 meta 字段表与守卫执行顺序；新增附录 E（前后台业务组件清单） | — |
| v1.4 | 2026-10-10 | 新增第 11 章（ESLint + Prettier 约定与规则取舍） | — |
