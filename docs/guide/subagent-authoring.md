# 子 Agent 编写

一个子 Agent 定义就是一个 Markdown 文件。omp 在每次 `task` 调用时扫描若干目录，按名称索引，并将 `agent` 参数解析到优先级最高的匹配文件。[子 Agents](./overview.md) 中内置的七个 Agent 位于该栈底——任何你放在前面的同名文件都会覆盖它们。

## 定义文件的存放位置

从以下根目录按此顺序读取文件。按 `name` 精确匹配时，第一个胜出。

```
.omp/agents/<name>.md          # 项目，omp 管理
~/.omp/agent/agents/<name>.md  # 用户，omp 管理
.claude/agents/, .codex/agents/, .gemini/agents/   # 同样被发现，相同的项目-用户配对
<plugin>/agents/<name>.md      # 插件提供
<bundled>                      # explore, plan, designer, reviewer, task, quick_task, librarian
```

解析为精确名称匹配，区分大小写（`Reviewer` 和 `reviewer` 不同）。在同一目录内，文件按字典序读取后去重。插件 Agent 追加在所有文件系统来源之后；内置 Agent 排在最后。通过将文件命名为相同 `name` 来覆盖内置 Agent。

frontmatter 解析失败或缺少必填字段时，会跳过该文件并发出警告。其余文件的发现继续进行。

## 定义文件结构

```
---
name: api-reviewer
description: Reviewing changes to packages/api/* for breaking changes, missing tests, and OpenAPI drift.
tools: read, search, find, bash
model: sonnet
---

You review pull requests touching the public API surface.

Focus on:
- breaking changes to exported types or HTTP routes
- missing or thin test coverage on changed branches
- OpenAPI spec drift vs the runtime handlers

Return a short bulleted verdict. Do not edit files.
```

`name` 和 `description` 是必填字段。description 是父 Agent 在决定是否派发时读取的内容——编写方式与 [Skill](./skills.md) 描述相同：动词、名词、范围。Markdown 正文会逐字成为子 Agent 的系统提示。

| 字段 | 作用 |
| --- | --- |
| `name` | 与 `task` 调用的 `agent` 字段匹配的标识符。 |
| `description` | 在 `task` 工具的清单中显示给父 Agent。 |
| `tools` | CSV 或 YAML 列表。将子 Agent 限制为这些工具子集。`yield` 始终被添加。省略则继承父 Agent 的工具集。 |
| `model` | 覆盖子会话的模型。省略则继承。 |
| `spawns` | `*`、CSV 或列表——该子 Agent 本身可以派生哪些 Agent 名称。默认为无，但当 `tools` 包含 `task` 时默认为 `*`。 |
| `thinkingLevel` | `low | medium | high`。 |
| `output` | 结构化返回的不透明 JSON Schema。与散文输出指令冲突；二选一。 |
| `blocking` | 在父侧标记该派生为阻塞式。 |

未设置的字段在执行时从父会话的默认值继承。

## 派发自定义 Agent

文件就位后，将其 `name` 传给 `task` 工具：

```
{
  "agent": "api-reviewer",
  "tasks": [
    { "id": "review-pr-417", "description": "Review PR 417", "assignment": "..." }
  ]
}
```

如果名称无法解析，调用会返回 `Unknown agent "<name>". Available: …`，不会派生任何子 Agent。如果父 Agent 的 `spawns` 策略禁止该名称，会返回 `Cannot spawn '<name>'. Allowed: …`。当达到 `task.maxRecursionDepth` 时，递归深度会阻止子 Agent 内部进一步派生。

## 迭代定义

从提示中打开 `/agents` 可查看当前会话解析的所有 Agent、每个 Agent 的加载来源以及名称冲突的胜出方。N 启动新建 Agent 流程，R 重新生成草稿，Ctrl+R 从磁盘重新加载——当你在另一个窗口中刚编辑完文件时很有用。为了加快迭代，可以用一行 `assignment` 直接派发 Agent 并检查返回的 `agent://<id>` 转录记录。

## 相关

- [子 Agents 与 IRC](./overview.md) — 使用 `task` 工具和内置 Agent。
- [Skills](./skills.md) — Agent 在运行时按需加载的操作手册。
- [自定义工具](./custom-tools.md) — 扩展子 Agent 可使用的工具面。
