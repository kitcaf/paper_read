# AI Paper Reader 本地桌面技术设计文档

## 1. 文档目的

本文档用于明确项目新的技术路线：

- 产品形态从 Web + backend 调整为 local-first 桌面 App
- 桌面壳使用 Tauri v2
- UI 继续使用 React + TypeScript
- 核心 agent 使用 TypeScript，并由 Bun 编译为本地 sidecar
- 本地持久化使用 SQLite
- 不再依赖远程 PostgreSQL 或远程 backend

## 2. 核心技术决策

### 2.1 为什么改成本地桌面 App

当前产品是单用户研究工作台，不需要多租户、用户系统和公网服务。用户数据、论文源缓存、筛选结果和对话历史都更适合放在本地 workspace 中。

因此目标架构改成：

```text
React UI
  -> Tauri thin host
    -> Bun TypeScript agent sidecar
      -> SQLite workspace
      -> local files/cache
      -> source connectors
      -> LLM providers
```

### 2.2 为什么使用 Tauri v2

Tauri v2 负责桌面应用宿主能力：

- 窗口
- 权限
- sidecar 生命周期
- command/event 转发
- 本地应用路径

Rust 不承载业务逻辑，只做极薄 host。

### 2.3 为什么 agent 仍然使用 TypeScript

项目主栈仍然是 TypeScript。agent runtime 放在 `packages/agent-runtime`，由 Bun 编译为 sidecar executable。这样后续可以复用到：

- Desktop App
- CLI
- Docker self-host
- headless batch mode

### 2.4 为什么使用 SQLite

本地端只需要最小嵌入式数据库：

- 对话历史
- 消息
- 论文元数据
- 筛选结果

SQLite 不需要数据库服务，也不需要用户安装 PostgreSQL，符合本地桌面应用的部署目标。

## 3. 进程与模块边界

### 3.1 React UI

位置：

```text
apps/desktop/src/
```

职责：

- 三栏 UI
- 聊天输入
- 工具调用入口
- 历史对话展示
- 筛选论文结果展示

不负责：

- 直接访问 SQLite
- 执行 agent
- 调用 LLM
- 读写本地文件

### 3.2 Tauri Host

位置：

```text
apps/desktop/src-tauri/
```

职责：

- 注册最小 Rust command
- 启动/停止 Bun sidecar
- 转发 sidecar stdout/stderr event
- 返回 workspace 路径
- 管理 capabilities

当前最小 command：

- `get_workspace_path`
- `start_agent_runtime`
- `send_agent_command`
- `stop_agent_runtime`

### 3.3 Agent Runtime

位置：

```text
packages/agent-runtime/
```

职责：

- 初始化 workspace
- 初始化 SQLite schema
- 处理 command/event 协议
- 管理论文源
- 执行 title-only screening MVP
- 写入 conversation/message/result

### 3.4 Shared Contracts

位置：

```text
packages/shared/
```

职责：

- command 类型
- event 类型
- source 类型
- screening 类型
- UI 与 sidecar 共享的数据结构

## 4. 本地数据模型

SQLite 第一版只保留 4 张表：

```text
conversations
messages
papers
screening_results
```

暂时不做：

- users
- projects
- tasks
- remote sync
- PostgreSQL

## 5. Sidecar 通信协议

UI 到 Tauri：

```text
invoke("send_agent_command", { command: JSON.stringify(command) })
```

Tauri 到 sidecar：

```text
stdin JSON line
```

sidecar 到 Tauri：

```text
stdout JSON line
```

Tauri 到 UI：

```text
agent-runtime:event
agent-runtime:error
agent-runtime:terminated
```

## 6. Monorepo 结构

```text
paper_read/
├─ apps/
│  └─ desktop/
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

项目不再保留远程 backend 运行路径，React UI 通过 Tauri command/event 与本地 sidecar 通信。

## 7. 结论

项目目标架构正式收敛为：

**Tauri v2 + React UI + Bun compiled TypeScript agent sidecar + SQLite local workspace。**
