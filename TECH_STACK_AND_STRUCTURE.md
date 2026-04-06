# 技术栈与模块结构

## 1. 技术栈

### 桌面壳

- Tauri v2
- Rust 只做极薄 host
- Tauri capabilities 控制 sidecar 权限

### UI

- React
- TypeScript
- Vite
- TailwindCSS
- React Router

### Agent Runtime

- TypeScript
- Bun
- Bun compiled executable sidecar
- 长期运行的本地 agent runtime

### 本地数据

- SQLite
- 由 `packages/agent-runtime` 独占访问
- React UI 不直接访问数据库

### 后续可扩展能力

- `packages/source-connectors` 管理论文源连接器
- `packages/prompt-spec` 管理 prompt 与工具协议
- 未来 Docker/CLI/headless 模式复用 `agent-runtime`

## 2. 模块与文件架构

```text
paper_read/
├─ apps/
│  └─ desktop/
│     ├─ src/
│     │  ├─ main.tsx
│     │  ├─ App.tsx
│     │  ├─ pages/
│     │  ├─ components/
│     │  ├─ features/
│     │  ├─ hooks/
│     │  ├─ services/
│     │  ├─ styles/
│     │  └─ utils/
│     ├─ src-tauri/
│     │  ├─ src/
│     │  │  ├─ lib.rs
│     │  │  └─ main.rs
│     │  ├─ capabilities/
│     │  │  └─ default.json
│     │  ├─ binaries/
│     │  ├─ Cargo.toml
│     │  └─ tauri.conf.json
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ vite.config.ts
├─ packages/
│  ├─ shared/
│  ├─ agent-runtime/
│  ├─ source-connectors/
│  └─ prompt-spec/
├─ devDoc/
├─ docs/
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

## 3. 架构约定

- `apps/desktop/src` 只负责 React UI 和交互。
- `apps/desktop/src-tauri` 只负责桌面 host、权限、sidecar 生命周期和事件转发。
- `packages/agent-runtime` 负责本地 agent、SQLite、source、LLM adapter 和筛选工作流。
- `packages/shared` 放 UI 与 sidecar 共用的 command/event/data contract。
- `packages/source-connectors` 放论文源连接器边界。
- `packages/prompt-spec` 放 prompt 与工具协议。
- 项目不再保留远程 backend 作为运行路径，UI 通过 Tauri 与本地 sidecar 通信。
