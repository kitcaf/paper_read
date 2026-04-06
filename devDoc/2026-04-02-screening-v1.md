# 2026-04-02 Screening V1

- 重构后端为第一版提问式筛选架构：`sources`、`papers`、`screening`。
- 新增基于规则的意图分析与论文筛选执行器，支持提问历史、运行状态和结果列表。
- 重写前端为单页筛选工作台：侧边栏历史、源选择、提问输入、状态卡片、结果表格。
- 重构 Web UI 为更偏大模型对话体验的 clean workspace，并接入 TailwindCSS 做统一视觉层。
- 调整提问区布局，让 source screening composer 成为主视觉，右侧说明信息在常见桌面宽度下改为下置，避免输入区被挤压。
- 调整 PostgreSQL 环境变量为显式 `POSTGRES_*` 配置，并新增 `backend/.env.example`。
- 后端已切换为真实 PostgreSQL 存储，并在启动时自动创建 `papers`、`screening_queries`、`screening_results` 三张表。

- 再次重构 Web UI：改成更接近 DeerFlow 的全宽三栏交互布局，并新增 web/src/layout.tsx 作为应用壳。
- 中间区收敛为对话主线程，右侧改为论文上下文面板，去掉大段说明性文案。

- 调整中间对话区：将 QueryComposer 改为主栏内固定浮动到底部的输入面板，并为消息区补充底部留白。

- 新增三栏可拖拽布局：左栏与右栏支持拖动调宽度，并通过 localStorage 持久化布局宽度。

- 接入 lucide-react，并为左右侧栏增加隐藏/展开按钮与分栏动画；左右侧栏支持拖拽调宽和显隐切换。

- 将中间主区改为工具式对话 MVP：新增筛选论文工具按钮、source 选择弹窗、tool context、紧凑输入框与已开始/意图分析/完成消息流。

- 架构迁移到 local-first 桌面方向：将 React UI 移到 apps/desktop，新增 Tauri v2 thin host、Bun TS agent-runtime sidecar、source-connectors、prompt-spec，并在 shared 中加入 command/event contract；旧 backend 暂时保留为 legacy。
