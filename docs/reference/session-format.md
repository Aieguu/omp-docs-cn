# Session 格式

会话存储在 `~/.omp/agent/sessions/<cwd-hash>/<id>.jsonl`，按工作目录分组。一个文件对应一个会话；一行对应一条记录。记录不会被原地重写——会话进行时可以安全地 `tail -f`，也可以在中途安全复制。面向用户的恢复/分支/分享工作流详见 [Sessions](../guide/sessions.md)。

## 记录信封

每一行都是一个 JSON 对象，包含 `type` 鉴别字段、8 字符 `id`、将其串联成树的 `parentId` 以及 `timestamp`。leaf 不是一条记录——它是最新可达 id 的隐式指针。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | string | 鉴别字段；见下方记录类型。 |
| `id` | string (8 hex) | Snowflake 风格；按时间排序。 |
| `parentId` | string \| null | 父记录 id；首条消息为 `null`。 |
| `timestamp` | ISO 8601 | UTC，秒精度或更高。 |

## Snowflake ID

ID 是时间有序的 Snowflake 风格十六进制字符串，而非 UUID。高位编码时间戳，因此字典序排序即时间顺序，6 字符前缀通常足以在会话内唯一标识一条记录。分支和 fork 操作保留原有 id；克隆到新文件（fork）时会生成全新 id，并在新 header 的 `parentSession` 中记录来源。

## Session header

每个文件的第一行是 `session` header，携带 schema 版本、工作目录、可选标题，以及（在 fork 时）`parentSession` 谱系标记。

```
{"type":"session","version":3,"id":"1f9d29","timestamp":"2026-05-14T10:12:03Z","cwd":"/Users/me/src/api","title":"refactor importer"}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `"session"` | Header 鉴别字段。 |
| `version` | number | Schema 版本；当前为 `3`。 |
| `id` | string | 会话 id；与文件名一致。 |
| `cwd` | string | 会话启动时的绝对工作目录。 |
| `title` | string? | 在选择器中显示的人类可读标签；由 `/rename` 设置。 |
| `parentSession` | object? | 出现在 fork 中；携带源会话 id、文件路径和 fork 起点的记录 id。 |

## 消息记录

`message` 记录原样封装模型消息，包含其 `role` 和 `content` 数组。工具调用及其结果不是独立记录——它们作为 `tool_use` 块搭载在 assistant 消息的 `content` 中，对应的 `tool_result` 块搭载在下一条 user 消息中。一个回合在树中是一条记录，而非三条。

```
{"type":"message","id":"1f9d2a","parentId":null,"timestamp":"…","message":{"role":"user","content":[{"type":"text","text":"refactor the importer to stream"}]}}
{"type":"message","id":"1f9d2b","parentId":"1f9d2a","timestamp":"…","message":{"role":"assistant","content":[{"type":"text","text":"Reading the file first."},{"type":"tool_use","id":"toolu_01","name":"read","input":{"path":"src/importer.ts"}}]}}
{"type":"message","id":"1f9d2c","parentId":"1f9d2b","timestamp":"…","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_01","content":[{"type":"text","text":"…file contents…"}]}]}}
```

### 内容块类型

| 块 | 角色 | 结构 |
| --- | --- | --- |
| `text` | 任意 | `{ type, text }` |
| `tool_use` | assistant | `{ type, id, name, input }` — `id` 为工具调用 id；`input` 为模型输出的 JSON。 |
| `tool_result` | user | `{ type, tool_use_id, content }` — `tool_use_id` 与 `tool_use.id` 匹配；`content` 为内容数组（通常是一个 `text` 块）。 |
| `thinking` | assistant | `{ type, thinking }` — provider 支持时的扩展思考输出。 |

## 其他记录类型

| 类型 | 记录内容 |
| --- | --- |
| `model_change` | 活跃模型切换（`/model` 或角色循环）。携带 `model` 和 `role`。 |
| `mode_change` | Plan 模式开启或关闭。 |
| `thinking_level_change` | 后续回合的扩展思考预算变更。 |
| `service_tier_change` | Provider 服务层（priority、batch）变更。 |
| `label` | 其他记录的书签。携带 `targetId` 和 `label`；因指向内容哈希而不会因压缩丢失。 |
| `compaction` | 标记压缩替换旧回合的位置。携带 `summary`、`firstKeptEntryId` 和 `tokensBefore`。 |
| `branch_summary` | 被放弃分支的摘要，在 `/tree` 移动 leaf 时写入。 |
| `session_init` | 仅用于子 agent 会话；记录生成 agent、分配任务和父引用。 |
| `custom` / `custom_message` | 扩展状态——由 hook、自定义工具或插件写入的不透明载荷。 |
| `ttsr_injection` | 记录 TTSR 规则在流中触发及注入的修正。 |
| `mcp_tool_selection` | 维护记录——本次会话暴露了哪些 MCP 工具。 |

## 完整示例

一个精简的会话，展示了 header、两轮对话含工具调用、模型切换、标签和压缩：

```
{"type":"session","version":3,"id":"1f9d29","timestamp":"2026-05-14T10:12:03Z","cwd":"/Users/me/src/api","title":"refactor importer"}
{"type":"message","id":"1f9d2a","parentId":null,"timestamp":"…","message":{"role":"user","content":[{"type":"text","text":"refactor the importer to stream"}]}}
{"type":"message","id":"1f9d2b","parentId":"1f9d2a","timestamp":"…","message":{"role":"assistant","content":[{"type":"text","text":"Reading the file first."},{"type":"tool_use","id":"toolu_01","name":"read","input":{"path":"src/importer.ts"}}]}}
{"type":"message","id":"1f9d2c","parentId":"1f9d2b","timestamp":"…","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_01","content":[{"type":"text","text":"…file contents…"}]}]}}
{"type":"model_change","id":"1f9d2d","parentId":"1f9d2c","timestamp":"…","model":"anthropic/claude-opus","role":"default"}
{"type":"label","id":"1f9d2e","parentId":"1f9d2c","timestamp":"…","targetId":"1f9d2a","label":"pre-refactor"}
{"type":"compaction","id":"1f9d2f","parentId":"1f9d2e","timestamp":"…","summary":"…","firstKeptEntryId":"1f9d2c","tokensBefore":48211}
```

## 将 Session 作为文件读取

在 shell 中，`omp -p 'read /path/to/session.jsonl'` 会以 hashline 锚点渲染该文件，方便你通过 id 引用任意记录并将该行传入后续回合，无需重新格式化。`--export` 及其他无头模式 flag 详见 [CLI 参考](./cli.md)。
