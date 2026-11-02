# TriType Arena / 中英打字竞技场

[English](README.md) | [繁體中文](README.zh-TW.md) | **简体中文**

版本：**0.4.1** — 基于 React 18 与 TypeScript 开发的纯前端本地优先（Local-first）多语言打字训练系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[测试](tests)
部署状态尚未核实。

---

## 1. 项目概述 (Project Overview)

**TriType Arena（中英打字竞技场）** 是专为中文与多语言输入法设计的现代浏览器原生打字练习工具。支持英语盲打、简体中文汉语拼音及台湾标准繁体中文注音（大千键盘布局）。系统采用纯前端本地优先（Local-first）架构，无后端依赖、免注册登录、零个人隐私追踪，提供极致流畅与超低延迟的键盘指法锻炼体验。

- 先前部署网址为 [tri-type-arena.vercel.app](https://tri-type-arena.vercel.app)，目前状态尚未核实。
- **目标群体**：双语开发者、打字爱好者、希望建立大千注音或英语标准指法盲打肌肉记忆的学习者。

---

## 2. 系统功能特色 (Features)

- **三语完整本地化界面 (UI i18n)**：完整支持繁体中文 (`zh-TW`)、简体中文 (`zh-CN`) 与英语 (`en`)，自动检测浏览器首选语系，可随时在导航栏切换。
- **无障碍新手导览 (Onboarding Guide)**：三步骤弹窗引导模式、时限与按键操作，具备键盘 Focus Trap、Escape 关闭、焦点还原与随时重新开启。
- **时限挑战模式**：提供 30 秒冲刺、60 秒标准与 120 秒耐力练习。
- **实时数值运算**：实时计算打字速度 (WPM)、净准确率百分比、完成词数与连续连击数 (Combo Streak)。
- **极短时间突波平滑抑制 (Initial Dampening)**：平滑前 2 秒的除算公式，消除因极短时间运算所造成的异常速度峰值。
- **防作弊粘贴拦截 (Anti-Cheat Paste Rejection)**：严格拦截剪贴板直接粘贴，确保每一下敲击均来自真实键盘输入。
- **键盘全流程支持 (Accessibility)**：支持 `Enter` 快速开局、`Esc` 暂停、`Space` 继续挑战，全流程无需依赖鼠标。
- **学习进度面板 (Learning Dashboard)**：使用原生纯 SVG 绘制进度趋势图表（无外部图表依赖包），统计弱键分析与专项练习。

---

## 3. 三大练习模式 (Three Typing Modes)

练习模式与界面语言相互独立，可自由搭配：

1. **英语标准练习 (`en`)**
   - 涵盖高频日常生活单词、短语及现代编程专用术语。
   - 逐字实时比对，支持精确 Backspace 退格修正。

2. **简体汉语拼音 (`pinyin`)**
   - 汉语拼音字母流畅输入（如 `nihao` → `你好`）。
   - 自动语音规范化，专注 Latin 键位至拼音音节的反应速度。

3. **繁体注音 · 台湾标准大千键盘 (`zhuyin`)**
   - 实体键盘英文字键直接映射注音符号（如 `5 j / Space` 对应 `ㄓㄨㄥ`）。
   - 具备实时虚拟大千键盘，动态高亮当前预期敲击的实体按键。
   - 专注建立实体键位至注音符号的盲打肌肉记忆。

---

## 4. 难度等级与题库分级 (Difficulty Levels)

TriType Arena 内置 1,100 笔精选题库，划分为三种难度等级：

| 难度等级 | 英语题库 (500 词) | 拼音题库 (300 词) | 注音题库 (300 词) | 等级说明 |
|---|---|---|---|---|
| **初级 (Beginner)** | 200 词 | 120 词 | 120 词 | 高频日常词汇与基础音节 |
| **中级 (Intermediate)**| 200 词 | 120 词 | 120 词 | 进阶合成词与组合键位 |
| **高级 (Advanced)** | 100 词 | 60 词 | 60 词 | 专业技术词汇、成语及长音节词组 |

- **随机抽取算法**：采用具随机数种子 (Seeded) 的 `ShuffleBag` 算法与 Fisher-Yates 洗牌机制，保证循环边界不重复（第 $N$ 轮末题绝不等于第 $N+1$ 轮首题）。

---

## 5. 注音第一声空格键规则 (Zhuyin First-Tone Space Rule, v0.4.1)

在标准台湾大千式注音键盘中，**第一声（阴平）**并无实体调号键。TriType Arena 严格遵循真实打字规则：

- **第一声必须按空格键**：输入第一声音节时，用户**必须按下实体 Space 键 (`' '`)** 以完成该音节（例如“中午”之“中”：`5` (ㄓ) + `j` (ㄨ) + `/` (ㄥ) + `Space`）。
- **非第一声调号**：二声 `6` (ˊ)、三声 `3` (ˇ)、四声 `4` (ˋ)、轻声 `7` (˙) 使用对应键输入，输入非第一声调号后严禁多按空格键。
- **计分与按键纳入**：第一声的 Space 键敲击视为合法有效按键，完全计入 `totalKeys`、`correctKeys`、WPM 计算及弱键统计分析。
- **视觉引导**：当预期按键为第一声空格键时，虚拟大千键盘空格键 (`#daqian-space-key`) 自动触发 `.key-active` 高亮，且目标字符序列显示开口方块符号 `␣` (`target-char-space`)。

---

## 6. 学习历程与弱键复习 (Learning History & Weak-Key Review)

TriType Arena 内置完整的本地离线学习分析模块：

- **挑战历程留存**：每场完成的挑战赛自动保存于 `localStorage` 之 `tritype.learning.v1`（最多保存 200 场，采用 FIFO 轮替淘汰）。
- **弱键判定标准**：按模式将按键数据累积于 `tritype.weakkeys.v1.${mode}`。凡尝试次数 $\ge 10$ 次且错误率 $\ge 20\%$ 的按键，即标记为确认弱键。
- **弱键专项复习 (Review Mode)**：依据当前弱键列表动态合成 10 题专项练习。
- **最高分隔离保护**：复习模式标记为 `sessionType: 'review'`，练习成绩绝不覆写常规挑战赛的本地最高得分 (`tritype.best.v2`)。

---

## 7. 快速开始 (Getting Started)

### 环境需求
- Node.js >= 20.0.0
- npm >= 10.0.0

### 本地安装与启动
```bash
# 克隆仓库
git clone https://github.com/Jake627520/tri-type-arena.git
cd tri-type-arena

# 安装纯净依赖
npm ci

# 启动 Vite 本地开发服务器（依据 vite.config.ts 配置于端口 4174）
npm run dev
# 浏览器访问 http://localhost:4174
```

### 生产构建与预览
```bash
# 执行 TypeScript 类型检查并编译至 dist/
npm run build

# 本地预览生产构建产物
npm run preview
```

---

## 8. 测试命令与质量验证 (Running Tests)

执行以下自动化检查：

```bash
# 执行完整质量门禁 (类型检查、ESLint、Node 与 Vitest 测试、开源许可审计、安全扫描、生产构建)
npm run check
```

### 个别测试命令
- **Node.js 原生单元与合规测试**：`npm test`
- **Vitest 组件与领域集成测试**：`npm run test:vitest`
- **Playwright 端到端浏览器测试**：
  - Chromium：`npm run test:e2e`
  - WebKit (Safari)：`npm run test:e2e:webkit`
  - 跨浏览器完整测试：`npm run test:e2e:all`
- **静态代码检查**：
  - TypeScript 类型检查：`npm run typecheck`
  - ESLint 静态分析：`npm run lint`
- **安全与开源许可审计**：
  - 开源许可合规检查：`npm run audit:licenses`（依项目规则检查依赖包许可）
  - 安全审计：`npm run audit:security` 执行 npm audit，并在已安装时使用 Gitleaks；本地未安装时会警告并跳过，CI 则要求安装。
  - 题库数据完整性检查：`npm run validate:provenance`

---

## 9. 系统架构与技术选型 (Architecture & Technology Stack)

```
tri-type-arena/
├── src/
│   ├── app/                    # 应用程序组装 (App.tsx, styles.css)
│   ├── domain/                 # 纯领域逻辑 (100% 可单独测试，无 React/DOM 依赖)
│   │   ├── vocabulary/         # 1,100 笔精选题库 (en, pinyin, zhuyin)
│   │   ├── learning/           # 历程存储、弱键分析、复习生成器
│   │   ├── shuffle-bag.ts      # 种子随机 Fisher-Yates 与边界防重复算法
│   │   ├── typing-answer.ts    # 运行阶段拼音/注音答案与第一声 Space 推导
│   │   └── session.ts          # 核心游戏状态机
│   ├── features/               # 功能组件层
│   │   ├── typing/             # 打字舞台、难度切换器、打字 Session Hook
│   │   ├── keyboard/           # 大千虚拟键盘 (DaqianKeyboard)
│   │   ├── learning/           # 学习进度面板与纯 SVG 趋势图 (TrendChart)
│   │   ├── stats/              # 实时数据看板 (LiveStats)
│   │   ├── results/            # 结算窗口 (ResultModal)
│   │   └── onboarding/         # 新手导览弹窗 (Onboarding)
│   ├── i18n/                   # 多语言字典与 Hook (core.ts, useLocale.ts)
│   └── shared/                 # LocalStorage 存取与版本配置
├── docs/                       # 系统架构规范与开源合规治理文件
├── openspec/                   # 规范驱动开发 (SDD) 变更提案目录
└── tests/                      # 自动化测试套件
```

| 架构层级 | 技术选型 |
|---|---|
| **前端框架** | React 18.3 |
| **开发语言** | TypeScript 5.6 (严格模式 Strict Mode) |
| **构建工具** | Vite 6.4 (端口 4174) |
| **单元测试** | Node.js Test Runner + Vitest 4.1 |
| **组件测试** | React Testing Library + jsdom |
| **E2E 测试** | Playwright (Chromium & WebKit) |
| **代码规范** | ESLint 9 |
| **静态部署** | Vercel Static Hosting |

---

## 10. 隐私政策与本地存储 (Privacy & LocalStorage)

TriType Arena 贯彻严格的**纯前端本地优先隐私政策**：

- **数据绝不主动外传**：所有按键记录、打字速度 (WPM)、错误率及练习历史仅在用户本地浏览器（`localStorage`）中运算与保存，前端程序绝不主动将任何练习数据上传至外部服务器。
- **无账号系统**：无需注册、无需登录即可即开即练。
- **本地存储键值清单**：
  - `tritype.best.v2`：各模式最高分记录。
  - `tritype.difficulty.v1`：当前选定的难度偏好。
  - `tritype.learning.v1`：200 笔练习历程（采用 FIFO 轮替淘汰）。
  - `tritype.weakkeys.v1.${mode}`：各模式累积的按键尝试次数与错误次数。
  - `tritype.onboarding.v1.completed`：新手导览完成状态标志。
  - `tritype.locale.v1`：界面语言设置。
- **随时可手动清除**：用户可通过学习进度面板中的“清除学习记录”按钮或浏览器清除网站缓存，随时彻底清空本地数据。
- **托管主机必要访问日志**：网站托管于 Vercel CDN 平台，服务器在分发静态资源时依互联网标准协议仍可能记录基础连接日志（如 IP 地址、连接时间、User-Agent 等），此为网络基础设施正常运转与防御网络攻击的技术常态。

---

## 11. 软件许可、依赖项与题库来源发行治理 (Licensing, Dependencies & Governance)

本项目明确划分并严格遵守三层法律与治理架构：

1. **应用程序源码许可**：
   - 应用程序前端源码采用宽松友善的 [MIT License](LICENSE) 开源许可条款发布。
2. **第三方依赖包审计**：
   - 使用 `npm run audit:licenses` 检查依赖包许可，并以 `npm run audit:security` 执行 npm audit，并在已安装时使用 Gitleaks；本地缺少 Gitleaks 时会警告并跳过，CI 则要求安装。最近一次完整 npm audit 在开发工具链报告 10 项中度问题；生产环境依赖包没有发现。审计结果会随时间变化，且需要连接 registry。
3. **词库来源与许可**：
   - 中文词库采用 CC-CEDICT 数据，按 CC BY-SA 4.0 声明；英文词库来自作者声明为公有领域的 Moby Words II。详见[第三方声明](public/notices/index.html)及[来源记录](docs/vocabulary/)。
   - 所有者同意依已记录的许可发布现有数据。来源记录不是法律保证；中文读音尚未完成全面人工审查，注音由拼音机械转写，未确认符合台湾惯用读音。
   - 原始词库仍在 Git 历史；来源审查前请使用不含旧历史的干净快照公开。

---

## 12. 部署状态与已知限制 (Deployment & Known Limitations)

- **部署**：项目含 Vercel 配置；目前部署及其构建配置尚未核实。
- **已知限制**：
  - **单机本地存储 · 无云端同步**：练习记录均保存在当前浏览器的 `localStorage` 中，无法跨设备或跨不同浏览器自动同步进度。
  - **键位练习 vs. 操作系统 IME 选字**：注音模式专注于训练实体按键对应大千注音符号的盲打肌肉记忆，模拟直接输入拼音/注音字符，刻意不模拟操作系统层级的中文选字候选清单。
  - **移动端虚拟键盘限制**：移动端浏览器虚拟键盘的 IME 组字与按键事件机制与实体键盘差异显著，强烈建议使用实体键盘进行大千注音指法练习以获得最佳体验。
