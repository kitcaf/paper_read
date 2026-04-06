# AI Paper Reader 本地桌面需求文档

## 1. 产品定位

AI Paper Reader 是一个 local-first 的个人论文研究工作台。

第一版目标：

- 本地桌面 App
- 不依赖远程服务器
- 通过对话方式触发论文筛选工具
- 基于本地论文源数据进行 title-only screening
- 结果保存在本地 workspace

## 2. 核心用户场景

### 2.1 提问式筛选论文

用户打开桌面 App 后：

1. 点击聊天输入框中的“筛选论文”工具
2. 选择论文源
3. 输入调研主题
4. 本地 agent runtime 读取该源论文标题
5. agent 输出筛选过程事件
6. 右侧展示筛选出来的论文

### 2.2 历史对话

用户可以在左侧查看历史对话，并回到某次筛选上下文。

### 2.3 本地工作区

用户数据保存在本地 workspace：

```text
workspace/
├─ workspace.sqlite
├─ cache/
├─ imports/
└─ exports/
```

## 3. MVP 功能边界

第一版只做：

- 本地桌面壳
- 三栏 UI
- Bun agent sidecar
- SQLite 最小 schema
- source 列表读取
- title-only screening
- 对话与结果本地保存

第一版不做：

- 用户系统
- 远程后端
- PostgreSQL
- PDF 下载
- 全文解析
- 多用户协作
- 远程同步

## 4. 架构边界

- React UI 只做展示和交互
- Tauri/Rust 只做 host、权限和 sidecar 转发
- Bun TypeScript sidecar 负责业务逻辑
- SQLite 只由 sidecar 访问
- 文件缓存放 workspace 本地目录

## 5. 一期实现顺序

1. Tauri desktop 骨架
2. Bun agent sidecar 骨架
3. shared command/event contract
4. SQLite schema
5. UI 与 sidecar 通信
6. title-only screening MVP
7. 继续扩展本地论文源导入能力

## 6. 结论

这个项目当前更适合做成本地优先的桌面研究工具，而不是 Web + 后端服务。
