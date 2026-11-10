# TriType Arena / 中英打字竞技场

[English](README.md) | [繁體中文](README.zh-TW.md) | **简体中文**

版本：**0.4.1** — 基于 React 18 与 TypeScript 开发的纯前端本地优先（Local-first）多语言打字训练系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[测试](tests)
正式站点：[tri-type-arena.vercel.app](https://tri-type-arena.vercel.app/)。

---

## 1. 项目概述 (Project Overview)

**TriType Arena（中英打字竞技场）** 是专为中文与多语言输入法设计的现代浏览器原生打字练习工具。支持英语盲打、简体中文汉语拼音及台湾标准繁体中文注音（大千键盘布局）。系统采用纯前端本地优先（Local-first）架构，无后端依赖、免注册登录、零个人隐私追踪，提供极致流畅与超低延迟的键盘指法锻炼体验。

- 正式站点为 [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/)，由 Vercel 从本仓库部署。
- **目标群体**：双语开发者、打字爱好者、希望建立大千注音或英语标准指法盲打肌肉记忆的学习者。

---

## 2. 系统功能特色 (Features)

- **三语完整本地化界面 (UI i18n)**：完整支持繁体中文 (`zh-TW`)、简体中文 (`zh-CN`) 与英语 (`en`)。导航栏选择器会立即切换。若 `tritype.ui.locale` 已保存 `en`、`zh-TW` 或 `zh-CN`，以该值为准；否则读取 `navigator.language`（`zh-CN`、`zh-SG` 与 `zh-Hans*` → 简体中文，其他 `zh*` → 繁体中文，其余 → 英语）。
- **无障碍新手导览**：三步骤对话框：选择模式、设置时限与提示、开始输入并查看准确率与速度。对话框会困住 Tab 焦点、按 Escape 关闭、还原焦点，并可重新打开。
- **时限挑战模式**：30 秒冲刺、60 秒标准、120 秒耐力。
- **实时数值**：WPM、准确率（`correctKeys / totalKeys`）、完成词数，以及进行中的当前连击（界面上标为 COMBO）。结算窗口另显示最高连击。
- **前 2 秒 WPM 平滑**：当 `elapsedSeconds < 2` 时，显示的 WPM 从 2 秒基准向上爬升，避免除以接近 0 的经过时间。
- **防粘贴**：任何剪贴板粘贴都会被拒绝（`PASTE_PROHIBITED`），包括单个字符。进度只来自逐键输入。
- **键盘操作**：空闲时按 `Enter` 开始。进行中按 `Esc` 暂停。暂停时按 `Space` 或 `Enter` 继续。进行中的 `Space` 是输入字符（注音第一声必须使用），不是继续快捷键。
- **学习进度面板**：用纯 SVG 绘制最近 20 条记录的趋势图（无图表依赖包），并提供弱键统计与复习入口。

---

## 3. 三大练习模式 (Three Typing Modes)

练习模式与界面语言相互独立，可自由搭配：

1. **英语标准练习 (`en`)**
   - 500 个来自 Moby Words II 词频表的单词。分级按词长（2–4、5–6、7 个字母以上），不是短语，也不是编程词汇。
   - 逐字比对，Backspace 删除最后一个已输入字符。

2. **简体汉语拼音 (`pinyin`)**
   - 答案是不含声调符号的汉语拼音，例如“早餐”输入 `zaocan`（提示仍可显示 `zǎo cān`）。
   - 每个按键会规范化：去掉声调符号，并把 `ü` 对应为 `v`。

3. **繁体注音 · 台湾标准大千键盘 (`zhuyin`)**
   - 大千实体键位：`5`、`j`、`/` 与 Space 分别对应 `ㄓ`、`ㄨ`、`ㄥ` 与第一声空格。
   - 具备实时虚拟大千键盘，动态高亮当前预期敲击的实体按键。
   - 专注建立实体键位至注音符号的盲打肌肉记忆，不打开操作系统选字列表。

---

## 4. 难度等级与题库分级 (Difficulty Levels)

TriType Arena 内置 1,100 笔精选题库，划分为三种难度等级：

| 难度等级 | 英语题库 (500 词) | 拼音题库 (300 词) | 注音题库 (300 词) |
|---|---|---|---|
| **初级 (Beginner)** | 200 词，2–4 个字母 | 120 条日常生活词 | 120 条，由拼音词表转写 |
| **中级 (Intermediate)** | 200 词，5–6 个字母 | 120 条日常生活词 | 120 条，由拼音词表转写 |
| **高级 (Advanced)** | 100 词，7 个字母以上 | 60 条日常生活词 | 60 条，由拼音词表转写 |

- 英语分级是 Moby Words II 的打字词长，不是语言能力等级。题库只有普通单词。
- 拼音与注音共用同一份日常生活词表。120 / 120 / 60 是名额分配，不是另一套已评定的难度量表。注音由拼音读音机械转写。
- **随机抽取**：`ShuffleBag` 使用 Fisher-Yates。当题池超过 1 条时，第 $N$ 轮末题不会成为第 $N+1$ 轮首题。可注入种子以得到固定顺序。普通挑战界面不会设置种子，因此使用 `Math.random`。

---

## 5. 注音第一声空格键规则 (Zhuyin First-Tone Space Rule, v0.4.1)

在标准台湾大千式注音键盘中，**第一声（阴平）**并无实体调号键。TriType Arena 严格遵循真实打字规则：

- **第一声必须按空格键**：输入第一声音节时，用户**必须按下实体 Space 键 (`' '`)** 以完成该音节（例如“中午”之“中”：`5` (ㄓ) + `j` (ㄨ) + `/` (ㄥ) + `Space`）。
- **非第一声调号**：二声 `6` (ˊ)、三声 `3` (ˇ)、四声 `4` (ˋ)、轻声 `7` (˙)。这些音节的答案不含 Space。多按的 Space 会被当成已输入字符并计为错误。
- **计分与按键纳入**：第一声的 Space 键敲击视为合法有效按键，完全计入 `totalKeys`、`correctKeys`、WPM 计算及弱键统计分析。
- **视觉引导**：当预期按键为第一声空格键时，虚拟大千键盘空格键 (`#daqian-space-key`) 自动触发 `.key-active` 高亮，且目标字符序列显示开口方块符号 `␣` (`target-char-space`)。

---

## 6. 学习历程与弱键复习 (Learning History & Weak-Key Review)

TriType Arena 内置完整的本地离线学习分析模块：

- **历程留存**：完成的挑战与复习都会写入 `localStorage` 的 `tritype.learning.v1`（最多 200 条，FIFO）。趋势图与面板平均值使用其中最近 20 条。
- **弱键判定**：按键按模式累积于 `tritype.weakkeys.v1.${mode}`。尝试次数 $\ge 10$ 且错误率 $\ge 20\%$ 才标成确认弱键。
- **弱键复习**：按当前模式与难度，从确认弱键组成最多 10 题。没有确认弱键，或没有对应题目时，复习不会开始。
- **最高分隔离**：复习场次标记为 `sessionType: 'review'`。只有 `sessionType: 'challenge'` 会更新最高分 (`tritype.best.v2`)。复习成绩仍会写入学习历程。

---

## 7. 快速开始 (Getting Started)

### 环境需求
- Node.js 22.x
- npm >= 10.0.0

### 本地安装与启动
```bash
# 克隆仓库
git clone https://github.com/Jake627520/tri-type-arena-public.git
cd tri-type-arena-public

# 安装纯净依赖
npm ci

# 启动 Vite 开发服务器。
# vite.config.ts 把 server.port 设为 4174，server.host 设为 true（监听所有接口）。
# 未设置 strictPort，4174 被占用时会改用下一个可用端口。
npm run dev
# 打开 Vite 打印的网址。4174 可用时为 http://localhost:4174/
```

### 生产构建与预览
```bash
# 先用 tsc 做类型检查，再把生产包写入 dist/
npm run build

# 用 Vite preview 提供 dist/。
# 未设置 preview.port，因此使用 Vite 6 的默认端口 4173。
# 未设置 preview.host，因此沿用 server.host（所有接口）。
npm run preview
# 打开 Vite 打印的网址。4173 可用时为 http://localhost:4173/

# 先做来源验证与题库发行闸门，再执行同一个生产构建。
# vercel.json 把这条命令设为 Vercel 构建命令。
npm run build:release
```

---

## 8. 测试命令与质量验证 (Running Tests)

执行以下自动化检查：

```bash
# 本地质量门禁，顺序为：typecheck、lint、npm test、test:vitest、
# validate:provenance、audit:licenses、audit:security、npm run build。
# 不执行 Playwright，也不执行 build:release。
npm run check
```

### 个别测试命令
- **Node.js 单元与合规测试**：`npm test` 执行 `node --test tests/*.test.mjs`（此目录树为 66 项测试）。
- **Vitest 组件与领域测试**：`npm run test:vitest`（`tests/domain` 与 `tests/components` 共 318 项测试）。
- **Playwright**（`tests/e2e`，每个浏览器项目 20 项测试）。配置只有 Chromium 与 WebKit，没有 Firefox 项目。
  - 先安装浏览器：`npx playwright install chromium` 或 `npx playwright install webkit`。在 Linux 上，WebKit 还需要 `npx playwright install-deps webkit` 安装的系统库（此步骤需要安装权限）。`npx playwright install --with-deps <browser>` 会一次做完。CI 以 `--with-deps` 安装 Chromium。
  - 每条命令都会自行启动 `npm run dev`，且端口 4174 必须空闲（`reuseExistingServer: false`）。`baseURL` 为 `http://localhost:4174`。
  - Chromium（20 项）：`npm run test:e2e`
  - WebKit（20 项）：`npm run test:e2e:webkit`
  - 两个项目（40 项）：`npm run test:e2e:all`
- **静态检查**：
  - TypeScript：`npm run typecheck`（`tsc --noEmit`）
  - ESLint：`npm run lint`（`eslint src`）
- **安全与许可**：
  - 许可审计：`npm run audit:licenses` 按项目允许清单检查 lockfile 许可，并再跑一次 `tests/license-audit.test.mjs`。
  - 安全审计：`npm run audit:security` 扫描 git 历史与已跟踪文件中的密钥，执行 `npm audit --omit=dev`（只查生产依赖），并在已安装时执行 Gitleaks。本地缺少 Gitleaks 时会警告并继续；`CI=true` 时缺少该程序会使审计失败。
  - 来源验证：`npm run validate:provenance` 按来源登记检查 1,100 条题库。

---

## 9. 系统架构与技术选型 (Architecture & Technology Stack)

```
tri-type-arena-public/
├── index.html                  # 浏览器入口 → src/app/main.tsx
├── src/
│   ├── app/                    # 应用程序外壳 (main.tsx, App.tsx, styles.css)
│   ├── domain/                 # 打字规则与题库。弱键辅助也会读取 localStorage。
│   │   ├── vocabulary/         # 1,100 条题库 (en, pinyin, zhuyin)
│   │   ├── learning/           # 历程、弱键、复习生成器，以及自适应练习辅助
│   │   │                       # （界面不会启动自适应练习）
│   │   ├── shuffle-bag.ts      # Fisher-Yates，并避免循环边界重复
│   │   ├── typing-answer.ts    # 拼音/注音答案与第一声 Space
│   │   ├── session.ts          # 打字状态机
│   │   ├── metrics.ts          # WPM、准确率与得分
│   │   ├── zhuyin-map.ts       # 大千键位与输入规范化
│   │   └── prng.ts             # 可选的种子随机数
│   ├── features/
│   │   ├── typing/             # TypingArena、难度选择、useTypingSession
│   │   ├── lessons/            # 模式与 30/60/120 秒时限
│   │   ├── keyboard/           # DaqianKeyboard
│   │   ├── learning/           # LearningDashboard、TrendChart
│   │   ├── stats/              # LiveStats
│   │   ├── results/            # ResultModal
│   │   └── onboarding/         # 新手导览
│   ├── i18n/                   # 文案与 useLocale (core.ts, useLocale.ts)
│   └── shared/                 # localStorage 与版本
├── tests/
│   ├── *.test.mjs              # Node 测试运行器 (`npm test`)
│   ├── domain/                 # Vitest 领域测试
│   ├── components/             # Vitest 组件测试
│   └── e2e/                    # Playwright（Chromium 与 WebKit）
├── scripts/                    # 来源、许可与安全审计
├── docs/                       # 规范、架构与题库记录
├── public/notices/             # 第三方声明
├── openspec/                   # 规范驱动变更提案
├── vite.config.ts              # 开发端口 4174；预览使用 Vite 默认 4173
└── vercel.json                 # buildCommand: npm run build:release
```

Node 测试还会加载 `src/engine.mjs`、`src/app.mjs` 与 `src/legacy-lessons.mjs`。这些文件不是浏览器入口。

| 架构层级 | 技术选型 |
|---|---|
| **前端框架** | React 18.3.1 |
| **开发语言** | TypeScript 5.9.3（严格模式）。`package.json` 允许 `^5.6.3`；lockfile 解析为 5.9.3 |
| **构建工具** | Vite 6.4.5。开发服务器端口 4174；预览端口 4173 |
| **单元测试** | Node.js 测试运行器 + Vitest 4.1.12 |
| **组件测试** | React Testing Library + jsdom（经由 Vitest） |
| **E2E 测试** | Playwright 1.64（只有 Chromium 与 WebKit 项目） |
| **代码规范** | ESLint 9.39 |
| **静态部署** | Vercel 静态托管。仓库中的构建命令：`npm run build:release` |

---

## 10. 隐私政策与本地存储 (Privacy & LocalStorage)

TriType Arena 贯彻严格的**纯前端本地优先隐私政策**：

- **数据绝不主动外传**：所有按键记录、打字速度 (WPM)、错误率及练习历史仅在用户本地浏览器（`localStorage`）中运算与保存，前端程序绝不主动将任何练习数据上传至外部服务器。
- **无账号系统**：无需注册、无需登录即可即开即练。
- **本地存储键值**：
  - `tritype.best.v2`：各模式挑战最高分。
  - `tritype.difficulty.v1`：难度偏好（默认 `beginner`）。
  - `tritype.learning.v1`：最多 200 条挑战与复习（FIFO）。
  - `tritype.weakkeys.v1.${mode}`：`en`、`pinyin`、`zhuyin` 各自的按键尝试与错误次数。
  - `tritype.onboarding.v1.completed`：关闭导览后写入 `yes`。
  - `tritype.ui.locale`：界面语言（`en`、`zh-TW` 或 `zh-CN`）。
  - `tritype.adaptive.v1`：自适应练习记录。当前界面不会启动自适应练习。清除记录仍会移除此键。
- **清除记录**：面板按钮文字是“清除学习记录”。确认后会移除学习历程、自适应练习记录与弱键统计，不会清除最高分、难度、界面语言或导览完成标志。在浏览器中清除此网站数据才会一并移除那些项目。
- **托管主机必要访问日志**：网站托管于 Vercel CDN 平台，服务器在分发静态资源时依互联网标准协议仍可能记录基础连接日志（如 IP 地址、连接时间、User-Agent 等），此为网络基础设施正常运转与防御网络攻击的技术常态。

---

## 11. 软件许可、依赖项与题库来源发行治理 (Licensing, Dependencies & Governance)

本项目明确划分并严格遵守三层法律与治理架构：

1. **应用程序源码许可**：
   - 应用程序前端源码采用宽松友善的 [MIT License](LICENSE) 开源许可条款发布。
2. **第三方依赖包审计**：
   - 使用 `npm run audit:licenses` 检查依赖包许可，并以 `npm run audit:security` 扫描密钥、执行 `npm audit --omit=dev`，以及在已安装时执行 Gitleaks。本地缺少 Gitleaks 时会警告并继续；`CI=true` 时缺少该程序会使审计失败。对照此 lockfile，完整 `npm audit` 报告 6 项中度问题，全部在开发工具链（`minimatch`，经由 `@typescript-eslint` / ESLint）。`npm audit --omit=dev` 的生产依赖没有发现。数字会随 lockfile 或 advisory 数据库改变，而且两条命令都需要连接 registry。
3. **词库来源与许可**：
   - 中文词库采用 CC-CEDICT 数据，按 CC BY-SA 4.0 声明；英文词库来自作者声明为公有领域的 Moby Words II。详见[第三方声明](public/notices/index.html)及[来源记录](docs/vocabulary/)。
   - 所有者同意依已记录的许可发布现有数据。来源记录不是法律保证；中文读音尚未完成全面人工审查，注音由拼音机械转写，未确认符合台湾惯用读音。
   - 原始词库仍在 Git 历史；来源审查前请使用不含旧历史的干净快照公开。

---

## 12. 部署状态与已知限制 (Deployment & Known Limitations)

- **部署**：正式站点为 [https://tri-type-arena.vercel.app/](https://tri-type-arena.vercel.app/)。本仓库的 `vercel.json` 把 Vercel 构建命令设为 `npm run build:release`（来源验证、题库发行闸门，然后 `npm run build`）。Vercel 项目后台的设置可以覆盖这个文件。`npm run check` 的最后一步仍是 `npm run build`，不是 `build:release`。
- **已知限制**：
  - **单机本地存储 · 无云端同步**：练习记录均保存在当前浏览器的 `localStorage` 中，无法跨设备或跨不同浏览器自动同步进度。
  - **键位练习 vs. 操作系统 IME 选字**：注音模式专注于训练实体按键对应大千注音符号的盲打肌肉记忆，模拟直接输入拼音/注音字符，刻意不模拟操作系统层级的中文选字候选清单。
  - **移动端虚拟键盘限制**：移动端浏览器虚拟键盘的 IME 组字与按键事件机制与实体键盘差异显著，强烈建议使用实体键盘进行大千注音指法练习以获得最佳体验。
