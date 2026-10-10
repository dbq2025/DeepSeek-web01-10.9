# 电子商务平台前端系统 —— 代码审查报告

| 项 | 内容 |
|---|---|
| 审查日期 | 2026-10-10 |
| 审查范围 | `src/` + `build/` + 根配置（82 个源码文件 / 9566 行） |
| 审查方式 | 全量精读 60+ 文件 + 静态扫描（引用计数/规则比对）+ **动态实证**（CDP 驱动真实 Chromium + curl 打 Mock 接口） |
| 审查基线 | `CLAUDE.md` v1.4（10 章 + 附录 A~E）、ESLint 9 flat config、Prettier 3 |
| 结论 | 共发现 6 项 🔴 / 8 项 🟠 / 7 项 🟡。**已全部修复并通过全量回归**（接口 51/51 PASS、浏览器 21/21 PASS），修复记录见第 11 章 |

---

## 0. 总览

### 0.1 问题分布

| 严重程度 | 数量 | 类别 |
|---|---|---|
| 🔴 高 | 6 | 越权访问（4）、数据一致性（2） |
| 🟠 中 | 8 | 功能缺陷（2）、服务端校验缺失（2）、错误处理（2）、规范偏差（2） |
| 🟡 低 | 7 | 死代码（4）、未使用资源（2）、注释过时（1） |

### 0.2 规范符合度评分

| 维度 | 得分 | 说明 |
|---|---|---|
| 命名 / 目录结构 | 9 / 10 | 分层清晰，`api / store / composables / utils / mock` 职责分明 |
| SFC 写法 | 9 / 10 | 全 `<script setup>`，props/emits 用 TS-less JSDoc 标注，一致性好 |
| 样式规范 | 8 / 10 | 仅 1 处硬编码色值；SCSS 注入方案统一 |
| 代码复用 | 9 / 10 | `useTable` / `useDialog` / 7 个通用组件覆盖到位，重复度低 |
| 注释质量 | 7 / 10 | 头部注释充分，但 **3 处注释已过时**（与实现矛盾） |
| 错误处理 | 6 / 10 | 拦截器只处理 401；`ERROR_MAP` 定义了却没用 |
| 安全检查 | 4 / 10 | **最大短板**：Mock 写接口几乎无鉴权 |
| 边界防御 | 5 / 10 | 数值/字符串长度/状态机缺校验 |
| 死代码控制 | 5 / 10 | 4 处死代码 + 6 个未使用变量 |

**综合：7.1 / 10** —— 工程结构与可读性属优秀水平；扣分集中在**安全边界**与**服务端校验**（Mock 层把「假后端」写得过于信任前端）。

---

## 1. 🔴 安全问题（最高优先级）

### 1.1 【🔴 高】Mock 写接口几乎全线无鉴权

Mock 层是这门课设计的「后端」，但它对**所有写操作都不校验身份**，等于把后台管理 API 直接暴露给匿名请求。实测全部成功：

| 接口 | 位置 | 实测证据 |
|---|---|---|
| `GET /api/order/list` | `src/mock/modules/order.js:17-30` | 匿名可拉**全站订单**，含他人 `address.name / phone / detail` |
| `GET /api/order/detail` | `src/mock/modules/order.js:47-56` | 匿名 `?id=2045` → `code:0`，返回收货人姓名 + 手机 + 地址 |
| `PUT /api/order/status` | `src/mock/modules/order.js:57-69` | 匿名改订单状态 → `code:0`，订单被改成 `status:3`（已完成） |
| `POST /api/goods/create` | `src/mock/modules/goods.js:82-105` | 匿名建商品 → `code:0` |
| `PUT /api/goods/update` | `src/mock/modules/goods.js:106-124` | 匿名改任意商品 |
| `PUT /api/goods/status` | `src/mock/modules/goods.js:125-136` | 匿名上下架 |
| `PUT /api/goods/batch-status` | `src/mock/modules/goods.js:137-154` | 匿名批量上下架 |
| `DELETE /api/goods/delete` | `src/mock/modules/goods.js:155-165` | 匿名删商品 → 商品总数 25 → 24 |
| `POST /api/goods/upload` | `src/mock/modules/goods.js:166-175` | 匿名上传 |

**对照**：同文件里的 `/api/order/my`（:33）、`/api/order/pay`（:72）、`/api/order/cancel`（:88）**做对了** —— 都调了 `currentUser()` 并校验 `order.userId !== user.id`。说明团队知道怎么写，只是漏在了其余接口上，属**一致性缺失**而非能力不足。

**改进建议**：在 `helpers.js` 增加一个守卫工厂，统一收口：

```js
// src/mock/helpers.js
/**
 * 从请求解析当前用户并校验角色
 * @param {object} req mock 请求对象
 * @param {Array} users 用户表
 * @param {'admin'|'user'} [needRole] 需要的角色
 * @returns {{user:object|null, error:object|null}}
 */
export function requireUser(req, users, needRole) {
  const user = currentUser(req, users)
  if (!user) return { user: null, error: fail('未登录或登录已过期', 401) }
  if (needRole && user.role !== needRole) return { user: null, error: fail('没有权限访问', 403) }
  return { user, error: null }
}
```

然后每个写接口首行改为：

```js
response: ({ body, headers }) => {
  const db = getDb()
  const { error } = requireUser({ headers }, db.users, 'admin')
  if (error) return error
  // ...原逻辑
}
```

订单类接口另需补**归属校验**：

```js
// /api/order/detail
const { user, error } = requireUser({ headers }, db.users)
if (error) return error
const order = db.orders.find((o) => o.id === Number(query?.id))
if (!order) return fail('订单不存在', 404)
if (order.userId !== user.id && user.role !== 'admin') return fail('无权查看该订单', 403)
return ok(order)
```

---

### 1.2 【🔴 高】路由守卫 `role` 判断被短路，可绕过后台鉴权

**位置**：`src/router/guard.js:40`

```js
if (role && userStore.role && userStore.role !== role) {   // ← 第 3 个条件制造了漏洞
  next({ path: '/404' })
  return
}
```

`userStore.role` 为空字符串时（`localStorage` 被人为剔除 `role` 字段、或持久化数据部分损坏），整个判断短路 → **守卫放行**。

**实测复现**：`localStorage.user = {"token":"mock.2.user"}`（无 `role`）→ 直接访问 `/admin/dashboard` **成功进入**。

根因还有一层：`useUserStore` 的 `isLogin` 只看 `token`（`src/store/modules/user.js:20`），而 `role` 与 `token` 是两个独立持久化字段，二者不保证同时存在。

**改进建议**：后台区域必须有明确的角色白名单，缺失角色一律拒绝：

```js
// src/router/guard.js  替换第 39-43 行
// 角色不匹配（含角色缺失）→ 拦截
if (role && userStore.role !== role) {
  next({ path: '/404' })
  return
}
```

更稳妥的做法是在守卫最前面统一推导角色：

```js
const { requiresAuth, role, ... } = to.meta
if (requiresAuth) {
  if (!userStore.isLogin) { /* 跳登录 */ return }
  if (role && userStore.role !== role) { next('/404'); return }
}
```

即**把 `requiresAuth` 作为 `role` 校验的前置条件**，而不是依赖 `userStore.role` 的真值。

---

### 1.3 【🟠 中】401 处理硬跳转，丢失后台上下文

**位置**：`src/api/request.js:49-54`

```js
if (status === 401) {
  const userStore = useUserStore()
  userStore.logout()
  ElMessage.error('登录已过期，请重新登录')
  window.location.href = '/login'      // ← 三个问题
}
```

问题：
1. 后台请求 401 也被甩到**前台登录页** `/login`，管理员得自己再找后台入口；
2. `window.location.href` 触发**整页重载**，丢 SPA 状态，也让 mock 数据层重新初始化；
3. **没有携带 `redirect`**，登录成功后回不到原页面（而守卫 `guard.js:35` 是认真带了 `redirect` 的，两处行为不一致）。

**改进建议**：用 router 导航 + 按区域分流：

```js
import router from '@/router'

if (status === 401) {
  const userStore = useUserStore()
  const isAdminArea = router.currentRoute.value.path.startsWith('/admin')
  userStore.logout()
  ElMessage.error('登录已过期，请重新登录')
  router.replace({
    path: isAdminArea ? '/admin/login' : '/login',
    query: { redirect: router.currentRoute.value.fullPath }
  })
}
```

> ⚠️ 注意循环依赖：`@/router` 会引入 `guard.js` → 引入 store，而 `request.js` 已被 store 间接依赖。解法是把 `router` 用**懒求值**引入（在 401 分支内 `await import('@/router')`），或把跳转逻辑抽到独立的 `utils/auth-redirect.js`。

---

## 2. 🔴 数据一致性问题

### 2.1 【🔴 高】下单「边扣库存边校验」，失败不回滚

**位置**：`src/mock/modules/order.js:122-135`

```js
const orderItems = []
for (const item of items) {
  const goods = db.goods.find((g) => g.id === Number(item.goodsId))
  if (!goods) return fail(`商品 ${item.goodsId} 不存在`, 400)   // ← 前面已扣的库存不回滚！
  if (goods.stock < item.count) return fail(`「${goods.name}」库存不足`, 400)
  goods.stock -= item.count                                     // ← 已发生副作用
  goods.sales += item.count
  orderItems.push({ ... })
}
```

**实测复现**：提交「1 件合法商品 + 1 个不存在的商品」→ 接口返回 `code:400`，但**第一次循环已扣掉的 3 件库存不回来**（215 → 212，凭空蒸发）。

这是典型的**非原子操作**：把「校验」和「写入」交织在同一个循环里。

**改进建议**：两段式 —— 先全量校验并聚合，全部通过后再统一落账：

```js
// 第一段：只读校验，不产生任何副作用
const plan = []
for (const item of items) {
  const count = Number(item.count)
  if (!Number.isInteger(count) || count <= 0) return fail('商品数量必须为正整数', 400)
  const goods = db.goods.find((g) => g.id === Number(item.goodsId))
  if (!goods) return fail(`商品 ${item.goodsId} 不存在`, 400)
  // 同一商品多行时需累计需求量，避免分别通过、合计超卖
  const already = plan.filter((p) => p.goods.id === goods.id).reduce((s, p) => s + p.count, 0)
  if (goods.stock < count + already) return fail(`「${goods.name}」库存不足`, 400)
  plan.push({ goods, count })
}

// 第二段：全部校验通过后才写
const orderItems = plan.map(({ goods, count }) => {
  goods.stock -= count
  goods.sales += count
  return { goodsId: goods.id, goodsName: goods.name, price: goods.price, count, cover: goods.cover }
})
```

> 顺带修掉了另一个隐藏 bug：原实现**未对同一商品的重复行做累计校验**，`[{goodsId:1,count:10},{goodsId:1,count:10}]` 在库存只有 15 时会**分别通过校验但合计扣 20**，造成负库存。

---

### 2.2 【🔴 高】数量无正负/整数校验 → 负数金额 + 库存被「刷多」

**位置**：`src/mock/modules/order.js:125`

```js
if (goods.stock < item.count) return fail(...)   // count = -5 时：210 < -5 为 false，直接跳过
goods.stock -= item.count                        // 210 - (-5) = 215，库存反而变多
goods.sales += item.count                        // 销量减 5
```

**实测复现**：`count = -5` → 订单金额 `¥-1810`、件数 `-5`，且**库存从 210 涨到 215**。

根因：只做了上界（库存够不够）校验，**没有下界与类型校验**。同理 `0`、`1.5` 也未被拦截。

**改进建议**：见 2.1 的 `plan` 循环首行 —— `if (!Number.isInteger(count) || count <= 0) return fail('商品数量必须为正整数', 400)`。

前端也应同步收口（`src/views/before/cart/index.vue`、`goods/detail.vue`），但**服务端校验是底线，不能只靠前端**。

---

### 2.3 【🔴 高】已取消订单仍计入统计

**位置**：`src/mock/modules/stat.js:16`（`salesByMonth`）、`:39`（`ordersByCategory`）、`:60`（`totalAmount`）

```js
// stat.js:60
totalAmount: db.orders.reduce((sum, o) => sum + o.totalPrice, 0)   // 未排除 o.status === 4
```

**实测复现**：取消一笔 `¥217` 的订单后，`/api/stat/overview` 的 `totalAmount` 仍为 `¥313460`，**一分数值不变**。

注意 `order.js:106` 取消时**已经回滚了库存与销量**（这块做得很对），但统计口径没跟着改 —— 「库存已还原、销售额没还原」，数据自相矛盾。

**改进建议**：抽一个「有效订单」判定，三处统一复用：

```js
// src/mock/modules/stat.js 顶部
import { ORDER_STATUS } from '../../utils/constants.js'

/** 参与统计的有效订单（排除已取消） */
const isCounted = (order) => order.status !== ORDER_STATUS.CANCELED
```

```js
// salesByMonth：db.orders.forEach → db.orders.filter(isCounted).forEach
// ordersByCategory：同上
// totalAmount：
totalAmount: db.orders.filter(isCounted).reduce((sum, o) => sum + o.totalPrice, 0)
```

> 业务决策点：`orderCount` 是否也排除取消单？建议同步排除，并在 `dashboard` 图表副标题注明口径（如「不含已取消订单」），避免答辩时被问。

---

## 3. 🟠 功能缺陷

### 3.1 【🟠 中】订单确认页刷新后收货信息全部丢失

**位置**：`src/views/before/order/confirm.vue:117-120`

```js
onMounted(() => {
  const profile = userStore.profile || {}
  form.name = profile.nickname || ''
  form.phone = profile.phone || ''
})
```

**根因是父子 `onMounted` 执行顺序 + 异步竞态**：
- `user` store 只持久化 `token` / `role`（`src/store/modules/user.js:53`），**`profile` 不落盘**；
- 补拉资料的动作写在前台**布局**里（`src/views/before/layout/index.vue:120-128`），且是 `async`；
- Vue 3 的挂载顺序是 **子组件 `mounted` 先于父组件**，所以 `confirm.vue` 读 `profile` 时它必定还是 `null`。

**实测复现**：硬刷新 `/order/confirm` → 收货人输入框 = `""`、手机号 = `""`（应为「测试用户」/`13800000002`）。

**改进建议**：确认页要有**自己的数据来源**，不能依赖布局的副作用。用 `watch` 兜住「资料迟到」的情况：

```js
import { watch } from 'vue'

/** 用 store 资料回填表单（资料可能晚于本页挂载到位，故用 watch + immediate 兜住） */
function fillFromProfile(profile) {
  if (!profile) return
  form.name = form.name || profile.nickname || ''
  form.phone = form.phone || profile.phone || ''
}

watch(() => userStore.profile, fillFromProfile, { immediate: true })

onMounted(async () => {
  if (userStore.isLogin && !userStore.profile) {
    try {
      userStore.updateProfile(await getUserProfileApi())
    } catch (error) {
      /* 登录态异常由 request.js 统一处理 */
    }
  }
})
```

> 更彻底的做法是把「补拉 profile」从布局上提到一个全局初始化流程（如 `router.beforeEach` 首次进入需登录页时 `await` 一次），让所有页面免于竞态。

---

### 3.2 【🟠 中】`props: true` 与组件未声明 `defineProps` 不一致 → 路由参数泄漏到 DOM

**位置**：
- `src/router/modules/before.js:30`（商品详情）、`:55`（订单详情）配了 `props: true`
- 但 `src/views/before/goods/detail.vue`、`src/views/before/order/detail.vue` **均无 `defineProps`**

**后果**：Vue 把未声明的 props 归入 `$attrs`，**自动落到根元素上**。实测商品详情页根节点渲染为：

```html
<div class="detail" id="1025">     <!-- ← 商品 id 被当作 HTML 属性写进 DOM -->
```

**对照**：`src/views/admin/goods/edit.vue`、`src/views/admin/order/detail.vue` 都正确声明了 `defineProps` —— 两处前台页面属于**遗漏**，导致同一套路由约定在前后台行为不一致。

**改进建议**（二选一，推荐前者）：

```js
// 方案 A：正确接收（与 admin 侧保持一致，推荐）
const props = defineProps({ id: { type: [String, Number], required: true } })
// 之后用 props.id

// 方案 B：既然组件内部是通过 route.params 取值的，就把路由的 props: true 删掉
```

同时建议加一条 lint 防线：`vue/no-unused-properties` 或直接在 `defineProps` 中体现，避免以后继续漏。

---

## 4. 🟠 服务端校验缺失（Mock 层信任前端）

### 4.1 【🟠 中】注册 / 改资料接口零服务端校验

**位置**：`src/mock/modules/before-auth.js:34-56`（注册）、`:67-79`（改资料）

```js
if (!username || !password) return fail('用户名和密码不能为空', 400)
if (db.users.some((u) => u.username === username)) return fail('该用户名已被注册', 400)
// 之后就直接入库了 —— 手机号格式、昵称长度、密码强度全不管
```

**实测复现**：`{ username: 'a', password: '1', phone: 'not-a-phone', nickname: 'x'.repeat(500) }` **全部通过并注册成功**。

而前端 `src/views/before/register/index.vue:100-104` 是有 `USERNAME_RULE`（4-16 位）、`PASSWORD_RULE`（6-20 位）、`PHONE_RULE` 的 —— **前端拦得住，绕过前端就拦不住**。

**改进建议**：把前端正则上提到共享常量（`src/utils/validate.js` 已导出 `USERNAME_RULE` 等，Mock 层可直接 import 同一份正则，保证前后端口径永远一致）：

```js
// src/mock/modules/before-auth.js 顶部
import { USERNAME_RULE, PASSWORD_RULE, PHONE_RULE } from '../../utils/validate.js'

// register 内，在用户名查重前插入：
if (!USERNAME_RULE.pattern.test(username)) return fail('用户名为 4-16 位字母、数字或下划线', 400)
if (!PASSWORD_RULE.pattern.test(password)) return fail('密码为 6-20 位且不含空格', 400)
if (phone && !PHONE_RULE.pattern.test(phone)) return fail('请输入正确的手机号', 400)
if (nickname && String(nickname).length > 20) return fail('昵称不能超过 20 个字符', 400)
```

> 复用同一份规则对象是这里的关键 —— 它把「前后端规则漂移」这个长期隐患一次性消除，也让 Mock 层有了真正的「后端感」。

### 4.2 【🟠 中】商品可创建/更新为负价格、负库存

**位置**：`src/mock/modules/goods.js:94-95`（create）、`:119-120`（update）

```js
price: Number(price) || 0,     // -100 是 truthy，原样写入
stock: Number(stock) || 0,     // -50 同理
// update 分支完全无下界：goods.price = Number(rest.price)
```

**实测复现**：`POST /api/goods/create` `{ price: -100, stock: -50 }` → `code:0`，负值商品入库。

**改进建议**：抽一个数值净化函数，create / update 共用：

```js
// src/mock/modules/goods.js 顶部
/**
 * 校验并归一化非负数值
 * @param {*} value 原始值
 * @param {string} label 字段名（用于错误信息）
 * @returns {{value:number}|{error:string}}
 */
function toNonNegative(value, label) {
  const n = Number(value)
  if (value === '' || value === undefined || value === null) return { value: 0 }
  if (!Number.isFinite(n) || n < 0) return { error: `${label}必须为不小于 0 的数值` }
  return { value: n }
}
```

配合 1.1 的 `requireUser` 一起加在写接口上。

---

## 5. 🟠 错误处理

### 5.1 【🟠 中】拦截器只处理 401，其余状态码直接抛英文原文

**位置**：`src/api/request.js:46-60`

```js
} else {
  ElMessage.error(error.message || '网络异常')   // 403 → "Request failed with status code 403"
}
```

404 / 500 / 超时（`ECONNABORTED`）全部走这一支，用户看到的是 axios 的英文报错。

**更关键的是业务侧全空白**：`src/utils/constants.js:34-39` 定义了 `ERROR_MAP`（401/403/404/500 的中文文案），但**全项目零引用**。

**改进建议**：让拦截器消费 `ERROR_MAP`：

```js
import { ERROR_MAP, SUCCESS_CODE } from '@/utils/constants'

const status = error.response?.status
if (status === 401) {
  /* 见 1.3 */
} else if (status && ERROR_MAP[status]) {
  ElMessage.error(ERROR_MAP[status])
} else if (error.code === 'ECONNABORTED') {
  ElMessage.error('请求超时，请稍后重试')
} else {
  ElMessage.error('网络异常，请检查网络连接')
}
```

### 5.2 【🟡 低】业务失败路径丢失原始错误上下文

**位置**：`src/api/request.js:43-44`

```js
ElMessage.error(res.message || '请求失败')
return Promise.reject(new Error(res.message || 'Error'))
```

抛出的 `Error` 只带 `message`，**丢掉了 `code`**。调用方若想按 `code` 分支处理（如 `403` 单独展示、`404` 触发兜底 UI）就只能去解析字符串。建议挂上原始响应：

```js
const err = new Error(res.message || 'Error')
err.code = res.code
err.response = res
return Promise.reject(err)
```

---

## 6. 🟠 规范符合度偏差

### 6.1 【🟠 中】1 处硬编码色值（违反 CLAUDE.md 第 7 章）

**位置**：`src/views/before/home/index.vue:62-63`

```js
/** 分类入口的圆点配色（视觉点缀，与商品类型无业务绑定） */
const dotColors = ['#4a7cf7', '#20b2aa', '#f2994a', '#eb5757', '#9b51e0', '#27ae60']
```

注释已说明「视觉点缀」，但第 7 章的要求是「业务样式禁止硬编码色值」，且项目已有 `src/utils/theme.js` 的 `getThemeColors()`（从 Element Plus CSS 变量读数喂 ECharts）—— 这里是**同类问题用两套解法**。

**改进建议**：把圆点色也收进 CSS 变量，用 `nth-child` 而非 JS 数组：

```scss
.home__cat-item {
  @each $i, $c in ('1': var(--el-color-primary), '2': var(--el-color-success),
                   '3': var(--el-color-warning), '4': var(--el-color-danger),
                   '5': var(--el-color-info), '6': var(--el-color-primary-dark-2)) {
    // 或直接在 variables.scss 定义 $dot-colors，保持「色值集中管理」这一条精神
  }
}
```

最低成本方案：新增 `src/assets/styles/variables.scss` 里的 `$dot-colors` 列表，`home/index.vue` 引入后使用，把色值从组件挪到唯一的样式真理源。

### 6.2 【🟠 中】2 个文件超出「单文件 > 300 行必须拆」阈值

| 文件 | 行数 | 建议 |
|---|---|---|
| `src/views/before/cart/index.vue` | **358** | 桌面 `el-table` 与窄屏 `.cart__cards` 是两套并列模板，抽成 `CartTable.vue` + `CartCards.vue`；结算栏（合计 + 去结算）抽 `CartSummary.vue` |
| `src/mock/db.js` | **321** | 与「演示数据种子」职责分离：`db.seed.js`（种子生成）+ `db.js`（容器/取值），`buildCover` / `buildBanner` 移到 `mock/svg.js` |

> 附注：`src/views/before/layout/index.vue` 已到 **299 行**，紧贴阈值，后续加功能前建议先拆（顶栏 `SiteHeader` + 页脚 `SiteFooter` 是天然切分点）。

### 6.3 【🟠 中】`eslint.config.js` 注释与规则自相矛盾

**位置**：`eslint.config.js:43-44`

```js
// 允许在模板中使用 v-for 的 index（静态列表场景）   ← 注释这么写
'vue/require-v-for-key': 'error'                    ← 规则却是「必须有 key」
```

两条说明的是**完全不相干的事**，注释明显是从别处复制残留。这类注释比没有注释更危险 —— 后来者会按注释去写 `v-for` 而不加 `:key`，然后被 lint 拦下，再怀疑配置坏了。

**改进建议**：改成与规则一致的表述：

```js
// 强制 v-for 必须带 :key（禁止使用 index 作 key 的写法需配合 vue/no-v-for-template-key）
'vue/require-v-for-key': 'error'
```

### 6.4 【🟡 低】`unplugin-auto-import` 配置了但完全未生效

**位置**：`vite.config.js:8,20`

```js
import AutoImport from 'unplugin-auto-import/vite'
AutoImport({ imports: ['vue', 'vue-router', 'pinia'] }),
```

但全项目 `from 'vue'` 的显式导入有 **42 处** —— 说明团队一直是手写导入的，这个插件只贡献了构建期开销与心智负担（新人会困惑「到底要不要 import」）。

**改进建议**：二选一，别停在中间态。
- **推荐**：删掉 `AutoImport` 与其依赖。显式导入可读性更好，也和「禁止隐式魔法」的项目风格一致，还能少一个插件依赖、降低 Vite 依赖图变化触发重新预构建的风险（见项目记忆里的预构建崩溃史）。
- 或者：真用起来（但需同步重构 42 处，收益不大，不建议）。

---

## 7. 🟡 可维护性：死代码与未使用资源

| # | 位置 | 规模 | 说明 |
|---|---|---|---|
| 1 | `src/utils/storage.js` | 75 行 | **全项目零引用**。`localStorage` 封装（前缀 `ecom_`）与 Pinia 持久化的 key（`user`/`cart`/`app`）**不同源**，即使将来要用也得先统一前缀策略。建议删除，或改造为 Pinia 持久化的自定义 storage 并真正接入 |
| 2 | `src/store/modules/order.js` | 44 行 | `useOrderStore` **零引用**（全项目仅此文件自身出现 1 次）。`confirm.vue` 是直接用 `cartStore` 的。建议删除；若想保留「购物车→确认页」的解耦设计，则应真正在 `confirm.vue` 中接入 |
| 3 | `src/store/modules/app.js:14,25-27,29,31` | ~6 行 | `theme` ref 与 `setTheme()` **从未被调用**（无任何深色模式实现），却写进了 `persist.pick: ['sidebarCollapsed', 'theme']` —— 持久化了一个恒为 `'light'` 的死 key |
| 4 | `src/utils/constants.js:33-39` | 7 行 | `ERROR_MAP` 零引用（见 5.1，修好拦截器后即可「复活」） |

**SCSS 未使用变量**（`src/assets/styles/variables.scss`，共 6 个，全部 0 引用）：

| 变量 | 行号 |
|---|---|
| `$color-success` | :8 |
| `$color-warning` | :9 |
| `$text-regular` | :19 |
| `$text-secondary` | :20 |
| `$border-color` | :21 |
| `$footer-height` | :26 |

> 处置建议：`$color-success` / `$color-warning` / `$border-color` 属「合理预留」（Element Plus 语义色对齐），可保留并在注释中标注「预留」；`$text-regular` / `$text-secondary` 与已用的 `$text-primary` 不成套，建议补齐使用或删除；`$footer-height` 与已用的 `$header-height` 成对，属真实遗漏 —— 建议在 `layout/index.vue` 的页脚样式里用上，让布局常量成体系。

**过时注释**（3 处，`骨架占位` 已完成但注释未清理）：

| 位置 | 现注释 |
|---|---|
| `src/router/modules/before.js:5` | `注意：骨架占位 —— 对应的 views/before/** 页面文件需按此路径创建` |
| `src/router/modules/admin.js:5` | `注意：骨架占位 —— 对应的 views/admin/** 页面文件需按此路径创建` |
| `src/store/modules/user.js:4` | `骨架占位：登录/登出接口待接入 api/before/auth.js、api/admin/auth.js` |

另有一处**技术方案已变更但注释未更新**：`src/mock/helpers.js:4`

```js
* 说明：本文件位于 mockPath 之外，不会被 vite-plugin-mock 当作接口文件加载   ← vite-plugin-mock 早已弃用
```

应改为：`说明：本文件位于 mockPath（src/mock/modules）之外，不会被 Mock 中间件当作接口文件加载`。

---

## 8. 🟠 工程与交付

### 8.1 【🟠 中】生产构建不含 Mock，`npm run preview` 得到的是「无数据空壳」

**位置**：`vite.config.js:37`（`enabled: command === 'serve' && useMock`）+ `.env.production`（`VITE_USE_MOCK=false`）

Mock 中间件**只在 `dev` 生效**，`build` 产物里没有任何后端。而 `README.md:40-44` 的「快速开始」第 3、4 步是：

```
# 3. 生产构建
npm run build
# 4. 本地预览生产构建
npm run preview
```

照做会打开一个**接口全 404 的页面** —— 对课程设计交付（老师可能直接跑 preview 验收）是实打实的风险。

**改进建议**（按投入排序）：
1. **最低成本**：README 里给这两步加上醒目提示 —— 「本方案数据依赖 Mock，验收请使用 `npm run dev`；`preview` 仅用于校验产物可加载」。并在 `.env.production` 顶部注释同样说明。
2. **中等成本**：让 Mock 中间件也挂到 `preview`（Vite 的 `configurePreviewServer` 钩子），这样 `vite preview` 也能有完整数据。
3. **最稳**：把 Mock 层打包成纯前端 mock（如 axios adapter 拦截），这样静态托管也能跑。

### 8.2 【🟡 低】`VITE_USE_MOCK` 只影响 dev

`VITE_USE_MOCK=false` 这个开关在 dev 下能关 Mock，但在 build 下**无论真假都不含 Mock**，开关语义不对称，容易让人误以为 build 也能带 Mock。建议在 `.env.production` 注释里写明这一点。

---

## 9. ✅ 做得好的地方（建议在答辩/文档中保留）

审阅中有不少实现明显是「想过」的，值得点名：

1. **`/api/order/cancel` 的库存回滚**（`order.js:99-105`）—— `sales` 用 `Math.max(0, ...)` 兜底，考虑到了销量不被扣成负数。
2. **`order/status` 白名单式 update**（`goods.js:114-121`）—— 逐字段显式赋值而非 `Object.assign`，天然免疫「越权改 `sales`」这类批量赋值漏洞。
3. **`resolveSorter` 的兜底**（`goods.js:24-31`）—— 未命中排序策略时退回按 id 倒序，不抛错；且后台不传 `sortBy` 时行为与 P3 完全一致（无回归）。
4. **`publicUser()` 剔除密码**（`helpers.js:60-64`）—— 用解构 rest 而非黑名单删除，新增敏感字段默认不会泄漏。
5. **`useEcharts` + `getThemeColors()`** —— 图表主题色从 Element Plus CSS 变量读取，没有硬编码，是全项目最干净的一处「主题联动」。
6. **`GoodsCard.vue` 的插槽条件** `v-if="showActions || $slots.actions"` —— 这是个容易踩的坑（父级传了插槽但被默认行为遮住），处理得很细。
7. **`formatDate` 用 `replace(/-/g,'/')`**（`utils/format.js`）—— 规避了 Safari 对 `new Date('2026-10-10 12:00:00')` 的解析差异，属于跨端踩坑经验。
8. **Mock 中间件自研方案** —— 零临时文件、零删除动作，在受限环境下反而是最健壮的选择（比 `vite-plugin-mock` 强）。

---

## 10. 修复优先级建议

| 批次 | 内容 | 涉及文件 | 说明 |
|---|---|---|---|
| **第 1 批（安全底线）** | 1.1 写接口鉴权 + 1.2 守卫 role 短路 + 2.2 数量校验 | `mock/helpers.js`、`mock/modules/order.js`、`mock/modules/goods.js`、`router/guard.js` | 改动小、收益最大，能消掉 4 个 🔴 |
| **第 2 批（数据正确性）** | 2.1 下单两段式 + 2.3 统计排除取消单 | `mock/modules/order.js`、`mock/modules/stat.js` | 涉及业务流程，建议配套补 Mock 自测 |
| **第 3 批（服务端校验）** | 4.1 注册/资料校验 + 4.2 负数拦截 | `mock/modules/before-auth.js`、`mock/modules/goods.js` | 可复用 `utils/validate.js` 的正则，保证前后端口径一致 |
| **第 4 批（功能修复）** | 3.1 确认页回填竞态 + 3.2 props 声明 | `views/before/order/confirm.vue`、两个 `detail.vue` | 用户可感，演示时容易被发现 |
| **第 5 批（错误处理）** | 1.3 401 分流 + 5.1 ERROR_MAP 接入 | `api/request.js` | 注意 `router` 循环依赖，需懒引入 |
| **第 6 批（清理）** | 第 7 章死代码 + 6.3 注释 + 6.4 AutoImport + 8.1 README 提示 | 多处 | 纯清理，风险低 |
| **第 7 批（重构）** | 6.1 硬编码色值 + 6.2 超长文件拆分 | `home/index.vue`、`cart/index.vue`、`mock/db.js` | 工作量大，建议单独排期 |

---

## 附录 A：本次实证方法（可复现）

### A.1 接口层（curl 直打 Mock）

```bash
curl --noproxy '*' -s "http://127.0.0.1:5173/api/order/detail?id=2045"          # 匿名读他人订单 → code:0
curl --noproxy '*' -s -X PUT  "http://127.0.0.1:5173/api/order/status" \
  -H "Content-Type: application/json" -d '{"id":2045,"status":3}'               # 匿名改状态 → code:0
curl --noproxy '*' -s -X DELETE "http://127.0.0.1:5173/api/goods/delete?id=1025" # 匿名删商品
curl --noproxy '*' -s -X POST "http://127.0.0.1:5173/api/order/create" \
  -H "Content-Type: application/json" -H "Authorization: Bearer mock.2.user" \
  -d '{"items":[{"goodsId":1024,"count":-5}]}'                                  # 负数 → ¥-1810，库存+5
```

### A.2 UI 层（CDP 驱动真实 Chromium）

```bash
chrome.exe --headless=new --disable-gpu --no-sandbox \
  --remote-debugging-port=9223 --user-data-dir="<temp>" about:blank &
# Node 内置 WebSocket 连 CDP → Page.navigate + Runtime.evaluate(returnByValue)
# 1) 硬刷新 /order/confirm 后读 .confirm__form input 的 value → 均为 ""
# 2) 读商品详情页 document.querySelector('.detail').outerHTML → 根元素带 id="1025"
# 3) 只写 localStorage.user={"token":"mock.2.user"} 后访问 /admin/dashboard → 进入成功
```

### A.3 静态层

```bash
# 死代码引用计数
grep -rn "utils/storage" src/     # 0
grep -rn "useOrderStore"  src/    # 1（仅自身定义）
grep -rn "ERROR_MAP"      src/    # 0
# SCSS 变量引用计数（剔除变量定义文件本身）
for v in color-success color-warning text-regular text-secondary border-color footer-height; do
  grep -rn "\$$v\b" src/ --include=*.vue --include=*.scss | grep -v variables.scss | wc -l
done   # 全部为 0
```

---

## 附录 B：未取到有效结论的候选（供后续复核）

| 候选 | 状态 | 说明 |
|---|---|---|
| `PHONE_RULE` 对非必填字段留空是否误报「请输入正确的手机号」 | ❌ **已排除，非缺陷** | 查 `node_modules/async-validator/dist-node/index.js:628`：`if (isEmptyValue(value,'string') && !rule.required) return callback()` —— 空值 + 非必填会直接放过。`register/index.vue:104` 与 `admin/profile/index.vue:70` 的 `phone: [PHONE_RULE]` 属正确写法 |
| `cartStore.updateCount` 传 `NaN` 是否污染合计 | ⚠️ **理论存在、未复现** | `cart.js:59-67` 的 `if (count <= 0)` 对 `NaN` 为 `false`，会走到 `target.count = NaN`。但 Element Plus 的 `el-input-number` 在失焦时会归位，正常路径难以触发。属**健壮性加固项**，建议加一行：`if (!Number.isFinite(count)) return` |

---

*本报告为审查结论。修复进展见下方第 11 章。*

---

## 11. 修复记录

> 分两轮实施：**第 1+2 批**（安全底线 + 数据一致性，消掉全部 6 个 🔴）与 **第 3~7 批**（服务端校验、功能缺陷、错误处理、清理、重构）。两轮均附实测回归结果。

### 第 1 + 2 批（2026-10-10）—— 6 个 🔴 全部闭环

> 两批合并实施：改动集中在同一组 mock 文件，一次改完可消掉全部高优先级问题。

#### 改动清单（6 文件 / +153 −34 行）

| 文件 | 改动 |
|---|---|
| `src/mock/helpers.js` | 新增 `requireUser(req, users, needRole)` 守卫工厂（未登录 401 / 角色不符 403） |
| `src/mock/modules/order.js` | `/order/list` 加 admin 守卫；`/order/detail` 加登录 + 「本人或 admin」归属校验；`/order/status` 加 admin 守卫；`/order/create` **重写为两段式** |
| `src/mock/modules/goods.js` | 6 个写接口全部加 admin 守卫；新增 `toNonNegative()` 拦截负价格 / 负库存 |
| `src/mock/modules/category.js` | create / update / delete 补 admin 守卫（**落实过审查时漏掉的同类项**） |
| `src/mock/modules/stat.js` | 新增 `isCounted()`，金额 / 销量 / 品类分布统一排除 `status=4` |
| `src/router/guard.js` | 修复 `role` 判断短路（1.2） |

#### 对应的报告条目

| 报告条目 | 状态 |
|---|---|
| 1.1 Mock 写接口无鉴权 | ✅ 已修（含审查时漏掉的 `category.js`） |
| 1.2 守卫 `role` 短路 | ✅ 已修 |
| 2.1 下单无事务回滚 | ✅ 已修 |
| 2.2 数量无正负校验 | ✅ 已修 |
| 2.3 统计未排除取消单 | ✅ 已修 |
| 4.2 负价格 / 负库存 | ✅ 已修 |

#### 两个需要留意的设计决策

**1) `/order/create` 改为两段式**

```js
// ── 第一段：只读校验，不产生任何副作用 ──────────────
const plan = []
for (const item of items) {
  const count = Number(item?.count)
  if (!Number.isInteger(count) || count <= 0) return fail('商品数量必须为正整数', 400)
  const goods = db.goods.find((g) => g.id === Number(item.goodsId))
  if (!goods) return fail(`商品 ${item.goodsId} 不存在`, 400)
  // 同一商品出现多行时需累计需求量，否则各行分别通过校验、合计却超卖
  const demanded = plan.filter((p) => p.goods.id === goods.id).reduce((s, p) => s + p.count, 0)
  if (goods.stock < demanded + count) return fail(`「${goods.name}」库存不足`, 400)
  plan.push({ goods, count })
}

// ── 第二段：全部校验通过后才写库（等价于事务提交）────
const orderItems = plan.map(({ goods, count }) => {
  goods.stock -= count
  goods.sales += count
  return { goodsId: goods.id, goodsName: goods.name, price: goods.price, count, cover: goods.cover }
})
```

> **附带修掉一个报告未列的隐藏 bug**：原实现下 `[{goodsId:1,count:10},{goodsId:1,count:10}]` 在库存只有 15 时，两行**各自**都能通过 `stock < count` 校验，合计却扣 20 → 负库存。新的累计需求量校验堵住了它。

**2) 统计口径刻意拆成两套**

- `totalAmount` / 月度销量 / 品类分布 → **排除已取消**（与库存回滚保持一致）
- `overview.orderCount` → **保留全部订单**

理由：`db.js:245` 的种子订单里约 10% 是 `status=4`，若「订单总数」也排除取消单，它会**小于**「订单管理」页列表的条数，反而制造新的不一致。金额看有效订单、总数看全部订单，是能自圆其说的口径。

#### 验证结果（全部实测，非推断）

> 以下为**第 1+2 批当轮**的回归数字；追加第 3~7 批后的最终数字见本章末「全量验证结果」（接口 51/51、浏览器 21/21）。

**① 接口层 curl 回归 —— 34 / 34 PASS**

- 12 个匿名写接口（order / goods / category 全量）→ 全部 `401`
- 4 个普通用户越权调管理员接口 → 全部 `403`
- 跨用户读订单详情 → `403`（修复前是 `0` 且返回隐私字段）
- 下单 `count = -5 / 0 / 1.5 / 'abc'` → 全部 `400`，且**库存纹丝不动**（修复前 `-5` 会「刷多」5 件）
- 中途失败（合法商品 + 不存在商品）→ `400` 且库存不变（修复前库存凭空少 3 件）
- 同商品重复行合计超卖 → `400`
- 合法下单 → `0` 且正确扣减 1 件
- 负价格 / 负库存创建与更新 → 全部 `400`
- 取消订单后总销售额同步下降（`¥310252 → ¥309890`，差额 = 订单金额 `¥362`）✅

**② 浏览器层 CDP 回归 —— 6 / 6 PASS**

- 管理员（token + role）进 `/admin/dashboard` → 正常渲染
- **只有 token、无 role 的登录态进后台 → 被拦到 `/404`**（原漏洞已堵）
- `user` 角色进后台 → `/404`
- 未登录进后台 → `/admin/login?redirect=/admin/dashboard`
- `user` 角色访问 `/user/profile` → 正常（**正常路径未被误伤**）

**③ 静态检查**：ESLint 零告警；Prettier 全通过。

#### 关于「行为变化面」的说明

`guard.js` 的修改**严格只影响漏洞场景**。已确认：管理员访问 `role: 'user'` 的前台页（如 `/cart`）在**修复前后同样**返回 `/404` —— 因为旧写法对「有 role 但不匹配」本就拦截。所以本次改动没有引入新的回归面。

### 第 3 ~ 7 批（2026-10-10）—— 中低优先级问题全部闭环

#### 第 3 批：服务端校验

| 文件 | 改动 |
|---|---|
| `src/utils/validate.js` | 新增 `NICKNAME_MAX` 常量与 `checkNickname()` / `checkPhone()` 两个纯函数 —— **前端表单校验与 Mock 服务端共用同一份实现**，从根上消除前后端规则漂移 |
| `src/mock/modules/before-auth.js` | 注册接口补：用户名正则、密码正则、手机号格式、昵称长度；改资料接口补：昵称非空 + 长度、手机号格式 |
| `src/mock/modules/admin-auth.js` | 改资料接口补同样的昵称 / 手机号校验 |
| `src/views/before/register/index.vue` | 昵称输入框补 `:maxlength="NICKNAME_MAX"` + 复用 `checkNickname` 的客户端规则（**此前注册页昵称输入框完全没有长度限制**，这正是实测漏洞的入口） |
| `src/views/admin/profile/index.vue`、`src/views/before/user/profile.vue` | `maxlength="20"` 改为绑定 `NICKNAME_MAX`，避免写死后与常量漂移 |

**顺带修正一个语义问题**：`admin-auth.js` 原本对「已登录但不是管理员」返回 **401**（附带误导性文案「未登录或登录已过期」），正确语义应是 **403**。现统一走 `requireUser(..., 'admin')`。

#### 第 4 批：功能缺陷

| 文件 | 改动 |
|---|---|
| `src/views/before/order/confirm.vue` | 用 `watch(() => userStore.profile, fillFromProfile, { immediate: true })` + 本页自行补拉资料，替代原来「只在 `onMounted` 里读一次」的写法 |
| `src/views/before/goods/detail.vue`、`src/views/before/order/detail.vue` | 补 `defineProps({ id })` 并改用 `props.id`，消除路由参数作为 `$attrs` 落到根元素的问题；与 admin 侧两个详情页写法统一 |

> `confirm.vue` 的根因值得记录：**Vue 3 中子组件的 `mounted` 早于父组件**，而补拉资料的逻辑写在父布局（`before/layout/index.vue`）里且是异步的 —— 所以子页面在 `onMounted` 里读 `userStore.profile` 时它**必然是 `null`**。改为 `watch` 后，资料无论何时到位都会回填。

#### 第 5 批：错误处理（含一个报告漏掉的真实 bug）

**⚠️ 新发现**：Mock 中间件一律返回 **HTTP 200**、把错误码放在 body 里（`build/mock-server-plugin.js:167`），所以 `request.js` 里那个 `status === 401` 分支**从来没有执行过**。后果是 —— **token 过期时前端既不清登录态、也不跳登录页，只弹一条提示就卡在已经加载不出数据的页面上**。

| 文件 | 改动 |
|---|---|
| `src/api/request.js` | ① 在**业务码分支**里也处理 `code === 401`（清登录态 + 按区域回跳），并在 HTTP 状态分支保留处理以兼容真实后端；② 401 按所在区域分流到 `/admin/login` 或 `/login`（原来一律甩到前台登录页），并带 `redirect`；③ `router` 改为**动态 `import()` 懒加载**，避开 `request ← store ← guard ← router` 的依赖环；④ 并发 401 用 `redirecting` 标记去重，避免多条提示、多次跳转；⑤ 接入 `ERROR_MAP` 处理 403/404/500，补 `ECONNABORTED` 超时文案；⑥ 业务失败时把 `code` 挂到抛出的 `Error` 上 |
| `src/utils/constants.js` | `ERROR_MAP` 去掉 401（由拦截器单独处理并注明原因）——这个此前零引用的常量现在真正被消费了 |

#### 第 6 批：死代码与文档

| 项 | 改动 |
|---|---|
| `src/utils/storage.js`（75 行） | **删除** —— 全项目零引用，且其 `ecom_` 前缀与 Pinia 持久化的 key 不同源 |
| `src/store/modules/order.js`（44 行） | **删除** —— `useOrderStore` 零引用（确认页实际直接用 `cartStore`） |
| `src/store/modules/app.js` | 移除从未被调用的 `theme` / `setTheme`，以及持久化列表里那个恒为 `'light'` 的死 key |
| `src/assets/styles/variables.scss` | 移除死变量 `$footer-height`；`$color-success` / `$color-warning` / `$text-regular` / `$text-secondary` / `$border-color` 归入**显式标注的「预留令牌」**分组（设计令牌文件保留未用色值是合理的，关键是把「刻意预留」与「意外遗漏」区分开） |
| 4 处过时注释 | 2 个 router 模块的「骨架占位」改为 `props: true` 的正确用法说明；`store/modules/user.js` 的「登录/登出接口待接入」删除并改写；`mock/helpers.js` 里「不会被 vite-plugin-mock 加载」改为当前的 Mock 中间件（**该方案早已弃用**） |
| `vite.config.js` + `package.json` | 移除 `unplugin-auto-import` —— 它配置了却从未生效（全项目 42 处仍是显式 `from 'vue'`），只贡献构建期开销与心智负担 |
| `README.md` | 「快速开始」加醒目提示：**验收 / 演示请用 `npm run dev`**，`preview` 会得到接口全 404 的空壳页；环境变量章节补充 `VITE_USE_MOCK` 只对 dev 生效的说明 |

#### 第 7 批：色值收敛 + 超长文件拆分

**7.1 硬编码色值**（唯一一处违反第 7 章）

`src/views/before/home/index.vue` 的 `dotColors` JS 数组已删除，色值移入 `variables.scss` 的 `$dot-colors`（map 形式），组件侧改用纯 CSS 的 `:nth-child` 循环取色：

```scss
// variables.scss
$dot-colors: (1: #4a7cf7, 2: #20b2aa, 3: #f2994a, 4: #eb5757, 5: #9b51e0, 6: #27ae60);

// home/index.vue
@each $index, $color in $dot-colors {
  .home__cats .home__cat:nth-child(#{length($dot-colors)}n + #{$index}) .home__cat-dot {
    background: $color;
  }
}
```

> 用 map 而非扁平列表是有意为之：`@each $i, $c in (a, b, c)` 这种写法会把色值本身当成 `$i`，解构出来是错的。
> 同时 `v-for` 不再需要 `index`，模板更干净。

**7.2 超长文件拆分**

| 原文件 | 行数 | 拆分结果 |
|---|---|---|
| `src/views/before/cart/index.vue` | 358 | `index.vue`（135，编排 + 业务逻辑）、`CartTable.vue`（103，桌面表格）、`CartCards.vue`（118，窄屏卡片）、`CartSummary.vue`（84，结算栏）。三个子组件均为**纯展示 + emit 外抛**，不直接读写 store |
| `src/mock/db.js` | 321 | `db.js`（30，只留容器与 `getDb` 单例）、`seed.js`（242，种子数据 + `createSeed`）、`svg.js`（67，占位图 DataURL 生成） |

拆分后**全项目最大文件为 `views/before/layout/index.vue` 的 299 行**，已无文件超过 300 行阈值。

### 全量验证结果（2026-10-10，全部实测）

| 维度 | 结果 |
|---|---|
| 接口回归（curl，覆盖第 1~3 批） | **51 / 51 PASS** |
| 浏览器回归（CDP 驱动真实 Chromium，覆盖第 1、4、5、7 批） | **21 / 21 PASS** |
| ESLint | 零告警 |
| Prettier | 全通过 |
| `npm run build` | 成功，86 个 chunk，三个 vendor 拆包体积与修复前一致 |

浏览器回归覆盖的关键断言：

- 管理员进后台正常；**无 role 的登录态被拦到 `/404`**；`user` 角色进后台 `/404`；未登录跳 `/admin/login?redirect=...`
- **失效 token 访问 `/user/profile` → 跳 `/login` 且登录态被清空**（验证第 5 批的商业码 401 处理）
- **硬刷新 `/order/confirm` 后收货人 = 「测试用户」、手机号 = `13800000002`**（验证第 4 批竞态修复）
- **商品详情根元素不再泄漏 `id` 属性**（`document.getElementById('1024') === null`）
- 购物车：1440px 渲染 `el-table`、375px 渲染卡片，且窄屏无横向溢出
- 首页 6 个分类圆点均已着色且颜色循环生效（验证 SCSS `nth-child` 方案）
- 注册页昵称输入框 `maxLength === 20`

### 修复后的文件变更总览

- **修改 29 个**、**删除 2 个**、**新增 5 个**（`mock/seed.js`、`mock/svg.js`、`cart/CartTable.vue`、`cart/CartCards.vue`、`cart/CartSummary.vue`）
- 外加审查报告本体 `docs/code-review-2026-10-10.md`

### 尚未处理（明确不在本次范围）

以下不是缺陷，而是**本次刻意未动的既有状态**，需要单独决策：

1. **管理员访问 `role: 'user'` 的前台页会被拦到 `/404`** —— 修复前后行为一致（属既有设计），但「管理员不能逛前台店铺」是否合理值得再确认。
2. **`docs/screenshots/` 的 26 张截图未重拍** —— 本次改动**刻意保持了视觉零变化**（圆点颜色沿用原色值、页脚未加高度约束），因此截图仍然有效；但若后续调整视觉，需要重拍。
3. **Mock 层的数据仍是进程内存态** —— 重启 dev server 即重置，这是既定设计。


