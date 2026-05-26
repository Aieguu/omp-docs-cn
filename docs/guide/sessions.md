# 会话、分支与记忆

## 会话文件

默认路径：

```text
~/.omp/agent/sessions/--<cwd-encoded>--/<timestamp>_<sessionId>.jsonl
```

第一行是 session header，后续每一行是 entry。当前版本为 `3`。

header 示例：

```json
{
  "type": "session",
  "version": 3,
  "id": "1f9d2a6b9c0d1234",
  "timestamp": "2026-02-16T10:20:30.000Z",
  "cwd": "/work/pi",
  "title": "optional session title",
  "titleSource": "auto"
}
```

## Entry 类型

常见 entry：

| 类型 | 含义 |
| --- | --- |
| `message` | user / assistant / tool 等消息。 |
| `model_change` | 某个角色的模型切换。 |
| `thinking_level_change` | thinking level 调整。 |
| `service_tier_change` | service tier 调整。 |
| `compaction` | 上下文压缩摘要。 |
| `branch_summary` | 离开分支时生成的摘要。 |
| `custom` | 扩展持久化状态，不直接进入模型上下文。 |
| `custom_message` | 扩展注入且参与上下文的消息。 |
| `label` | 给任意 entry 打标签。 |
| `ttsr_injection` | time-traveling stream rule 注入记录。 |
| `session_init` | 初始系统提示、任务、工具、输出 schema。 |
| `mode_change` | 模式变化，如 plan mode。 |
| `mcp_tool_selection` | 最新选择的 MCP discovery tools。 |

## Tree / leaf 模型

每个 entry 都有：

```json
{
  "id": "8-char-id",
  "parentId": "previous-or-branch-parent"
}
```

会话是 append-only tree。运行时维护一个 leaf：

- 新 entry 的 `parentId` 是当前 leaf。
- 新 entry 写入后成为新 leaf。
- `branch(entryId)` 只移动 leaf，不删除旧 entry。
- `resetLeaf()` 让下一条 entry 成为新 root。

## `/tree`

`/tree` 打开当前 session 的交互式树导航器。

常用能力：

- 搜索历史 entry。
- 按 filter 查看 user-only、no-tools、labeled-only、all。
- 选中 user message 时，把该消息内容预填回编辑器，方便改写后重新提交。
- 选中非 user entry 时，leaf 移动到该 entry。
- 可选择在离开当前分支时生成 summary。
- `Shift+L` 可给节点打标签。

## Context reconstruction

发送给模型的上下文不是“整个 JSONL 文件”，而是：

1. 从当前 leaf 沿 `parentId` 回溯到 root。
2. 反转为 root → leaf。
3. 应用路径上的 runtime state：
   - thinking level。
   - service tier。
   - role model map。
   - TTSSR 注入规则。
   - MCP tool selection。
   - mode data。
4. 生成消息列表。
5. 如果路径上有 compaction，优先插入压缩摘要，并从 `firstKeptEntryId` 后保留必要上下文。

## Compaction

触发来源包括上下文溢出、阈值维护和显式操作。压缩会：

- 生成摘要。
- 保留最近必要消息。
- 记录文件操作上下文。
- 允许扩展通过 `session_before_compact`、`session.compacting`、`session_compact` 参与。

上下文溢出时，模型级 context promotion 会先尝试切换到更大上下文模型；没有可用 promotion target 时再进入 compaction。

## Fork / resume

- `/fork`：复制当前会话为新会话文件。
- `/resume`：从历史会话列表恢复。
- 终端 breadcrumb 会记录当前 cwd 和 session file，`continueRecent()` 会优先使用当前终端的最近会话。

## Blob 与 artifact

两类存储容易混淆：

| 类型 | 作用域 | 用途 |
| --- | --- | --- |
| Blob store | 全局 | 大型二进制内容，如 base64 图片，按 sha256 存储。 |
| Artifact | session-local | 长工具输出、截断内容、可由 `artifact://<id>` 访问。 |

图片内容持久化时，如果 base64 长度达到阈值，会外部化为：

```text
blob:sha256:<hash>
```

加载会话时再还原。

## Prompt history

prompt 历史与 session 文件不同：

```text
~/.omp/agent/history.db
```

它是 SQLite + FTS5，用于 prompt 搜索 / 回忆，不负责会话 replay。

## Memory / Hindsight

记忆用于跨会话保留项目事实：

- `retain`：写入事实。
- `recall`：搜索事实。
- `reflect`：综合事实回答。

建议把记忆写成稳定事实，例如构建命令、测试策略、目录约定、禁用做法，而不是写临时状态。
