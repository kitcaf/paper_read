# AI Paper Reader 全 TypeScript 技术设计文档

## 1. 文档目的

本文档用于明确项目当前采用的技术路线：

- 前端使用 React + TypeScript
- 后端使用 Node.js + TypeScript
- Agent 使用 TypeScript 自构建工作流引擎
- 数据库使用 PostgreSQL
- Web 应用作为唯一主入口

这份文档只描述当前推荐的工程架构，不再围绕 Python 或 LangGraph 设计。

## 2. 核心技术决策

### 2.1 为什么统一到全 TypeScript

统一语言栈带来的收益非常直接：

- 前端、后端、agent 使用同一门语言
- 团队上下文切换成本更低
- DTO、状态类型、任务结构更容易保持一致
- Web 产品开发节奏更顺，不需要在 Python 和 TypeScript 间来回切换

### 2.2 为什么后端选择 Node.js + TypeScript

后端当前更适合采用 Node.js + TypeScript，而不是继续保留 Python 服务层，原因是：

1. 和 React 前端天然共享语言与类型思维
2. 对 API、WebSocket、后台任务协调都足够成熟
3. 更适合当前项目以 Web 管理台为核心的产品方向

### 2.3 为什么 Agent 不依赖 LangGraph

当前项目第一版的重点是“论文任务系统”和“长流程处理”，而不是构建复杂多智能体平台。

所以更合理的做法是：

- 用 TypeScript 自己定义 `Job -> Workflow -> Step` 的执行模型
- 把状态写回 PostgreSQL
- 通过事件表或任务状态表驱动前端实时展示

也就是说，当前 Agent 更接近“可恢复的任务工作流引擎”，而不是依赖图框架的通用 Agent 平台。

## 3. 总体系统架构

推荐系统结构如下：

```text
React Web
  -> Node.js Backend API
    -> PostgreSQL
    -> File Storage
    -> Task records
      -> TypeScript Agent Worker
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

前端不直接执行论文处理逻辑。

## 4.2 `backend`

后端 API 负责：

- 提供 HTTP / WebSocket 接口
- 管理项目、论文、任务、导出等业务对象
- 写入任务记录
- 提供分页、筛选和聚合统计
- 协调 agent 运行需要的上下文数据

## 4.3 `agent`

Agent Worker 负责：

- 扫描待执行任务
- 根据任务类型运行对应 workflow
- 逐步执行 screening / reading steps
- 记录任务状态、阶段事件和错误
- 产出 PDF、Markdown、摘要和结构化结果

## 5. Agent 自构建方案

## 5.1 核心抽象

当前 agent 采用四层抽象：

1. `Job`
2. `Workflow`
3. `Step`
4. `Adapter`

它们的职责分别是：

- `Job`：数据库中的任务记录
- `Workflow`：某类任务的完整执行链路
- `Step`：单个可组合、可追踪的处理步骤
- `Adapter`：LLM、PDF 下载、文件存储等外部能力封装

## 5.2 推荐 workflow 拆分

建议至少保留两条主 workflow：

- `screeningWorkflow`
- `readingWorkflow`

其中：

- `screeningWorkflow` 负责标题摘要筛选
- `readingWorkflow` 负责 PDF 获取、解析和结构化抽取

## 5.3 推荐 step 粒度

建议把单步职责收紧到以下粒度：

- `loadProjectContext`
- `screenAbstract`
- `fetchPdf`
- `parsePdf`
- `extractInsights`

这样做的好处是：

- 错误点更容易定位
- 状态记录更细
- 后续补充重试、恢复、人工介入更自然

## 5.4 当前不引入 LangGraph 的原因

不是因为 LangGraph 不行，而是因为当前阶段没必要。

第一版更重要的是：

- 把 Web 产品闭环做起来
- 把任务模型、数据模型、文件资产模型走通
- 把 screening 和 reading 两条 workflow 跑顺

如果后期 workflow 分支、人工审核、中断恢复明显变复杂，再升级到图式编排也来得及。

## 6. 前端模块设计

前端采用直观的页面和业务模块结构：

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

说明：

- `pages/`：页面入口
- `components/`：通用组件
- `modules/`：项目、论文、任务等业务模块
- `services/`：API 请求封装
- `hooks/`：通用 hooks
- `types/`：前端类型定义

## 7. 后端模块设计

后端采用 Node.js 常见的 feature-based 结构：

```text
backend/src/
├─ app.ts
├─ server.ts
├─ config/
├─ plugins/
├─ routes/
├─ modules/
│  ├─ projects/
│  ├─ papers/
│  └─ tasks/
├─ db/
├─ lib/
└─ types/
```

说明：

- `routes/`：全局路由注册与健康检查
- `modules/`：按业务域拆分的模块
- `db/`：数据库连接和 schema 定义
- `lib/`：日志等基础能力

## 8. Agent 模块设计

Agent 采用 workflow + step 结构：

```text
agent/src/
├─ worker.ts
├─ config/
├─ core/
├─ workflows/
│  ├─ screening/
│  └─ reading/
├─ steps/
├─ adapters/
├─ repositories/
├─ services/
├─ prompts/
├─ runtime/
└─ types/
```

说明：

- `core/`：任务和 workflow 抽象
- `workflows/`：每类任务的执行链路
- `steps/`：可复用处理步骤
- `adapters/`：LLM、存储、下载等外部封装
- `runtime/`：worker 轮询与运行时控制

## 9. 推荐仓库结构

最终仓库结构保持三块并列：

```text
paper_read/
├─ web/
├─ backend/
├─ agent/
├─ docs/
├─ infra/
├─ storage/
├─ .env.example
├─ package.json
└─ README.md
```

这个结构的优点是：

- 一眼能看懂模块职责
- 同仓协作成本低
- 不需要一开始就引入重型 monorepo 工具

## 10. 结论

当前项目最合适的方向是：

- 前端用 React + TypeScript
- 后端用 Node.js + TypeScript
- Agent 用 TypeScript 自构建 workflow 引擎
- PostgreSQL 做业务持久化

这条路线最适合现在的产品阶段，因为它减少了技术栈分裂，又能保留足够清晰的任务编排能力。
