# RPC

## 启动

```
omp --mode rpc --no-session       # headless: events out, commands in
omp --mode rpc-ui --no-session    # adds tool-card / selector UI frames
```

启动时 omp 输出 `{"type":"ready"}`，然后在 stdin 上逐行读取 JSON 对象，在 stdout 上逐行写入 JSON 对象。模式标志与所有其他 CLI 选项一起记录在 [CLI 参考](../reference/cli.md) 中。传入 `--no-session` 可避免运行记录写入 `~/.omp/agent/sessions/`；省略该标志则会持久化，并可通过与交互式使用相同的通道恢复、分叉或分支（[会话](./sessions.md)）。

`--mode rpc` 是完全无头的。`--mode rpc-ui` 在同一连接上叠加了 TUI 的交互界面：工具执行卡片、选择器、权限提示以 `extension_ui_request` 帧的形式到达，嵌入端必须以匹配的 `extension_ui_response` 进行应答。

## 消息格式

每个命令可以携带 `id`；匹配的响应会回显该 `id`，格式为 `{"type":"response","command":"…","success":bool}`。`prompt` 和 `abort_and_prompt` 会立即确认——轮次本身以 `agent_start`、`message_update`、`tool_execution_*` 流式传输，并以 `agent_end` 结束。

### 命令

| 命令 | 载荷 | 返回 |
| --- | --- | --- |
| `prompt` | `message`、`images?` | 确认；流式传输 `agent_start` → 增量 → `agent_end` |
| `steer` | `message`、`images?` | 确认；插入正在运行的轮次 |
| `follow_up` | `message`、`images?` | 确认；在当前轮次之后排队 |
| `abort` | — | 确认；活动轮次以 `agent_end` 结束 |
| `abort_and_prompt` | `message`、`images?` | 确认；中止后启动新轮次 |
| `new_session` / `switch_session` / `branch` | 会话目标 | 会话树转换 |
| `handoff` | `customInstructions?` | `{ savedPath } | null` |
| `get_state` / `get_messages` / `get_session_stats` | — | 会话快照 |
| `set_model` / `cycle_model` / `set_thinking_level` | 模型选择器 | 确认；发出 `model_changed` |
| `compact` / `set_auto_compaction` | 压缩控制 | 确认 / `CompactionResult` |
| `bash` / `abort_bash` | `command` | `BashResult` |
| `set_host_tools` | `tools: RpcHostToolDefinition[]` | 宿主端工具作为 `host_tool_call` 帧出现；以 `host_tool_result` 回复 |
| `extension_ui_response` | `id`、`value | confirmed | cancelled` | 应答先前发出的 `extension_ui_request` |
| `get_login_providers` / `login` | Provider ID | OAuth URL 作为 `method: "open_url"` 的 `extension_ui_request` 到达 |
| `export_html` | `outputPath?` | `{ path }` |

### 事件流

- `message_update` — 助手输出。`assistantMessageEvent.type` 区分 `text_delta`、`thinking_delta`、`tool_call_start`、`tool_call_delta` 和 `tool_result`。
- `message_start` / `message_end` — 轮次内的消息边界。
- `tool_execution_start` / `_update` / `_end` — 工具生命周期；携带 `toolCallId`、`toolName` 和意图标签。
- `agent_start` / `agent_end` — 轮次边界。`agent_end` 携带单次 prompt 等待的停止原因。
- `auto_compaction_start` / `_end`、`auto_retry_start` / `_end` — 流式传输过程中的清理操作。
- `session_start`、`session_switch`、`session_branch`、`session_compact`、`session_shutdown` — 会话树转换。
- `extension_ui_request`（仅 `rpc-ui`）— 代理需要 UI：选择器、确认框、权限决策、OAuth URL 或文件选择器。使用相同的 `id` 以 `extension_ui_response` 进行回复。

## Shell 示例

输入一个 prompt，输出文本增量，在 `agent_end` 时退出。无需语言绑定。

```
#!/usr/bin/env bash
set -euo pipefail
prompt='Say "ok" and nothing else.'
jq -nc --arg m "$prompt" '{id:"s1",type:"prompt",message:$m}' \
  | omp --mode rpc --no-session \
  | while IFS= read -r line; do
      t=$(jq -r '.type' <<<"$line")
      [[ "$t" == "message_update" ]] && \
        jq -r '.assistantMessageEvent.delta // empty' <<<"$line"
      [[ "$t" == "agent_end" ]] && exit 0
    done
```

## JSON 事件流模式

`--mode json` 是同一连接的打印模式变体。它从 argv（或 `-p`）接收 prompt，将相同的事件对象写入 stdout，然后退出。适用于 CI 捕获、黄金文件测试，或在无需保持子进程存活的情况下管道传输到 HTML 导出器。

```
omp --mode json --no-session "Audit src/ for unused exports" > run.jsonl
omp --export run.jsonl audit.html
```

相同的帧格式、相同的事件类型、相同的渲染器。区别仅在于生命周期：`--mode rpc` 是持续接收输入的长运行管道；`--mode json` 是一次 prompt、一次流、退出。
