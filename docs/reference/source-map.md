# 上游文档覆盖清单

本文档站基于 `can1357/oh-my-pi` 的 README 和 `docs/` 目录整理，参考提交：

```text
774d32c chore: bump version to 15.4.1
```

## 已覆盖主题

| 中文页 | 覆盖的上游主题 |
| --- | --- |
| [项目概览](../guide/overview.md) | README、工具总览、Provider 总览、入口模式、monorepo packages。 |
| [安装与升级](../guide/install.md) | README install、配置目录、运行入口。 |
| [快速上手](../guide/quickstart.md) | TUI、one-shot、slash commands、LSP、debug、task。 |
| [核心概念](../guide/concepts.md) | session、skills、extensions、MCP、memory、tool surface。 |
| [工具系统](../guide/tools.md) | `docs/tools/*`、bash/runtime、read/edit/search、task、memory。 |
| [会话、分支与记忆](../guide/sessions.md) | `session.md`、`tree.md`、`compaction.md`、`blob-artifact-architecture.md`、memory docs。 |
| [配置体系](../guide/config.md) | `config-usage.md`、`environment-variables.md`、settings discovery。 |
| [模型与 Provider](../guide/models.md) | `models.md`、`ai-schema-normalize.md`、`auth-broker-gateway.md`、provider streaming。 |
| [扩展、技能、MCP 与 Hook](../guide/extensibility.md) | `extensions.md`、`extension-loading.md`、`skills.md`、`hooks.md`、`mcp-config.md`、custom tools。 |
| [架构与运行时](../guide/internals.md) | natives、TUI、shell/PTY、LSP/DAP、RPC/ACP、schema normalize、TTSR。 |
| [环境变量速查](./env.md) | `environment-variables.md`。 |
| [MCP 配置速查](./mcp.md) | `mcp-config.md`、MCP runtime lifecycle / transports。 |
| [内置工具目录](./tool-catalog.md) | `docs/tools/*.md`。 |

## 上游文档文件分组

### 用户与配置

- `README.md`
- `docs/config-usage.md`
- `docs/environment-variables.md`
- `docs/models.md`
- `docs/mcp-config.md`
- `docs/lsp-config.md`
- `docs/keybindings.md`
- `docs/theme.md`
- `docs/secrets.md`
- `docs/install-id.md`

### 工具与运行时

- `docs/tools/*.md`
- `docs/bash-tool-runtime.md`
- `docs/notebook-tool-runtime.md`
- `docs/python-repl.md`
- `docs/resolve-tool-runtime.md`
- `docs/render-mermaid.md`
- `docs/custom-tools.md`

### 会话与上下文

- `docs/session.md`
- `docs/tree.md`
- `docs/session-tree-plan.md`
- `docs/session-operations-export-share-fork-resume.md`
- `docs/session-switching-and-recent-listing.md`
- `docs/compaction.md`
- `docs/handoff-generation-pipeline.md`
- `docs/blob-artifact-architecture.md`
- `docs/non-compaction-retry-policy.md`
- `docs/rulebook-matching-pipeline.md`
- `docs/ttsr-injection-lifecycle.md`
- `docs/memory.md`

### 扩展生态

- `docs/extensions.md`
- `docs/extension-loading.md`
- `docs/gemini-manifest-extensions.md`
- `docs/hooks.md`
- `docs/skills.md`
- `docs/skills/authoring-extensions.md`
- `docs/skills/authoring-hooks.md`
- `docs/skills/authoring-marketplaces.md`
- `docs/skills/examples/*`
- `docs/marketplace.md`
- `docs/plugin-manager-installer-plumbing.md`
- `docs/task-agent-discovery.md`

### 原生与架构

- `docs/natives-architecture.md`
- `docs/natives-addon-loader-runtime.md`
- `docs/natives-binding-contract.md`
- `docs/natives-build-release-debugging.md`
- `docs/natives-media-system-utils.md`
- `docs/natives-rust-task-cancellation.md`
- `docs/natives-shell-pty-process.md`
- `docs/natives-text-search-pipeline.md`
- `docs/fs-scan-cache-architecture.md`
- `docs/porting-to-natives.md`
- `docs/porting-from-pi-mono.md`

### 协议与 API

- `docs/sdk.md`
- `docs/rpc.md`
- `docs/auth-broker-gateway.md`
- `docs/mcp-runtime-lifecycle.md`
- `docs/mcp-protocol-transports.md`
- `docs/mcp-server-tool-authoring.md`
- `docs/provider-streaming-internals.md`
- `docs/ai-schema-normalize.md`

### 其他内部记录

- `docs/tui.md`
- `docs/tui-runtime-internals.md`
- `docs/slash-command-internals.md`
- `docs/ERRATA-GPT5-HARMONY.md`

## 维护说明

上游更新后建议按以下顺序同步：

1. 拉取上游最新 `README.md` 和 `docs/`。
2. 对比新增 / 删除文档文件。
3. 先更新 `source-map.md`。
4. 再更新对应中文主题页。
5. 本地运行 `npm run docs:build` 验证链接和构建。
