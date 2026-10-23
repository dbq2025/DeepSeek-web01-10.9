# 前端界面视觉改造方案（v2.0 设计升级）

> 适用工程：`D:\WorkBuddy\前端02\Code`（注意：工程根在 `Code/`，所有 npm 命令必须先 `cd Code`）
> 编写日期：2026-10-23 ｜ 基线提交：`055c45d`（main 分支）
> 本文档面向「新会话直接照此执行」，不依赖上下文记忆。

---

## 0. 一页速览

| 项 | 内容 |
| --- | --- |
| 改造目标 | 在**不改动任何业务逻辑、接口、路由、状态管理**的前提下，把界面从「Element Plus 默认外观」升级为有明确设计系统的成品外观 |
| 改造手段 | 换掉设计令牌（颜色/圆角/阴影/字号/间距）→ 升级 6 个共享基元组件 → 重排 3 个门面页 → 统一其余页面 |
| 影响面 | 新增 11 个文件，改造 24 个文件；**0 新增依赖**，`package.json` 不变 |
| 分 5 个阶段 | P0 令牌基座 → P1 后台骨架与看板 → P2 前台首屏与商品卡 → P3 全站统一 → P4 动效与验收 |
| 关键约束 | 禁止新增 npm 依赖；禁止改 `vite.config.js` 的 SCSS 注入；禁止硬编码色值；单文件 ≤ 300 行 |
| 回退方式 | 每阶段一个 commit + 一个 tag（`ui-p0` ~ `ui-p4`），按阶段 `git revert` 可完整回退 |

---

## 1. 现状盘点（决定方案形态的依据）

### 1.1 工程事实

- 技术栈：Vue 3.5 + Vite 5 + Element Plus 2.8（**全量注册**）+ Pinia 3 + ECharts 5（按需引入）+ SCSS。
- 源码规模：82 个文件 / 9566 行；最大文件 `views/before/layout/index.vue`（299 行，逼近 300 行硬阈值）。
- 样式链路：`vite.config.js` 的 `additionalData` 已把 `variables.scss` + `mixins.scss` 注入每个 SFC 的 `<style lang="scss">`。
- 样式复用：`@include card-surface` 在 **20 处**被复用（后台 7、前台 13），全站**已无硬编码十六进制色值**（`grep` 已验证，仅 `variables.scss` / `mock/svg.js` 内定义）。
- 数据层：纯前端 Mock，商品图与轮播图由 `src/mock/svg.js` 生成内联 SVG DataURL（**离线、确定性**，这是刻意设计，不要改成外链图片）。

### 1.2 视觉问题的真实成因

> 结论：**不是 CSS 写得乱，而是设计变量的取值本身就是「默认值」**。所以逐页改 CSS 是最差的解法，改令牌是最高杠杆的解法。

| 现象（截图证据） | 成因 | 归属层 |
| --- | --- | --- |
| 全站一片 `#409EFF` 蓝，KPI 卡红/绿/橙图标直接取自语义色 | `variables.scss` 主色 = Element 默认主色，`element-override.scss` 只覆盖了 1 个变量 | 令牌层 |
| 卡片全是「白底 + 1px 灰边 + 4/6px 圆角 + 无阴影」 | `mixins.scss` 的 `card-surface` 只有 `border` 没有 `shadow`，圆角 6px | 基元层 |
| 指标数值只有 22px/600，标签 13px，看不出层级 | `StatCard.vue` 单一尺寸，无辅助信息位 | 基元层 |
| 图表卡下方约 120px 空白、页面底部大片灰 | 图表固定 `height:320px`，页面无最小高度/栅格拉伸 | 页面层 |
| 双 Y 轴刻度 0–40 与 0–120000 不对齐、图例挤在底部 | `dashboard/index.vue` 直接用 ECharts 默认 `splitNumber` | 图表层 |
| 首屏蓝块 + 红块拼接、文案只有一行 | `buildBanner()` 只画纯色矩形 + 一行文字；页面用 `el-carousel` 直接塞 `<img>` | 素材层 + 页面层 |
| 商品卡纯色块 + "NO IMAGE"、价格被裁切 | `buildCover()` 画纯色块并显式写 "NO IMAGE"；卡片封面 `aspect-ratio: 1/1` 过高 | 素材层 + 基元层 |
| 全站只有 14px 一档字号 | 无字号令牌，组件内散写 12/13/14/15/17/22 | 令牌层 |

### 1.3 可复用的既有资产（必须保留）

| 资产 | 位置 | 价值 |
| --- | --- | --- |
| 令牌注入机制 | `vite.config.js` → `additionalData` + `loadPaths` | 组件内可直接用 `$变量` / `@include`，改造无需改导入 |
| 卡片混入 | `mixins.scss` → `card-surface` | 改一处 = 20 处同步升级 |
| CSS 变量桥 | `utils/theme.js` → `getThemeColors()` | ECharts 不硬编码色值，换主题图表自动跟随 |
| 图表生命周期 | `composables/useEcharts.js` | resize / dispose 已封装，只需扩展主题与 ResizeObserver |
| 通用组件 | `components/common/`（DataTable / SearchForm / Pagination / EmptyState / StatusTag / FormDialog / ImageUpload） | 列表页视觉统一只需改这 4 个的样式 |
| 确定性 Mock | `seed.js` 固定种子 `20261009` + `svg.js` 内联图 | 截图对比可复现，不依赖网络 |

---

## 2. 改造目标与范围

### 2.1 目标（可验收）

1. **去默认感**：全站不再出现 `#409EFF`；卡片、按钮、输入框、表格、菜单的圆角/阴影/间距来自统一令牌。
2. **建立层级**：每页具备「页面标题 → 区块标题 → 正文 → 辅助信息」四级排版；指标数字 ≥ 30px 且等宽对齐。
3. **门面达标**：`/admin/dashboard` 与 `/home` 两页在 1440×900 下无大于 80px 的无意义留白，首屏有明确视觉焦点。
4. **素材可信**：商品图/轮播图不再是纯色块 + "NO IMAGE"，改为有设计感的抽象占位图（仍为内联 SVG）。
5. **零功能回归**：14 条核心功能用例全部通过（见 §7.2）。
6. **零新增依赖**：`git diff package.json` 为空。

### 2.2 范围（明确不做）

| 不做 | 理由 |
| --- | --- |
| 不引入 Tailwind / UnoCSS / Naive UI / 动画库 | 依赖图一旦变化会触发 Vite 预构建清理缓存，本项目环境会直接崩（见 §9 环境铁律） |
| 不做暗色模式 | 课设验收不需要；暗色需重定义 ~40 个变量并逐页验证对比度，性价比低。令牌层已预留（`:root` 集中定义），后续加 `[data-theme=dark]` 即可 |
| 不改任何 `api/` / `mock/modules/` 的接口契约 | 仅 `mock/svg.js`、`mock/seed.js` 的**图片生成与字段补充**属视觉素材层，接口 URL 与方法不变 |
| 不改路由、守护、Pinia、`useTable` | 改造只发生在样式层、基元组件、页面模板结构 |
| 不引入外部图片/字体 CDN | 破坏离线确定性与截图可复现性 |

---

## 3. 设计方向与关键取舍

### 3.1 选定方向：**「墨蓝 · 冷灰」（方案 A）**

| 维度 | 取值 | 理由 |
| --- | --- | --- |
| 主色 | `#3355E0` 墨蓝 | 比 Element 的 `#409EFF` 更深、饱和度更低。`#409EFF` 是 2016 年的「科技蓝」，对比赛项目已普遍弃用；墨蓝在大面积使用时更稳，且与价格红形成冷暖对比 |
| 中性色 | 冷灰（色相 220、低饱和） | 白色卡片要「浮起来」必须靠背景灰的色相偏冷；暖灰会让界面发黄、显旧 |
| 价格色 | 保留 `#E93B3D` | 国内电商惯例（红涨/红价），已有令牌 `$color-price`，不动 |
| 强调色 | `#F97316` 仅用于「热销/限时」角标 | 全局只允许出现在 badge，避免第二个主色稀释品牌感 |
| 卡片策略 | **阴影优先，边框退居表格内部** | 1px 边框铺满全站是「Excel 感」的主要来源；卡片用 `shadow-1`，列表内部才用 hairline |
| 圆角 | 卡片 12 / 控件 8 / 标签 6 / 胶囊 999 | 4px 像后台模板，16px 像消费级 App；12px 是「专业但不呆板」的平衡点 |
| 字号 | 只允许 5 档：12 / 13 / 14 / 16 / 20 / 30 | 现状 6 档且混用，收敛到 5 档是「有设计感」成本最低的手段 |
| 动效 | 统一 160ms / `cubic-bezier(.2,.8,.2,1)`，只动 `transform` + `opacity` | 避免布局抖动；不引入动画库 |

**方案 B（备选，不默认执行）**：石墨灰 + 单一强调色（`#18181B` 主色、`#6366F1` 强调），shadcn 风格。切换成本 = 只改 `variables.scss` 里 3 个色值 + 侧边栏深浅，其余不动。若答辩希望更「极简克制」可选 B。

### 3.2 关键取舍与风险

| 取舍 | 选择 | 代价 / 风险 | 缓解 |
| --- | --- | --- | --- |
| 侧边栏深色 vs 浅色 | **深色导航（`#111928`）** | 需覆盖 8 个 `--el-menu-*` 变量；折叠态图标对比度易不足 | 全量覆盖变量（不写 `:deep` 硬改）；折叠态图标用 `--app-text-3`，实测对比度 ≥ 4.5:1 |
| 商品图 1:1 → 4:3 | **改 4:3** | 卡片变矮，首页/搜索/收藏三处网格节奏同时变化 | 三处同一阶段改完；`aspect-ratio` 统一来自令牌 |
| 占位图去文字 | **纯抽象图形，不写商品名/NO IMAGE** | 失去「图上有商品名」的信息 | 名称本就在卡片正文，图上重复属冗余；详情页另有标题 |
| 轮播文案从 SVG 挪到 HTML | **HTML 叠加层** | 需改 `seed.js` 增加 `subtitle` / `cta` 字段 | 字段为**新增**，不改接口 URL 与返回结构主干，前端 `v-if` 兜底旧数据 |
| 看板加「时间范围」筛选 | **做，且真生效**（对 6 个月数组做切片） | 若做成纯装饰按钮就是造假 | 用 `computed` 切片 `salesByMonth`，切换即重渲染，无新接口 |
| 是否加「导出」按钮 | **不加** | 无对应能力，加了就是假按钮 | 改为展示「数据更新于 HH:mm」真实时间戳 |
| 是否加环比/同比 | **不加** | `getOverviewApi` 无历史数据，编造数字违反「结果真实可信」评分项 | KPI 副信息只用可推导的真实值（上架率、客单价、月均） |

---

## 4. 设计令牌（唯一真源）

### 4.1 文件职责

| 文件 | 职责 | 是否新建 |
| --- | --- | --- |
| `src/assets/styles/variables.scss` | SCSS 值（**唯一色值出处**） | 改造 |
| `src/assets/styles/tokens.scss` | 把 SCSS 值输出为 `--app-*` CSS 变量 | **新建** |
| `src/assets/styles/element-override.scss` | 把 `--app-*` 映射到 `--el-*` + 组件级规则 | 改造 |
| `src/assets/styles/mixins.scss` | 升级 `card-surface`，新增 `hover-lift` / `metric-number` / `focus-ring` | 改造 |
| `src/assets/styles/motion.scss` | 时长/缓动令牌 + 2 个 keyframes | **新建** |
| `src/assets/styles/index.scss` | 引入顺序：`tokens` → `motion` → `element-override` | 改造 |

> ⚠️ **关键坑**：只有被 Vite 当作「入口样式」处理的文件才会获得 `additionalData` 注入。被 `index.scss` 以 `@use` 引入的文件属于独立编译单元，**必须在文件头自行写 `@use 'variables' as *;`**（`element-override.scss` 已是这个写法）。`tokens.scss` / `motion.scss` 必须照做，否则变量未定义直接编译失败。

### 4.2 颜色令牌

```scss
// variables.scss —— 主色与语义色
$color-primary: #3355e0;
$color-primary-dark-2: #2944b3;
$color-primary-light-3: #7088e9;
$color-primary-light-5: #99aaef;
$color-primary-light-7: #c2ccf6;
$color-primary-light-8: #d6ddf9;
$color-primary-light-9: #ebeefc;

$color-success: #12b76a;
$color-warning: #f79009;
$color-danger: #f04438;
$color-info: #667085;
$color-price: #e93b3d;   // 保持不变
$color-accent: #f97316;  // 仅用于角标

// 中性色阶（冷灰）
$neutral-0: #ffffff;
$neutral-25: #fcfcfd;
$neutral-50: #f6f7f9;    // 页面底色
$neutral-100: #f1f3f5;   // 次级填充
$neutral-200: #e6e8ec;   // 常规边框
$neutral-300: #d3d7de;   // 强边框/分割
$neutral-400: #a8aeb8;   // 占位符
$neutral-500: #8a919e;   // 三级文字
$neutral-600: #5a6270;   // 二级文字
$neutral-900: #1b1f27;   // 一级文字

// 导航深色
$nav-bg: #111928;
$nav-bg-hover: #1f2937;
$nav-text: #a9b1c0;
$nav-text-active: #ffffff;

// 图表色板（5 色，按顺序取用）
$chart-colors: (#3355e0, #12b76a, #f79009, #f04438, #7a5af8);
```

### 4.3 尺寸 / 排版 / 动效令牌

```scss
// 间距（4px 基数）
$space-1: 4px;  $space-2: 8px;  $space-3: 12px; $space-4: 16px;
$space-5: 20px; $space-6: 24px; $space-8: 32px; $space-10: 40px;

// 圆角
$radius-sm: 8px; $radius-md: 12px; $radius-lg: 16px; $radius-pill: 999px;

// 阴影（用 rgb 三元组，便于调透明度）
$shadow-1: 0 1px 2px rgb(16 24 40 / 4%);
$shadow-2: 0 1px 3px rgb(16 24 40 / 6%), 0 1px 2px rgb(16 24 40 / 4%);
$shadow-3: 0 4px 12px rgb(16 24 40 / 8%);
$shadow-4: 0 12px 32px rgb(16 24 40 / 12%);

// 字号（只允许这 6 档）
$font-12: 12px; $font-13: 13px; $font-14: 14px;
$font-16: 16px; $font-20: 20px; $font-30: 30px;

// 布局
$admin-sidebar-w: 232px;
$admin-sidebar-collapsed-w: 72px;
$admin-header-h: 64px;
$site-header-h: 72px;         // 替代原 $header-height: 64px
$container-width: 1200px;     // 保持不变

// 动效
$ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
$dur-fast: 120ms; $dur-base: 160ms; $dur-slow: 240ms;
```

`tokens.scss` 把上述值输出为 `--app-*`（示例）：

```scss
@use 'variables' as *;

:root {
  --app-color-primary: #{$color-primary};
  --app-bg-page: #{$neutral-50};
  --app-bg-card: #{$neutral-0};
  --app-bg-subtle: #{$neutral-100};
  --app-border: #{$neutral-200};
  --app-text-1: #{$neutral-900};
  --app-text-2: #{$neutral-600};
  --app-text-3: #{$neutral-500};
  --app-radius-card: #{$radius-md};
  --app-radius-control: #{$radius-sm};
  --app-shadow-card: #{$shadow-2};
  --app-shadow-hover: #{$shadow-4};
  --app-ease: #{$ease-out};
  --app-dur: #{$dur-base};
  /* 图表专用（供 utils/theme.js 读取） */
  --app-chart-1: #{nth($chart-colors, 1)};
  --app-chart-2: #{nth($chart-colors, 2)};
  --app-chart-3: #{nth($chart-colors, 3)};
  --app-chart-4: #{nth($chart-colors, 4)};
  --app-chart-5: #{nth($chart-colors, 5)};
}
```

### 4.4 Element Plus 覆盖清单（`element-override.scss`）

按顺序覆盖，**只写变量，不写 `!important`**：

1. 主色全阶：`--el-color-primary` / `-dark-2` / `-light-3|5|7|8|9`。
2. 语义色：`--el-color-success|warning|danger|info` 及其 `-light-9`（用于 `el-tag` 浅底）。
3. 文字：`--el-text-color-primary|regular|secondary|placeholder` → `$neutral-900/600/500/400`。
4. 边框：`--el-border-color` / `-light` / `-lighter` / `-extra-light` → `$neutral-300/200/200/200`。
5. 背景：`--el-bg-color` / `--el-bg-color-page` / `--el-bg-color-overlay`。
6. 填充：`--el-fill-color` / `-light` / `-lighter` / `-blank`。
7. 圆角：`--el-border-radius-base: 8px`、`--el-border-radius-small: 6px`。
8. 字体：`--el-font-size-base: 14px`。
9. 组件级（用选择器，不用变量）：
   - `.el-button`：`height:36px`、`font-weight:500`、`padding: 0 16px`；`--el-button-hover-bg-color` 由主色浅阶自动派生。
   - `.el-input__wrapper` / `.el-select__wrapper`：`box-shadow: 0 0 0 1px var(--app-border) inset`，hover/focus 时换主色 + `0 0 0 3px var(--el-color-primary-light-9)`。
   - `.el-card`：`border:none; box-shadow: var(--app-shadow-card); border-radius: var(--app-radius-card)`。
   - `.el-table`：`--el-table-header-bg-color: #{$neutral-25}`、表头 `font-weight:600`、`th/td` 内边距 `12px 0`、`--el-table-row-hover-bg-color: #{$neutral-50}`。
   - `.el-menu`（深色导航）：`--el-menu-bg-color: #{$nav-bg}`、`--el-menu-text-color: #{$nav-text}`、`--el-menu-active-color: #fff`、`--el-menu-hover-bg-color: #{$nav-bg-hover}`、item `height:44px`、`border-radius:8px`、`margin:2px 10px`。
   - `.el-tag`：`border:none; border-radius:6px; font-weight:500`。
   - `.el-dialog`：`border-radius:16px; padding: 20px 24px`。
   - `.el-pagination`：按钮 `border-radius:6px`。
   - `.el-message` / `.el-dropdown-menu`：`border-radius:10px; box-shadow: var(--app-shadow-3)`。

> 验收自检：改完后 `grep -rn "409EFF\|409eff" src` 必须为 0 条。

### 4.5 基元 mixin 升级

```scss
// 卡片：去掉 1px 边框，改用阴影 + 12px 圆角
@mixin card-surface($padding: 20px) {
  padding: $padding;
  background: var(--app-bg-card);
  border: 1px solid transparent;   // 保留占位，避免布局跳动
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-card);
}

// 可交互卡片：hover 抬升
@mixin hover-lift {
  transition: transform var(--app-dur) var(--app-ease),
              box-shadow var(--app-dur) var(--app-ease);
  &:hover { transform: translateY(-2px); box-shadow: var(--app-shadow-hover); }
}

// 指标数字：等宽数字 + 负字距
@mixin metric-number($size: 30px) {
  font-size: $size;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

// 键盘焦点环
@mixin focus-ring {
  &:focus-visible { outline: 2px solid var(--app-color-primary); outline-offset: 2px; }
}
```

---

## 5. 分阶段实施步骤

> **每阶段结束必须**：`cd Code` → `npm run lint`（0 error / 0 warning）→ `npm run format:check` → `npm run dev` 人工过一遍改动页 → 单独 commit（Conventional Commits）→ 打 tag。**禁止一个 commit 包含多个阶段**。

### P0 · 设计令牌基座（预计 0.5 天，无页面结构改动）

| 步骤 | 文件 | 动作 |
| --- | --- | --- |
| P0-1 | `src/assets/styles/variables.scss` | 按 §4.2 / §4.3 全量替换；保留 `$dot-colors` 但改用新色板；`$header-height` 改名 `$site-header-h`（同步 1 处引用） |
| P0-2 | `src/assets/styles/tokens.scss` | **新建**，头部 `@use 'variables' as *;`，输出 `--app-*` |
| P0-3 | `src/assets/styles/motion.scss` | **新建**，`--app-ease` / `--app-dur` + `@keyframes fade-slide-in` / `shimmer` |
| P0-4 | `src/assets/styles/mixins.scss` | 替换 `card-surface`，新增 `hover-lift` / `metric-number` / `focus-ring` |
| P0-5 | `src/assets/styles/element-override.scss` | 按 §4.4 扩写 |
| P0-6 | `src/assets/styles/index.scss` | 引入顺序改为 `tokens` → `motion` → `element-override`；`body` 字体栈补 `font-variant-numeric` 与 `-webkit-font-smoothing: antialiased` |
| P0-7 | `src/utils/theme.js` | `COLOR_VARS` 增加 `chart1..chart5` → `--app-chart-1..5`；`info` 改读 `--app-text-3` |

**验收**：全站颜色/圆角/阴影/字号立即变化；`grep 409EFF` = 0；登录页、看板、首页三页无样式塌陷；`npm run lint` 通过。

**回退**：`git revert <P0 commit>` 即可，不涉及页面文件。

---

### P1 · 后台骨架 + 数据看板（预计 1.5 天，**样板页**）

| 步骤 | 文件 | 动作 |
| --- | --- | --- |
| P1-1 | `src/components/common/BrandMark.vue` | **新建**：内联 SVG 标志（`currentColor` 描边，24/32 两种尺寸 prop），供后台侧栏与前台顶栏共用 |
| P1-2 | `src/components/common/PageHeader.vue` | **新建**：页标题（20/600）+ 描述（13/500 灰）+ 右侧 `#actions` 插槽；解决「全站没有页面标题」 |
| P1-3 | `src/components/admin/SidebarCom.vue` | 宽 232 → 折叠 72；深色底；顶部 BrandMark + 平台名（折叠只留标志）；菜单项 44px 高、10px 圆角、选中态主色浅底；底部加版本号 `v1.0 · 课程设计` |
| P1-4 | `src/components/admin/HeaderCom.vue` | 高 64；左侧折叠按钮 + 面包屑；中部由 `PageHeader` 承担标题（此处只保留面包屑）；右侧用户 chip 加 1px 边框与 hover 底色 |
| P1-5 | `src/views/admin/layout/index.vue` | 内容区 `padding: 24px`；`background: var(--app-bg-page)`；路由出口加 `<transition name="fade-slide">`；`min-height` 撑满 |
| P1-6 | `src/components/admin/StatCard.vue` | 重写：`label 13/500` 上、`value 30/700 tabular` 中、`sub 12` 下；图标改为右上角 40px 浅色圆形底（`opacity:.12` 主色 + 主色图标）；新增 `sub` prop |
| P1-7 | `src/components/admin/ChartPanel.vue` | **新建**：卡头（标题 15/600 + 副题 12 灰 + `#actions`）+ `#default` 图表区（`flex:1`，最小高 300）+ `#footer` |
| P1-8 | `src/composables/useChartTheme.js` | **新建**：导出 `baseOption()`（统一 tooltip 深色圆角、grid、轴样式、动画 700ms/cubicOut）、`niceAxisMax(values, splitNumber)`、`palette()` |
| P1-9 | `src/composables/useDashboardCharts.js` | **新建**：`buildTrendOption(data, colors)` / `buildPieOption(data, colors)`，把 option 构造从页面移出（满足 300 行阈值） |
| P1-10 | `src/views/admin/dashboard/index.vue` | 重排：① `PageHeader`（标题「数据概览」+「统计口径 2026-05 ~ 2026-10 · 更新于 {加载时间}」）；② 4 张 `StatCard`，`sub` 用**可推导真实值**：上架率 `onSale/goods`、下架数、客单价 `total/orders`、月均 `total/6`；③ 趋势 16 栅格 + 环形 8 栅格，高度 340 且随容器拉伸；④ 底部不加假按钮 |
| P1-11 | 同上（图表细节） | 趋势：柱宽 18、顶端 6px 圆角、主色纵向渐变；折线 `smooth:0.3`、无 symbol、面积渐变 12%→0；**双轴用 `niceAxisMax` 统一 splitNumber=4 对齐**；图例改右侧竖排。环形：`radius:['62%','82%']`、`borderWidth:3` 用卡底色、标签默认隐藏（`label.show:false`，hover 才显示）、中心用 HTML 叠「总销量」 |
| P1-12 | 可选 | `useEcharts.js` 增加 `ResizeObserver` 监听容器（侧边栏折叠不触发 `window.resize`，当前图表不会自适应 —— 这是既有缺陷，建议顺手修） |

**验收**：1440×900 下看板无 >80px 空白；两图表轴刻度行数一致；折叠侧栏后图表自适应；`/admin/goods`、`/admin/order` 因令牌与 `card-surface` 自动升级且无错位。

**注意**：`dashboard/index.vue` 改造后必须 ≤ 300 行，否则继续拆（`DashboardKpiRow.vue`）。

---

### P2 · 前台首屏 + 商品卡 + 素材层（预计 2 天，视觉收益最大）

| 步骤 | 文件 | 动作 |
| --- | --- | --- |
| P2-1 | `src/mock/svg.js` | **重写 `buildCover`**：尺寸 480×360（对齐 4:3），品类色 → **浅色渐变底**（`linearGradient`，如 `#E8EDFF → #F7F9FF`）+ 2~3 个几何形（大圆/圆角矩形，半透明主色）+ **按商品名 hash 决定形状位移/旋转**（保证确定性、每张不同）；**删除 "NO IMAGE" 文字**，可选保留极淡品类首字（`opacity:.06`） |
| P2-2 | 同上 | **重写 `buildBanner`**：1200×360，深色渐变（每张不同色系：墨蓝 / 珊瑚 / 青绿）+ 2 个径向高光 + 弧线装饰；**不画文字**（文案改由 HTML 叠加，排版更可控） |
| P2-3 | `src/mock/seed.js` | `BANNER_SEED` 改为对象数组：`{ tag, title, subtitle, cta }`；`banners` 映射补字段；`buildBanner(i + 1)` 调用改为只传序号 |
| P2-4 | `src/components/before/HomeHero.vue` | **新建**：`el-carousel` + 每帧「图 + 左侧渐变遮罩 + 文案层」；文案层：`tag`（胶囊白 12%）/ `title`（36/700 白）/ `subtitle`（15 rgba255,.85）/ `cta`（白底墨字胶囊按钮，点击跳 `/search`）；下方自定义指示器（8px 圆点 → 24px 胶囊，当前帧拉长） |
| P2-5 | `src/components/before/CategoryNav.vue` | **新建**：分类入口从「圆点 + 文字」改为「56px 圆形浅色图标底 + 13/500 文案」，6 列网格，hover 主色描边 |
| P2-6 | `src/components/common/SectionHeading.vue` | **新建**：左「竖条 + 标题 18/600」、右侧 `#extra`（如「查看全部 →」ghost 按钮）；统一首页/搜索/收藏区块头 |
| P2-7 | `src/views/before/home/index.vue` | 用 `HomeHero` / `CategoryNav` / `SectionHeading` 重组；商品网格 `gap:20px`、4 列；删除原生 `<img>` 与 `<el-skeleton>` 的默认外观，改骨架屏用 `shimmer`；**保持所有数据请求与 `catch` 逻辑不变** |
| P2-8 | `src/components/before/GoodsCard.vue` | 封面 `aspect-ratio: 4/3` + `overflow:hidden`，hover 图片 `scale(1.04)`；左上角品类胶囊；名称 2 行截断 14/500；**删除描述行**（信息冗余），改为「已售 xxx」；价格 `¥` 12px + 数字 20/700 + `$color-price`；右下角圆形加购按钮（`@media (hover:hover)` 才隐藏，触屏常显，**不可只靠 hover 才能加购**）；卡片 `hover-lift` |
| P2-9 | `src/views/before/layout/index.vue` | 顶栏 72px、`backdrop-filter: blur(12px)` + 半透明白；Logo 换 `BrandMark`；搜索框改胶囊（`border-radius:999px`，focus 时主色环）；导航 active 加 2px 下划线；内容 `padding: 24px 0 40px`；页脚 `padding: 32px 0`、去掉大块白底改为 1px 上边框 |
| P2-10 | `src/views/before/search/index.vue` | 筛选条改「工具条卡片」：分类用 `el-radio-group` 胶囊、排序用 segmented；结果数用 `13/500` 文案；网格复用 `GoodsCard` 的 4/3 节奏 |

**验收**：`/home` 首屏（1440×900）能看到 Hero + 分类 + 至少一行商品；商品卡无裁切、价格完整；切到 375px 无横向溢出；轮播 3 帧文案与图片不重叠。

---

### P3 · 其余页面统一（预计 1.5 天）

按「收益/成本」排序执行，每完成一组提交一次：

| 优先级 | 文件 | 动作 |
| --- | --- | --- |
| 高 | `views/before/goods/detail.vue` + `GoodsIntro.vue` | 双栏 480 / 1fr；左图 `border-radius:16px` + 浅底；右侧信息栏：品类面包屑 → 标题 24/600 → 副文案 → **价格区改成浅色块**（`#FFF1F0` 底 + 价格 32/700）→ 数量行 → CTA 按钮组（主按钮 44px 高、`flex:1`）→ 三行服务承诺（正品/七天退换/极速发货，用小图标） |
| 高 | `views/before/cart/*`（index / CartTable / CartSummary） | 表头 `sticky`；数量步进器 32px 高；`CartSummary` 改 `position: sticky; top: 96px`，合计行 24/700，结算按钮全宽 44px |
| 中 | `views/before/order/confirm.vue` / `list.vue` / `OrderCard.vue` / `detail.vue` | 统一用 `card-surface` + `SectionHeading`；订单状态用 `StatusTag` 的 `light` 浅底；订单号用等宽数字 |
| 中 | `views/admin/goods/index.vue` / `category/index.vue` / `order/index.vue` / `profile/index.vue` | 每页加 `PageHeader`；`SearchForm` 改「一整块筛选卡」（label 13 灰、控件 36 高）；`DataTable` 行高 52、操作列按钮间距 12；批量操作条改浅底 sticky |
| 中 | `views/admin/goods/edit.vue` / `order/detail.vue` | 表单分「基础信息 / 价格库存 / 图片」三段，段标题 15/600 + 12 灰说明；卡片内 `padding: 24` |
| 中 | `views/admin/login/index.vue` + `components/before/AuthShell.vue` + `views/before/login|register` | AuthShell 改**左右分栏**：左侧 45% 品牌区（深色渐变 + BrandMark + 一句价值主张 + 三个卖点），右侧表单区 420px 居中卡片；≤992px 时隐藏左侧 |
| 低 | `components/common/DataTable.vue` / `SearchForm.vue` / `Pagination.vue` / `EmptyState.vue` | 表格去斑马纹改 hover 高亮；`EmptyState` 增加浅色插画位（内联 SVG，不用 `el-empty` 默认图）；分页按钮 32px |

**验收**：全站抽查 12 个路由，卡片圆角/阴影/标题层级一致；后台 4 个列表页在 1280 宽下不出现横向滚动条。

---

### P4 · 动效、响应式与验收（预计 1 天）

| 步骤 | 内容 |
| --- | --- |
| P4-1 | 路由过渡：`fade-slide`（`opacity 0→1` + `translateY(6px→0)`，160ms）。加在 `admin/layout` 与 `before/layout` 的 `<router-view v-slot>`，**不要加在 `App.vue`**（会与子 layout 双重过渡） |
| P4-2 | 骨架屏：`index.scss` 定义 `.skeleton`（`shimmer` 1.4s 循环）；首页/搜索/详情/看板加载态统一用它，替换 `el-skeleton` 默认灰块 |
| P4-3 | 微交互：全部按钮/链接/卡片 `:focus-visible` 焦点环（`focus-ring`）；卡片 hover 抬升；图表首次加载 `animationDuration:700` |
| P4-4 | 响应式复检：375 / 768 / 1024 / 1440 四档，重点查首页网格、详情双栏、后台侧栏折叠、看板 KPI 换行 |
| P4-5 | 截图归档：`docs/screenshots/ui-v2/`，8 个路由 × 2 个视口 = 16 张，命名 `<route>_<width>.png` |
| P4-6 | 文档同步：`README.md` 增「界面设计」小节（色板/字号/圆角表格）；本文档 §7 验收结果回填 |

---

## 6. 文件清单（执行时逐项打勾）

**新建（11）**

```
src/assets/styles/tokens.scss
src/assets/styles/motion.scss
src/components/common/BrandMark.vue
src/components/common/PageHeader.vue
src/components/common/SectionHeading.vue
src/components/admin/ChartPanel.vue
src/components/before/HomeHero.vue
src/components/before/CategoryNav.vue
src/composables/useChartTheme.js
src/composables/useDashboardCharts.js
src/views/admin/dashboard/DashboardKpiRow.vue   （仅在 P1-10 超 300 行时创建）
```

**改造（24）**

```
样式   src/assets/styles/{variables,mixins,element-override,index}.scss
工具   src/utils/theme.js
素材   src/mock/svg.js, src/mock/seed.js
后台   src/components/admin/{SidebarCom,HeaderCom,StatCard}.vue
       src/views/admin/layout/index.vue
       src/views/admin/dashboard/index.vue
       src/views/admin/{goods/index,category/index,order/index,order/detail,goods/edit,profile/index,login/index}.vue
前台   src/components/before/{GoodsCard,AuthShell}.vue
       src/views/before/layout/index.vue
       src/views/before/home/index.vue
       src/views/before/{search/index,goods/detail,goods/GoodsIntro,cart/index,cart/CartTable,cart/CartSummary,order/confirm,order/list,order/OrderCard,login/index,register/index}.vue
通用   src/components/common/{DataTable,SearchForm,Pagination,EmptyState}.vue
```

**禁止改动**：`vite.config.js`（SCSS 注入配置）、`build/`、`src/api/**`、`src/router/**`、`src/store/**`、`src/mock/modules/**`、`package.json`。

---

## 7. 验证方式

### 7.1 静态检查（每阶段必跑）

```bash
cd D:/WorkBuddy/前端02/Code
npm run lint          # 必须 0 error 0 warning
npm run format:check  # 必须通过
git diff --stat package.json package-lock.json   # 必须为空
grep -rn "409EFF\|409eff" src                     # 必须 0 条
grep -rn "#[0-9a-fA-F]\{6\}" src --include=*.vue   # 必须 0 条（仅允许 variables/tokens/svg.js）
```

> 构建验证（`npm run build`）放在 P4 一次性做，且**必须先 `rm -rf dist`**（本环境安全策略会拦截 Vite 内部的批量删除，二次 build 必失败）。

### 7.2 功能回归清单（14 条，改造前先跑一遍记录基线）

| # | 用例 | 通过标准 |
| --- | --- | --- |
| 1 | 管理员登录 → 跳 `/admin/dashboard` | 成功，Token 落库，菜单高亮正确 |
| 2 | 未登录直访 `/admin/goods` | 被守卫拦截到登录页 |
| 3 | 普通用户访问 `/admin/*` | 退回 `/`（不是登录页） |
| 4 | 商品类型增删改查 + 分页 | 数据与操作反馈正常 |
| 5 | 商品新增（含图片上传）/ 编辑 / 单条上下架 / 批量上下架 / 删除 | 列表与 Mock 数据同步 |
| 6 | 商品多条件筛选后进编辑页再返回 | 筛选条件与页码保持 |
| 7 | 订单列表分页 + 详情 + 状态流转 | 状态 tag 与流转结果一致 |
| 8 | 看板 3 个接口并发加载 | 指标与两图渲染正确（改造后新增：切换时间范围后图表重绘） |
| 9 | 首页轮播自动播放 + 分类跳转 + 搜索 | 轮播 3 帧、分类带 `categoryId` |
| 10 | 商品详情加购 / 立即购买（未登录跳登录并带 redirect）/ 收藏 | 三种路径均正确 |
| 11 | 购物车增减/删除/全选/结算 | 合计金额正确，数量为 0 自动删除 |
| 12 | 下单 → 我的订单 → 取消订单 | 状态与列表刷新正常 |
| 13 | 注册 / 登录 / 改个人信息 / 退出 | 顶栏昵称与头像同步 |
| 14 | 375px 下首页、详情、购物车 | 无横向溢出，按钮可点击 |

> 第 8 条新增的「时间范围筛选」属**真实功能**（对已有 6 个月数组切片），必须在回归表内。

### 7.3 视觉验收标准（可量化）
| 维度 | 判据 |
| --- | --- |
| 色彩 | 全站主色出现处颜色一致；同屏不超过 1 个主色 + 1 个强调色；`#409EFF` 零出现 |
| 层级 | 每页存在 20/16/14/12 至少四级字号；卡片标题与正文有 2px 以上字号差或字重差 |
| 密度 | 看板/首页在 1440×900 下连续空白 ≤ 80px；表格行高 52±2px |
| 一致性 | 同类型卡片圆角全部 12px、阴影全部 `shadow-2`（`getComputedStyle` 抽查 5 处） |
| 对比度 | 正文 ≥ 4.5:1、按钮文字 ≥ 4.5:1、占位符 ≥ 3:1（用 DevTools 取色验证） |
| 响应式 | 375/768/1024/1440 四档 `document.documentElement.scrollWidth <= innerWidth` |
| 交互 | 所有可点元素有 `:hover` 与 `:focus-visible` 反馈；触屏设备不依赖 hover 才能完成加购 |

### 7.4 截图对比流程（避免误判）

1. 先重启 dev server（`npm run dev`，E2E 操作会脏 Mock 数据），等 Mock 加载日志出现。
2. 固定视口 1440×900 与 1920×1080，逐页截图（headless Chrome `--headless=new` + CDP；`--window-size` 在窄屏需配 `mobile:false` 防缩放）。
3. 基线存 `docs/screenshots/ui-v1/`（改造前），新图存 `ui-v2/`，同名对比。
4. 横向溢出检测：遍历元素比对 `getBoundingClientRect().right > innerWidth`（只看 `scrollWidth` 会漏掉 flex-end 溢出）。
5. 动效截图需等 ≥ 2.5s（`scroll-behavior: smooth` 与图表动画未结束时截会糊）。

---

## 8. 风险与回退

| 风险 | 触发信号 | 处置 |
| --- | --- | --- |
| 深色侧栏可读性差 | 折叠态图标对比度 < 4.5:1 | 图标色提到 `$nav-text`，选中态加主色左侧 3px 条 |
| 全局覆盖波及未检查页面 | 某页表格/表单错位 | 回退该阶段 commit；覆盖规则改为「按页面类名作用域」再逐步放开 |
| 图表双轴仍不对齐 | 左右刻度行数不同 | `niceAxisMax` 强制同一 `splitNumber`，且 `min:0` |
| 4:3 封面导致网格跳动 | 首页/搜索/收藏三处高度不一 | 三处同阶段改完；卡片 `height:100%` + 网格 `align-items:stretch` |
| SVG DataURL 体积膨胀 | 单图 > 4KB、首屏变慢 | 渐变层压到 2 个 `stop`，几何形不超过 4 个；必要时改纯色 + 单层径向渐变 |
| dev server 起不来 / build 失败 | `SAFE_DELETE_BULK_CONFIRM_REQUIRED` | 先 `rm -rf node_modules/.vite`（dev）或 `rm -rf dist`（build），再从 Bash 重跑；**不要**通过加依赖"解决" |

**回退粒度**：

```bash
git tag ui-p0 && git push origin ui-p0    # 每阶段结束打 tag
git revert <commit>                        # 单阶段回退
git checkout ui-p1 -- src/                 # 只回退源码目录
```

---

## 9. 执行环境铁律（新会话必读，否则会卡住）

1. **所有 npm 命令非沙箱执行**；沙箱内会因禁子进程失败。
2. **凡依赖批量删文件的工具必失败**：`npm run build` 第二次起需先 `rm -rf dist`；`dev` 预构建崩需先 `rm -rf node_modules/.vite`。
3. **禁止新增依赖**：任何 `npm install` 都会改变依赖图 → 触发 Vite 重新预构建 → 清理缓存被安全策略拦截 → dev server 崩溃。
4. **SCSS 注入不可重复声明**：组件内**禁止**写 `@use '@/assets/styles/variables.scss'`；而被 `index.scss` `@use` 的子文件（`tokens.scss` / `motion.scss` / `element-override.scss`）**必须**自己 `@use 'variables' as *;`。
5. **色值只能出现在 `variables.scss`**（`mock/svg.js` 的生成参数除外），组件内一律 `var(--app-*)`。
6. **单文件 > 300 行必须拆**；`dashboard` 与 `home` 改造后需复查行数。
7. 验收用 `npm run dev`，**不要用 `preview`**（Mock 中间件只在 dev 生效，preview 下接口全 404）。
8. `git` 推送走 wincred，后台执行；`schannel handshake` 报错重试一次即可。

---

## 10. 执行顺序速查（给新会话的开工指令）

```
1. cd D:/WorkBuddy/前端02/Code && git status   # 确认干净，创建分支 feature/ui-v2
2. 读 CLAUDE.md 第 7 章（样式规范）+ 第 2.3 节（拆分阈值）
3. 读本文档 §4，先落 P0 的 6 个样式文件 → lint → 截图对比 → commit "style(tokens): 建立设计令牌基座"
4. P1 后台骨架 + 看板 → 截图 → commit "style(admin): 重构后台骨架与数据看板"
5. P2 素材层 + 前台首屏 + 商品卡 → 截图 → commit "style(before): 重做首屏与商品卡视觉"
6. P3 其余页面 → 分批 commit
7. P4 动效/响应式/截图归档 → commit "style: 动效与响应式收尾"
8. 全量回归 14 条 → 回填 §7 结果 → 更新 README
```

---

## 11. 执行结果回填（2026-10-23 已完成）

> 分支 `feature/ui-v2`，阶段 tag：`ui-p0` / `ui-p1` / `ui-p2` / `ui-p3` / `ui-p4`，每阶段一个 commit。

### 11.1 静态检查

| 检查项 | 结果 |
| --- | --- |
| `npm run lint` | 0 error / 0 warning |
| `npm run format:check` | 通过（Prettier 全站一致） |
| `git diff --stat package.json package-lock.json` | 空（零新增依赖） |
| `grep -rn "409EFF\|409eff" src` | 0 条 |
| `npm run build`（先清 `dist`） | 通过，19.4s；产物仍拆 `vendor-vue` 114.6KB / `vendor-echarts` 519.2KB / `vendor-element-plus` 952.6KB |
| 单文件 ≤ 300 行 | 最大 `components/before/GoodsCard.vue` 297 行 |

### 11.2 与方案的差异（均为落地时暴露的真实约束）

| 方案原文 | 实际落地 | 原因 |
| --- | --- | --- |
| `$header-height` → `$site-header-h` | 同名替换，引用 1 处 | 与方案一致 |
| `useChartTheme.niceAxisMax` 单值返回 | 新增 `niceScale()` 返回 `{max, interval}`，`niceAxisMax` 保留为薄封装 | 只给 `max` 时 ECharts 会自行调 `splitNumber` 凑整，实测左轴 4 段 / 右轴 5 段仍不对齐；必须固定 `interval` |
| 看板 2 列栅格（16/8） | `grid-template-columns: 2fr 1fr`，行 `flex:1` + `min-height:420px` | 用 CSS Grid 替代 `el-row/el-col`，才能让图表区随视口高度拉伸（消除 1440×900 下底部 ~90px 空白） |
| 侧栏菜单深色 | 收敛到 `.el-menu--nav` 修饰类 | 直接把 `.el-menu` 全站覆盖会让**个人中心**的浅色侧栏菜单也被染黑（实测截图发现），故限定作用域 |
| 前台 layout 文件 | 拆出 `SiteHeader.vue` + `SiteNav.vue` | 顶栏改造后单文件 438 行，超过 300 行硬阈值 |
| 商品详情页 | 右栏购买区拆为 `GoodsPurchasePanel.vue` | 同上（改造后 378 行） |
| 商品编辑页 | 表单逻辑抽到 `composables/useGoodsForm.js` | 同上（改造后 312 行） |
| 商品列表列配置 | 抽到 `views/admin/goods/columns.js` | 同上（316 行）+ 列宽预算需单独说明 |

### 11.3 视觉验收

| 维度 | 判据 | 结果 |
| --- | --- | --- |
| 色彩 | `#409EFF` 零出现 | ✅ `grep` 0 条 |
| 层级 | 每页 ≥ 4 级字号 | ✅ 20 / 16 / 14 / 13 / 12（KPI 30） |
| 密度 | 看板 1440×900 连续空白 ≤ 80px | ✅ 图表区弹性拉伸后底部仅剩内容区 padding 24px |
| 一致性 | 卡片圆角 12px + `shadow-2` | ✅ 全部走 `card-surface` / `--app-radius-card` |
| 响应式 | 375/768/1024/1440 四档 `scrollWidth <= innerWidth` | ✅ 16 组全部通过（前 4 页 + 后台 4 页） |
| 窄屏表格 | 1280 宽下后台 4 个列表页无横向滚动 | ✅ 列宽总和压到 940px（含 48px 多选列） |
| 交互 | `:focus-visible` 焦点环 + hover 抬升 | ✅ `index.scss` 统一 + `focus-ring` / `hover-lift` mixin |
| 触屏加购 | 不依赖 hover | ✅ `@media (hover:none)` 下圆形加购按钮常显 |
| 图表双轴 | 左右刻度行数一致 | ✅ 均为 4 段（0/10/20/30/40 ↔ 0/5万/10万/15万/20万） |
| 侧栏折叠 | 图表自适应 | ✅ `useEcharts` 加 `ResizeObserver`（修复既有缺陷） |

### 11.4 截图归档

`docs/screenshots/ui-v2/`，8 个路由 × 2 个视口（1440 / 375）共 16 张：
`home` / `search` / `goods-1001` / `cart` / `order-list` / `login` / `admin-dashboard` / `admin-goods`。

### 11.5 未做项（与方案一致）

- 未做暗色模式（方案 §2.2 明确不做，令牌层已预留 `:root` 集中定义）。
- 未加「导出」按钮与环比 / 同比（无对应真实能力，改为展示真实「更新于 HH:mm」与可推导的 KPI 副信息）。
- 未接入任何外部图片 / 字体 / 动画库。

