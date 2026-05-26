# 文档同步清单

本中文文档站与 [omp.sh/docs](https://omp.sh/docs) 官方英文文档 1:1 对应，方便逐页对照与同步更新。

## 页面映射

| 中文页 | 官方英文页 |
| --- | --- |
| [项目概览](../guide/overview.md) | [Overview](https://omp.sh/docs) |
| [安装与升级](../guide/install.md) | — (来自 README) |
| [快速上手](../guide/quickstart.md) | [Quickstart](https://omp.sh/docs/quickstart) |
| [使用 omp](../guide/using.md) | [Using omp](https://omp.sh/docs/using) |
| [Slash 命令](../guide/slash-commands.md) | [Slash commands](https://omp.sh/docs/slash) |
| [快捷键](../guide/keybindings.md) | [Keybindings](https://omp.sh/docs/keybindings) |
| [设置](../guide/settings.md) | [Settings](https://omp.sh/docs/settings) |
| [运行模式](../guide/modes.md) | [Run modes](https://omp.sh/docs/modes) |
| [会话](../guide/sessions.md) | [Sessions](https://omp.sh/docs/sessions) |
| [会话树](../guide/session-tree.md) | [Session tree](https://omp.sh/docs/session-tree) |
| [记忆](../guide/memory.md) | [Memory](https://omp.sh/docs/memory) |
| [压缩](../guide/compaction.md) | [Compaction](https://omp.sh/docs/compaction) |
| [计划模式](../guide/plan.md) | [Plan mode](https://omp.sh/docs/plan) |
| [目标模式](../guide/goal.md) | [Goal mode](https://omp.sh/docs/goal) |
| [交接](../guide/handoff.md) | [Handoff](https://omp.sh/docs/handoff) |
| [文件操作](../guide/files.md) | [Working with files](https://omp.sh/docs/files) |
| [代码智能](../guide/code-intelligence.md) | [Code intelligence](https://omp.sh/docs/code-intelligence) |
| [调试](../guide/debugging.md) | [Debugging](https://omp.sh/docs/debugging) |
| [结构化编辑](../guide/editing.md) | [Structural edits](https://omp.sh/docs/editing) |
| [子代理与 IRC](../guide/subagents.md) | [Subagents & IRC](https://omp.sh/docs/subagents) |
| [Web 与浏览器](../guide/web.md) | [Web & browser](https://omp.sh/docs/web) |
| [GitHub](../guide/github.md) | [GitHub](https://omp.sh/docs/github) |
| [Provider](../guide/providers.md) | [Providers](https://omp.sh/docs/providers) |
| [模型角色](../guide/roles.md) | [Model roles](https://omp.sh/docs/roles) |
| [自定义模型与 Provider](../guide/custom-models.md) | [Custom models & providers](https://omp.sh/docs/custom-models) |
| [上下文文件](../guide/context-files.md) | [Context files](https://omp.sh/docs/context-files) |
| [技能](../guide/skills.md) | [Skills](https://omp.sh/docs/skills) |
| [Prompt 模板](../guide/prompt-templates.md) | [Prompt templates](https://omp.sh/docs/prompt-templates) |
| [Hook](../guide/hooks.md) | [Hooks](https://omp.sh/docs/hooks) |
| [自定义工具](../guide/custom-tools.md) | [Custom tools](https://omp.sh/docs/custom-tools) |
| [编写子代理](../guide/subagent-authoring.md) | [Authoring subagents](https://omp.sh/docs/subagent-authoring) |
| [MCP](../guide/mcp.md) | [MCP](https://omp.sh/docs/mcp) |
| [编写 MCP 服务端](../guide/mcp-authoring.md) | [Authoring MCP servers](https://omp.sh/docs/mcp-authoring) |
| [主题](../guide/themes.md) | [Themes](https://omp.sh/docs/themes) |
| [TTSR 规则](../guide/ttsr.md) | [TTSR rules](https://omp.sh/docs/ttsr) |
| [插件](../guide/plugins.md) | [Plugins](https://omp.sh/docs/plugins) |
| [编写扩展](../guide/extension-authoring.md) | [Authoring extensions](https://omp.sh/docs/extension-authoring) |
| [市场](../guide/marketplace.md) | [Marketplaces](https://omp.sh/docs/marketplace) |
| [SDK](../guide/sdk.md) | [SDK](https://omp.sh/docs/sdk) |
| [RPC 模式](../guide/rpc.md) | [RPC mode](https://omp.sh/docs/rpc) |
| [ACP](../guide/acp.md) | [ACP](https://omp.sh/docs/acp) |
| [CLI 参考](./cli.md) | [CLI reference](https://omp.sh/docs/cli) |
| [环境变量](./env.md) | [Environment variables](https://omp.sh/docs/env) |
| [密钥与认证](./secrets.md) | [Secrets and auth](https://omp.sh/docs/secrets) |
| [会话格式](./session-format.md) | [Session format](https://omp.sh/docs/session-format) |
| [工具索引](../guide/tools.md) | [Tools index](https://omp.sh/docs/tools) |

## 维护说明

上游更新后按以下步骤同步：

1. 访问 [omp.sh/docs](https://omp.sh/docs)，逐页对比是否有内容变更。
2. 对变更的页面，获取最新英文内容并更新对应中文页。
3. 如有新增页面，在本清单中添加对应行，并创建中文翻译页。
4. 如有删除页面，移除对应中文页和清单行。
5. 本地运行 `npm run docs:build` 验证构建和链接。
