# AI Paper Reader 全 TypeScript 技术设计文档

## 1. 文档目的

本文档用于明确项目当前采用的技术路线：

- 前端使用 React + TypeScript
- 后端使用 Node.js + TypeScript
- Agent 作为后端内部模块存在
- 数据库使用 PostgreSQL
- Web 应用作为唯一主入口

## 2. 核心技术决策

### 2.1 为什么统一到全 TypeScript

统一语言栈带来的收益非常直接：

- 前端、后端使用同一门语言
- 团队上下文切换成本更低
- DTO 和状态类型更容易保持一致
- Web 产品开发节奏更顺

### 2.2 为什么后端选择 Node.js + TypeScript + Fastify

当前后端更适合采用 Fastify，原因是：

1. TypeScript 支持自然
2. 对 API、WebSocket、后台任务协调都足够成熟
3. 足够轻量，适合当前阶段

### 2.3 为什么 agent 收回到 backend 内部

当前项目的核心还是标准 Web 应用，不是独立 Agent 平台。

所以更合理的结构是：

- `web` 负责前端
- `backend` 负责 API 和业务模块
- `backend/src/modules/agent` 负责智能处理能力

这种方式更适合当前阶段，因为：

- agent 只是后端业务能力之一
- 不需要额外维护一个顶层独立服务目录
- 数据、任务、调度都更容易围绕后端统一组织

## 3. 总体系统架构

```text
React Web
  -> Node.js Backend API
    -> PostgreSQL
    -> File Storage
    -> Backend Agent Module
      -> LLM Adapter
      -> PDF Fetcher
      -> PDF Parser
```

如果需要实时任务更新，前后端之间使用：

- WebSocket
或
- SSE

## 4. 服务职责划分

## 4.1 `web`

前端负责：

- 页面展示
- 项目与任务操作
- 列表筛选与详情查看
- 接收任务状态更新

## 4.2 `backend`

后端负责：

- 提供 HTTP / WebSocket 接口
- 管理项目、论文、任务、导出等业务对象
- 维护任务记录与状态
- 内部调用 agent 模块执行智能处理

## 4.3 `backend/modules/agent`

agent 模块负责：

- 处理 screening / reading 类型任务
- 组织 step 执行
- 封装 LLM、下载、解析等外部能力
- 记录事件、错误和中间产物

## 5. Backend 内部 agent 设计

## 5.1 核心抽象

当前 agent 模块采用三层抽象：

1. `Job`
2. `Step`
3. `Adapter`

对应职责：

- `Job`：数据库中的任务记录
- `Step`：单个处理步骤
- `Adapter`：对外部依赖的封装

## 5.2 推荐 step 粒度

建议保持以下处理粒度：

- `loadProjectContext`
- `screenAbstract`
- `fetchPdf`
- `parsePdf`
- `extractInsights`

## 5.3 模块位置

```text
backend/src/modules/agent/
├─ agent.route.ts
├─ agent.service.ts
├─ worker.ts
├─ config/
├─ core/
├─ workflows/
├─ steps/
├─ adapters/
├─ repositories/
├─ services/
├─ prompts/
├─ runtime/
└─ types/
```

说明：

- `agent.route.ts`：暴露 agent 相关接口
- `agent.service.ts`：提供模块级调用入口
- `worker.ts`：后台循环入口
- 其余目录用于组织具体实现

## 6. 前端模块设计

```text
web/src/
├─ main.tsx
├─ App.tsx
├─ router/
├─ pages/
├─ components/
├─ modules/
├─ services/
├─ hooks/
├─ types/
├─ utils/
└─ styles/
```

## 7. 后端模块设计

```text
backend/src/
├─ app.ts
├─ server.ts
├─ config/
├─ plugins/
├─ routes/
├─ modules/
│  ├─ agent/
│  ├─ projects/
│  ├─ papers/
│  └─ tasks/
├─ db/
├─ lib/
└─ types/
```

## 8. Monorepo 结构

```text
paper_read/
├─ packages/
│  └─ shared/
├─ web/
├─ backend/
├─ docs/
├─ infra/
├─ storage/
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

## 9. 结论

当前项目最合适的方向是：

- 前端用 React + TypeScript
- 后端用 Node.js + TypeScript + Fastify
- agent 作为 backend 内部模块存在
- PostgreSQL 做业务持久化

这比单独拆顶层 `agent/` 更符合当前阶段，也更贴近你要的“前后端主架构 + 后端内置 agent 能力”。
