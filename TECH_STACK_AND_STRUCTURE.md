# 技术栈与模块结构

## 1. 技术栈

### 前端

- React
- TypeScript
- Vite
- React Router

### 后端

- Node.js
- TypeScript
- Fastify
- WebSocket / SSE

### 数据库

- PostgreSQL

### Agent 模块

- TypeScript 自构建 workflow engine
- Workflow / Step / Adapter 模型

### 文件存储

- MVP 使用本地文件存储
- 后续可升级到对象存储

## 2. 模块与文件架构

```text
paper_read/
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
│  ├─ src/
│  │  ├─ app.ts
│  │  ├─ server.ts
│  │  ├─ config/
│  │  ├─ plugins/
│  │  ├─ routes/
│  │  ├─ modules/
│  │  │  ├─ projects/
│  │  │  ├─ papers/
│  │  │  └─ tasks/
│  │  ├─ db/
│  │  ├─ lib/
│  │  └─ types/
│  ├─ tests/
│  ├─ package.json
│  └─ tsconfig.json
├─ agent/
│  ├─ src/
│  │  ├─ worker.ts
│  │  ├─ config/
│  │  ├─ core/
│  │  ├─ workflows/
│  │  │  ├─ screening/
│  │  │  └─ reading/
│  │  ├─ steps/
│  │  ├─ adapters/
│  │  ├─ repositories/
│  │  ├─ services/
│  │  ├─ prompts/
│  │  ├─ runtime/
│  │  └─ types/
│  ├─ tests/
│  ├─ package.json
│  └─ tsconfig.json
├─ docs/
├─ infra/
│  ├─ docker/
│  └─ sql/
├─ storage/
│  ├─ pdf/
│  ├─ markdown/
│  ├─ notes/
│  └─ exports/
├─ .env.example
├─ package.json
├─ tsconfig.base.json
└─ README.md
```
