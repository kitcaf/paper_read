# paper-read

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
