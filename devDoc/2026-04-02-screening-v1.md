# 2026-04-02 Screening V1

- 重构后端为第一版提问式筛选架构：`sources`、`papers`、`screening`。
- 新增基于规则的意图分析与论文筛选执行器，支持提问历史、运行状态和结果列表。
- 重写前端为单页筛选工作台：侧边栏历史、源选择、提问输入、状态卡片、结果表格。
- 调整 PostgreSQL 环境变量为显式 `POSTGRES_*` 配置，并新增 `backend/.env.example`。
- 后端已切换为真实 PostgreSQL 存储，并在启动时自动创建 `papers`、`screening_queries`、`screening_results` 三张表。
