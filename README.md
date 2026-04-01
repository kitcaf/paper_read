# paper-read

Web-first AI paper screening and reading system.

Current target architecture:

- Frontend: React + TypeScript
- Backend API: Node.js + TypeScript
- Database: PostgreSQL
- Agent runtime: TypeScript self-built workflow engine
- Runtime model: Web app + background worker

Suggested top-level layout:

- `web/`
- `backend/`
- `agent/`

Basic repository scripts:

- `npm run dev:web`
- `npm run dev:backend`
- `npm run dev:agent`

Docs:

- `docs/paper_reader_requirements.md`
- `docs/paper_reader_technical_design_typescript.md`
- `TECH_STACK_AND_STRUCTURE.md`
