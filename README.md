# paper-read

Web-first AI paper screening and reading system.

Current target architecture:

- Frontend: React + TypeScript
- Backend API: Hono + TypeScript
- Backend runtime: Bun
- Database: PostgreSQL
- Agent capability: backend-internal TypeScript module
- Runtime model: Web app + backend service

Repository mode:

- Lightweight monorepo with `pnpm-workspace.yaml`
- Shared cross-package types in `packages/shared`

Suggested top-level layout:

- `packages/shared/`
- `web/`
- `backend/`

Basic repository scripts:

- `pnpm install`
- `pnpm run dev:web`
- `pnpm run dev:backend`
- `pnpm run dev:worker`
- `pnpm run build:shared`
- `pnpm run build:backend`
- `pnpm run build:web`
- `pnpm run build`

Backend package scripts:

- `pnpm --filter @paper-read/backend dev` -> `bun --watch src/server.ts`
- `pnpm --filter @paper-read/backend dev:worker` -> `bun --watch src/modules/agent/worker.ts`

Docs:

- `docs/paper_reader_requirements.md`
- `docs/paper_reader_technical_design_typescript.md`
- `TECH_STACK_AND_STRUCTURE.md`
