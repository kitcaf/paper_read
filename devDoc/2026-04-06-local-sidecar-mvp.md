# 2026-04-06 Local Sidecar MVP

- 删除旧 `backend` workspace 与后端启动脚本，项目运行路径收敛到 Tauri desktop。
- 前端筛选数据层从 HTTP API 切到 Tauri command/event，通过 `agentClient` 与 Bun sidecar 通信。
- agent-runtime 新增本地 SQLite seed import，启动后可导入 `AAAI 2026` 初始论文源。
- 跑通 `workspace.open -> sources.import_seed -> sources.list -> screening.start -> screening.results.get` 本地 MVP 链路。
- 补齐 Tauri `icon.ico` 和 Rust stdout/stderr 行缓冲，`cargo check`、`pnpm run build`、sidecar compile 均通过。
- agent-runtime 新增统一 `ModelProvider` 适配层，先支持 `mock`、`openai-compatible`、`ollama`，并通过 SQLite `settings` 保存模型配置。
- 模型适配层扩展 `anthropic`、`gemini`、`deepseek` 原生 provider，增加 provider 层流式响应聚合；前端新增模型设置弹窗。
- 新增 `kimi` provider，并把模型调用策略改为真实 provider 默认流式、失败自动降级非流式；前端移除流式开关。
- 模型设置从单配置改为多 `model_profiles`，支持新增、删除、默认模型和对话级模型选择；设置弹窗拆成通用 `ModalRoot` 与 LLM 设置业务界面。
