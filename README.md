# paper-read

一个对话驱动的论文研究 agent

它是 agent
它是对话驱动
但是它主要服务论文研究

我建议你定 4 条硬边界：

领域边界
    只做论文研究
    不扩张到通用助理
工具边界
    工具只围绕论文生命周期
    不做无关工具
上下文边界
    agent 默认优先用当前对话、当前 source、当前论文列表
    不做无限上下文堆叠
UI 边界
    聊天是主入口
    右侧永远只展示“当前研究上下文”
    不堆太多控制台式面板

目前暂时定的功能模块是：
阶段 1
    自由聊天
    筛选论文工具
    右侧展示筛选结果
    阶段 2

论文详情
    引用论文继续追问
    多篇对比
    阶段 3

下载论文
    阅读摘要/全文
    结构化分析
    阶段 4

研究总结
    导出报告/笔记


Local-first AI paper research workspace.

Current target architecture:

- Desktop app shell: Tauri v2
- UI: React + TypeScript + Vite
- Agent runtime: Bun-compiled TypeScript sidecar
- Local storage: SQLite workspace file managed by the sidecar
- Rust role: thin host only, responsible for windowing, permissions, sidecar lifecycle, and command/event forwarding
- Runtime model: local desktop app, no remote backend required

Repository mode:

- Lightweight pnpm monorepo
- Shared UI/sidecar contracts in `packages/shared`
- Agent runtime in `packages/agent-runtime`
- Source connector boundaries in `packages/source-connectors`
- Prompt/tool contracts in `packages/prompt-spec`

Suggested top-level layout:

- `apps/desktop/`
- `packages/shared/`
- `packages/agent-runtime/`
- `packages/source-connectors/`
- `packages/prompt-spec/`

Basic scripts:

- `pnpm install`
- `pnpm run dev:ui` for UI-only Vite preview
- `pnpm run dev:desktop` for the functional Tauri + sidecar app
- `pnpm run build:shared`
- `pnpm run build:agent-runtime`
- `pnpm run build:desktop`
- `pnpm run build`
- `pnpm --filter @paper-read/agent-runtime compile`

Docs:

- `docs/paper_reader_requirements.md`
- `docs/paper_reader_technical_design_typescript.md`
- `TECH_STACK_AND_STRUCTURE.md`
