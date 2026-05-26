# 核心概念

## Agent surface

omp 把模型、工具、TUI、会话、配置、扩展和外部协议组织成一个统一的 agent surface。模型不是直接操作系统，而是通过受控工具执行动作；工具的输入输出会被渲染、记录、截断、外部化和持久化。

## Tool

工具是模型可以调用的能力。工具有：

- 名称、描述、参数 schema。
- 执行函数。
- 流式更新和取消信号。
- 结果内容与结构化 details。
- 可选 TUI 渲染。
- 扩展 / Hook 拦截点。

内置工具见 [内置工具目录](../reference/tool-catalog.md)。

## Session

session 是持久化的会话文件。核心特点：

- JSONL，一行一个对象。
- 第一行是 header。
- 后续是 append-only 的 entry。
- entry 通过 `id` / `parentId` 形成树。
- leaf 指针决定当前上下文分支。

这使得同一个会话文件可以保留多条探索路径，而不是只能线性撤销。

## Branch / Fork / Resume / Tree

| 概念 | 作用 |
| --- | --- |
| `/tree` | 在当前 session 文件内部移动 leaf。 |
| `/branch` | 通常从历史 user message 创建新 session；也可按配置进入 tree UI。 |
| `/fork` | 复制整个当前 session 文件。 |
| `/resume` | 从历史会话列表切换到另一个 session。 |

## Compaction

当上下文过长时，omp 会生成摘要并压缩历史。compaction entry 会记录：

- `summary` / `shortSummary`。
- `firstKeptEntryId`。
- 压缩前 token 信息。
- 读写文件等 details。
- 扩展保留数据。

分支切换时也可以生成 branch summary，作为离开某条探索路径的上下文 breadcrumb。

## Skill

Skill 是文件形式的能力包，通常是：

```text
<skills-root>/<skill-name>/SKILL.md
```

它会以轻量元数据暴露给模型，并可以通过 `skill://...` 被 `read` 工具按需读取。Skill 更像“可被模型读取的工作流/知识包”，不是可执行工具。

## Extension

Extension 是 TS/JS 模块，默认导出 factory。它可以注册：

- 事件处理器。
- 工具。
- slash command。
- 快捷键和 flags。
- 自定义消息/工具渲染。
- Provider。

Extension 是当前推荐的统一扩展机制。

## MCP

MCP server 可以通过 `stdio`、`http` 或 `sse` 接入。omp 会从 `.omp/mcp.json`、`~/.omp/agent/mcp.json` 以及其他工具的配置中发现服务器，并把 server tools 纳入工具体系。

## Hindsight / Memory

记忆能力用于跨会话保留项目事实。相关工具：

- `retain`：写入 durable facts。
- `recall`：搜索原始记忆。
- `reflect`：让 Hindsight 综合记忆回答问题。

默认应把记忆限定在项目范围，避免不同仓库的事实串扰。
