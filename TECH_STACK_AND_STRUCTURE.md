# 技术栈与模块结构

## 1. 技术栈

### 前端

- React
- TypeScript
- Vite
- React Router

### 后端

- Hono
- TypeScript
- Bun
- WebSocket / SSE

### 数据库

- PostgreSQL

### Agent 能力

- 后端内部 TypeScript agent 模块
- Job / Step / Adapter 模型

### 文件存储

- MVP 使用本地文件存储
- 后续可升级到对象存储

## 2. 模块与文件架构

```text
paper_read/
├─ packages/
│  └─ shared/
│     ├─ src/
│     │  └─ index.ts
│     ├─ package.json
│     └─ tsconfig.json
├─ web/
│  ├─ public/
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  ├─ router/
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ modules/
│  │  ├─ services/
│  │  ├─ hooks/
│  │  ├─ types/
│  │  ├─ utils/
│  │  └─ styles/
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ backend/
│  ├─ infra/
│  │  ├─ docker/
│  │  └─ sql/
│  ├─ storage/
│  │  ├─ pdf/
│  │  ├─ markdown/
│  │  ├─ notes/
│  │  └─ exports/
│  ├─ src/
│  │  ├─ server.ts
│  │  ├─ app.ts
│  │  ├─ config/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ modules/
│  │  │  ├─ agent/
│  │  │  ├─ projects/
│  │  │  ├─ papers/
│  │  │  └─ tasks/
│  │  ├─ db/
│  │  ├─ lib/
│  │  └─ types/
│  ├─ tests/
│  ├─ package.json
│  └─ tsconfig.json
├─ docs/
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
└─ README.md
```

## 3. Monorepo 约定

- 根目录使用 `pnpm-workspace.yaml` 管理 `packages/*`、`web`、`backend`
- 根目录统一维护 workspace 和通用 TypeScript 工具
- 共享类型与跨端模型收敛到 `packages/shared`
- agent 作为 `backend/src/modules/agent/` 内部模块存在
- Bun 与 Hono 相关依赖只放在 `backend` 包内
