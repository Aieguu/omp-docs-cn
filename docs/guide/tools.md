# 工具索引

在会话中运行 `/tools` 可查看实时工具面板；在 CLI 中使用 `--tools read,search,edit` 限制可用工具。下表涵盖开箱即用的工具。

| 工具 | 简述 | 文档页面 |
| --- | --- | --- |
| `ast_edit` | 通过 ast-grep 模式进行结构化代码迁移；写入前预览暂存。 | [结构化编辑](./editing.md) |
| `bash` | 在持久会话中运行 shell 命令，支持 cwd、env 和 PTY 控制。 | [文件操作](./files.md) |
| `browser` | 通过 Puppeteer 驱动真实 Chromium 标签页；标签页跨调用持久化。 | [Web 与浏览器](./web.md) |
| `debug` | DAP 驱动的断点、单步执行和局部变量检查。 | [调试](./debugging.md) |
| `edit` | 基于每个会话读取缓存的行锚定补丁。 | [文件操作](./files.md) |
| `eval` | 在持久内核中运行 Python 或 JS 代码单元。 | [文件操作](./files.md) |
| `find` | 通过通配符快速查找文件名；按修改时间排序。 | [文件操作](./files.md) |
| `generate_image` | 结构化图像生成，支持主体、场景、光照和风格字段。 | [工具索引](./tools.md) |
| `github` | 基于操作的 gh 封装：repo\_view、pr\_create、pr\_checkout、search\_\*、run\_watch。 | [GitHub](./github.md) |
| `inspect_image` | 将本地图片交给视觉模型并获取文本回答。 | [工具索引](./tools.md) |
| `irc` | 同一进程内活跃对等 agent 之间的简短散文消息。 | [子 agent 与 IRC](./subagents.md) |
| `job` | 等待或取消由 bash --async 或 task 启动的后台任务。 | [子 agent 与 IRC](./subagents.md) |
| `lsp` | 重命名、引用、定义、悬停、诊断、代码操作。 | [代码智能](./code-intelligence.md) |
| `read` | 文件、目录、归档、SQLite、文档、图片、内部 URI、Web URL。 | [文件操作](./files.md) |
| `recipe` | 运行项目任务运行器（bun、just、make、cargo）中的目标。 | [文件操作](./files.md) |
| `report_tool_issue` | 标记意外的工具行为以进行自动化 QA 跟踪。 | [工具索引](./tools.md) |
| `resolve` | 应用或丢弃待处理的预览操作（ast\_edit、计划模式审批）。 | [结构化编辑](./editing.md) |
| `search` | 跨文件、目录、通配符和内部 URL 的正则内容搜索。 | [文件操作](./files.md) |
| `task` | 启动并行子 agent；结果以 agent:// URL 返回。 | [子 agent 与 IRC](./subagents.md) |
| `todo_write` | 在 TUI 中实时渲染的分阶段任务跟踪。 | [子 agent 与 IRC](./subagents.md) |
| `web_search` | 单次查询，通过第一个可用的搜索提供者分发。 | [Web 与浏览器](./web.md) |
| `write` | 创建或覆盖文件、归档条目或 SQLite 行。 | [文件操作](./files.md) |
