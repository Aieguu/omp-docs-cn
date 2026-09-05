# RPC 模式

## 当你拥有宿主进程时选择 RPC

RPC 模式是以"最低公分母"（lowest-common-denominator）方式嵌入 omp 的途径：你的程序启动 `omp`，在 stdin 上每行发送一个 JSON 对象，并从 stdout 上的 JSON 行接收响应和流式事件。它适用于任何支持子进程与 JSON 的语言。

| 接入方式 | 在以下时机选择它… |
| --- | --- |
| 交互式 omp | 有一个人在终端里工作，并想要 omp 的编辑器、对话框和工具视图。 |
| 一次性 `text` 或 `json` 模式 | 某个 shell 或 CI 任务只需要一次 prompt，之后便退出。`json` 是事件流，但它不接受 RPC 命令。 |
| [SDK](./sdk.md) | 你的 TypeScript 应用能在进程内运行 omp，并且想要类型化的直接 API，而不是隔着一道进程边界。 |
| [ACP](./acp.md) | 你在构建一个已经会说标准化 Agent Client Protocol 的编辑器或客户端。 |
| **RPC** | 你需要从任何语言获得一个长生命周期的 omp 会话、流式输出、取消、状态控制或宿主回调。 |

从无头 RPC 和一个临时会话开始：

```
omp --mode rpc --no-session
```

省略 `--no-session` 会把对话保存到 omp 的常规会话存储中。常规的 model、Provider、工作目录和配置选项仍然适用；参见 [CLI 参考](../reference/cli.md)。RPC 会拒绝 `@file` 命令行参数——请把文件引用直接放在 prompt 中发送。

`--mode rpc-ui` 使用相同的线路协议，但会把嵌入的会话标记为支持 UI，并把依赖 UI 的工具和扩展界面连接到 RPC UI 桥。它**不会**启动 TUI，也不会新增一种单独的"工具卡片"帧类型。只有当你的宿主实现了这些 UI 行为时才使用它。两种模式都可能为扩展对话框或登录等功能发出 `extension_ui_request` 帧，因此一个完整的宿主应当理解该子协议。

## 完成一次 prompt

保持 stdin 打开，直到轮次结束。持续读取 stdout，让 stderr 保持独立，并在每个命令结尾的换行之后执行 flush。

这是一次最小可行的交互。下面显示的每一行都是一个完整的 JSON 对象；`available_commands_update` 等其他事件可能会在 `ready` 之后交错出现。

```
{"type":"ready","protocolVersion":1,"supportedProtocolVersions":[1,2],"maxFrameBytes":1048576,"maxReassembledFrameBytes":67108864}
{"id":"p1","type":"prompt","message":"Reply with only the word ok"}
{"id":"p1","type":"response","command":"prompt","success":true}
```

第一行来自 omp 的 stdout，第二行是你的宿主发往 stdin 的内容，第三行是 stdout 上可能出现的一条确认。该确认表示"已接受"，而不是"已完成"。随后轮次会流式传输事件，并在一个 `isTerminal` 不为 `false` 的 `agent_end` 处结束。

下面是一个只使用 Python 标准库的完整客户端。它刻意停留在协议 v1，因为它的 prompt 产生的响应很小；生产环境的客户端应按下面描述的方式协商 v2。

```
import json
import subprocess

proc = subprocess.Popen(
    ["omp", "--mode", "rpc", "--no-session"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True,
    bufsize=1,
)

assert proc.stdin is not None
assert proc.stdout is not None

ready = json.loads(proc.stdout.readline())
if ready.get("type") != "ready":
    raise RuntimeError(f"expected ready, got {ready!r}")

request_id = "p1"
proc.stdin.write(json.dumps({
    "id": request_id,
    "type": "prompt",
    "message": "Reply with only the word ok",
}) + "\n")
proc.stdin.flush()

accepted = False
finished = False
text_parts = []

for line in proc.stdout:
    frame = json.loads(line)

    if frame.get("type") == "response" and frame.get("id") == request_id:
        if not frame.get("success"):
            raise RuntimeError(frame.get("error", "RPC command failed"))
        if frame.get("command") == "prompt":
            accepted = True
            if frame.get("data", {}).get("agentInvoked") is False:
                finished = True

    if frame.get("type") == "message_update":
        event = frame.get("assistantMessageEvent", {})
        if event.get("type") == "text_delta":
            text_parts.append(event["delta"])

    if (frame.get("type") == "prompt_result"
            and frame.get("id") == request_id
            and frame.get("agentInvoked") is False):
        finished = True

    if (frame.get("type") == "agent_end"
            and frame.get("isTerminal") is not False):
        finished = True

    if accepted and finished:
        break

proc.stdin.close()
if proc.wait() != 0:
    raise RuntimeError(f"omp exited with {proc.returncode}")

print("".join(text_parts))
```

不要假定响应先于事件到达：某些 prompt 路径可能先开始发出事件。请用 `id` 匹配命令响应，并独立跟踪 prompt 的完成情况。

## 生命周期、队列与取消

### 进程生命周期

1.  用独立的 stdin、stdout 和 stderr 流启动 `omp --mode rpc`。
2.  在发送命令之前等待 `ready`。
3.  持续读取 stdout。当一条命令尚未返回时，宿主回调或 UI 请求也可能到达。
4.  以紧凑、不分块的 JSON 对象后跟 `\n` 的形式发送命令。
5.  关闭 stdin 即可断开连接。omp 会拒绝待处理的 UI/工具/URI 回调，排空已接受的命令，销毁会话，并以退出码 `0` 结束。

stdout 是 JSON 协议的专用通道。日志和诊断信息应放到 stderr 上；绝不要把 stderr 并入 JSON 解析器。

### Prompt 完成

`prompt` 和 `abort_and_prompt` 会立即确认调度。只有当以下条件成立时，一次常规的 agent 运行才算完成：

```
frame.type == "agent_end" and frame.isTerminal != false
```

`isTerminal: false` 表示异步投递或维护稍后会恢复该会话。字段缺失则视为可终结。

prompt 也可能改为在本地处理——例如由某个 slash 命令处理——并且不发出任何 `agent_end`。可通过以下任一方式检测：

*   `response.data.agentInvoked === false`，或
*   之后出现 `{ "type": "prompt_result", "id": …, "agentInvoked": false }`。

本地命令也可能发出 `command_output`。`agentInvoked: true` 表示将用 agent 生命周期事件来标识完成。如果该字段缺失，请继续观察事件和 `prompt_result`。

### 在轮次进行中发送工作

*   `steer` 向正在运行的轮次插入一条用户消息。
*   `follow_up` 把一条消息排队到当前轮次之后。
*   流式传输过程中再次发送 `prompt` 时，必须包含 `streamingBehavior: "steer"` 或 `"followUp"`（驼峰式 `followUp`）。
*   引导（steering）与后续（follow-up）队列默认为 `"one-at-a-time"`（一次一条）；它们的 `set_*_mode` 命令可以切换到 `"all"`。
*   中断模式默认为 `"immediate"`（立即）。`"wait"`（等待）会把引导推迟到轮次结束。

`bash` 是常规命令序列化中的一个例外：它会并发运行，因此 `abort_bash` 可以抢在它前面。它的响应在命令结束时到达，并可能相对其他响应乱序。必须按 `id` 进行关联。

### 安全地取消

*   发送 `abort` 停止活动的 agent 运行。请同时等待 `abort` 响应以及该运行的终结性 `agent_end`。
*   发送 `abort_and_prompt` 中止当前运行并调度一条替换 prompt。它不提供 `data.agentInvoked` 或 `prompt_result`；请依赖生命周期事件或同 id 的调度错误。
*   发送 `abort_retry` 停止自动重试的延迟。
*   发送 `abort_bash` 停止当前由 RPC 启动的 shell 命令。
*   把 `host_tool_cancel`、`host_uri_cancel` 和 UI 的 `method: "cancel"` 视为对引用到的宿主侧操作的取消。

## 错误与恢复

命令失败是普通的响应帧，通常进程仍可继续使用：

```
{"id":"m1","type":"response","command":"set_model","success":false,"error":"Model not found: provider/model"}
```

所有失败都有 `type: "response"`、`success: false`、一个字符串 `command` 和一个人类可读的 `error`。`code` 是可选的；`get_messages_page` 目前会用到 `session_busy` 和 `stale_cursor`。

重要的边界情况：

*   格式错误的 JSON 会产生可恢复的失败，带有 `command: "parse"` 且没有 `id`；下一行有效的输入仍会被处理。
*   未知命令目前不返回关联 id。在本地验证其 `type` 之前，不要发送下一条命令。
*   已调度的 `prompt` 或 `abort_and_prompt` 可以先确认成功；如果异步调度失败，之后会用同一个 id 发出失败响应。
*   扩展运行时故障是 `extension_error` 事件，而不是命令响应。
*   一个忽略 `extension_ui_request`、`host_tool_call` 或 `host_uri_request` 的宿主，可能让请求它们的操作陷入死锁。请在其他命令仍待处理时派发这些帧。
*   EOF 是有意的断开。进程意外退出或 stdout 损坏属于传输故障；任何未解决的请求完成状态都未知。

## 传输版本与超大帧

启动时生效的是协议 v1。它每物理行输出一个 JSON 对象，并把该行（包括其换行符）限制在公布的 `maxFrameBytes` 以内（当前为 1 MiB）。入站帧始终是单个、不分块的 JSONL 对象，并应保持在该限制以下。

能够重组大输出的客户端应在 `ready` 之后立即协商 v2：

```
{"id":"protocol-1","type":"negotiate_protocol","protocolVersion":2}
{"id":"protocol-1","type":"response","command":"negotiate_protocol","success":true,"data":{"protocolVersion":2}}
```

该成功响应本身是 v1 格式。此后超大的逻辑 stdout 对象会变成一段不中断的 `rpc_chunk` 帧序列：

```
{"type":"rpc_chunk","chunkId":"rpc-1","index":0,"count":2,"byteLength":1200000,"data":"BASE64_DATA"}
```

对每一段序列，请校验：

*   `chunkId` 保持不变且非空；
*   `index` 从 `0` 开始且无间断地递增；
*   每个分块上的 `count`、`byteLength` 和 `chunkId` 都一致；
*   没有普通帧打断该序列；
*   解码后的字节不超过 `maxReassembledFrameBytes`（当前为 64 MiB）；
*   拼接后的字节等于 `byteLength`，能按严格 UTF-8 解码，并能解析为一个 JSON 对象。

`data` 是标准 base64。不要把单个分块当作应用事件派发。超过 v2 上限的逻辑帧会转而变成显式的溢出帧。

在 v1 中，超大的响应会以 `RPC response exceeded the transport limit` 失败；其他帧可能被压缩，或被 `rpc_frame_error` 取代。超大的 `agent_end` 可以省略已经通过 `message_end` 投递的消息，并加上 `messageCount`。绝不要把 `agent_end.messages` 当作唯一的会话记录存储：请收集消息事件，或用 `get_messages_page` 分页获取历史。

## 公开协议参考

下文中 `?` 表示可选。所有命令都接受 `id?: string`。如果提供了它，正常的响应会回显它。

### 发送到 stdin 的命令

| 领域 | `type` 与字段 | 成功时的 `data` |
| --- | --- | --- |
| 协议 | `negotiate_protocol` — `protocolVersion: 2` | `{ protocolVersion: 2 }` |
| Prompt | `prompt` — `message: string`, `images?: ImageContent[]`, `streamingBehavior?: "steer" \| "followUp"` | 可选 `{ agentInvoked: boolean }` |
| Prompt | `steer` — `message`, `images?` | 无 |
| Prompt | `follow_up` — `message`, `images?` | 无 |
| Prompt | `abort` | 无 |
| Prompt | `abort_and_prompt` — `message`, `images?` | 无 |
| 会话 | `new_session` — `parentSession?: string` | `{ cancelled: boolean }` |
| 状态 | `get_state` | 下文的 `RpcSessionState` |
| 状态 | `set_fast_mode` — `enabled: boolean` | `{ enabled: boolean, active: boolean }` |
| 状态 | `get_available_commands` | `{ commands: RpcAvailableSlashCommand[] }` |
| 状态 | `set_todos` — `phases: TodoPhase[]` | `{ todoPhases: TodoPhase[] }` |
| 宿主 | `set_host_tools` — `tools: RpcHostToolDefinition[]` | `{ toolNames: string[] }` |
| 宿主 | `set_host_uri_schemes` — `schemes: RpcHostUriSchemeDefinition[]` | `{ schemes: string[] }` |
| 子代理 | `set_subagent_subscription` — `level: "off" \| "progress" \| "events"` | `{ level }` |
| 子代理 | `get_subagents` | `{ subagents: RpcSubagentSnapshot[] }` |
| 子代理 | `get_subagent_messages` — `subagentId?: string`, `sessionFile?: string`, `fromByte?: number` | `RpcSubagentMessagesResult` |
| 模型 | `set_model` — `provider: string`, `modelId: string` | 选定的 `Model` |
| 模型 | `cycle_model` | `{ model, thinkingLevel, isScoped } \| null` |
| 模型 | `get_available_models` | `{ models: Model[] }` |
| 思考 | `set_thinking_level` — `level: "inherit" \| "off" \| "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "max"` | 无 |
| 思考 | `cycle_thinking_level` | `{ level: "minimal" \| "low" \| "medium" \| "high" \| "xhigh" \| "max" } \| null` |
| 队列 | `set_steering_mode` — `mode: "all" \| "one-at-a-time"` | 无 |
| 队列 | `set_follow_up_mode` — 相同的取值 | 无 |
| 队列 | `set_interrupt_mode` — `mode: "immediate" \| "wait"` | 无 |
| 压缩 | `compact` — `customInstructions?: string` | `CompactionResult` |
| 压缩 | `set_auto_compaction` — `enabled: boolean` | 无 |
| 重试 | `set_auto_retry` — `enabled: boolean` | 无 |
| 重试 | `abort_retry` | 无 |
| Shell | `bash` — `command: string` | `BashResult` |
| Shell | `abort_bash` | 无 |
| 会话 | `get_session_stats` | `SessionStats` |
| 会话 | `export_html` — `outputPath?: string` | `{ path: string }` |
| 会话 | `switch_session` — `sessionPath: string` | `{ cancelled: boolean }` |
| 会话 | `branch` — `entryId: string` | `{ text: string, cancelled: boolean }` |
| 会话 | `get_branch_messages` | `{ messages: Array<{ entryId: string, text: string }> }` |
| 会话 | `get_last_assistant_text` | `{ text: string \| null }` |
| 会话 | `set_session_name` — `name: string` | 无 |
| 会话 | `handoff` — `customInstructions?: string` | `{ savedPath?: string } \| null` |
| 消息 | `get_messages` | `{ messages: AgentMessage[] }` |
| 消息 | `get_messages_page` — `cursor?: string`, `limit?: number` | `{ messages, nextCursor?, totalMessages }` |
| 登录 | `get_login_providers` | `{ providers: Array<{ id, name, available, authenticated }> }` |
| 登录 | `login` — `providerId: string` | `{ providerId: string }` |

`get_messages_page` 默认返回 100 条消息，并接受 1 到 256 之间的限制。持续跟随不透明的 `nextCursor`，直到它消失。分页基于快照：在 `stale_cursor`（过期游标）之后要从无游标状态重新开始；在 `session_busy`（会话忙）之后要等待流式传输/压缩停止。

### 共享输入对象

`ImageContent`:

| 字段 | 类型 |
| --- | --- |
| `type` | 字面量 `"image"` |
| `data` | base64 编码的图片字节 |
| `mimeType` | 诸如 `image/png` 的 MIME 字符串 |
| `detail?` | `"auto" \| "low" \| "high" \| "original"` |
| `providerFile?` | `{ provider: "openai" \| "anthropic" \| "google", id?: string, uri?: string, expiresAt?: number }` |
| `url?` | 与 `data` 中的字节完全一致的 HTTPS 镜像 |

`TodoPhase` 是 `{ name: string, tasks: TodoItem[] }`。`TodoItem` 是 `{ content: string, status: "pending" | "in_progress" | "completed" | "abandoned" | "blocked", blocker?: string }`。

`RpcHostToolDefinition` 是 `{ name: string, label?: string, description: string, parameters: JSONSchemaObject, hidden?: boolean, loadMode?: "essential" | "discoverable" }`。发送 `set_host_tools` 会替换之前的宿主工具集合。

`RpcHostUriSchemeDefinition` 是 `{ scheme: string, description?: string, writable?: boolean, immutable?: boolean }`。提供的 scheme 不带 `://`。名称会被规范化为小写；`security` 是保留的。发送该命令会替换之前的集合。

### 响应信封

每条命令都会产生以下之一：

```
Success: { id?, type: "response", command: string, success: true, data?: any }
Failure: { id?, type: "response", command: string, success: false, error: string, code?: string }
```

有用的结果对象拥有这些精确字段：

*   `CompactionResult`: `{ summary, shortSummary?, firstKeptEntryId, tokensBefore, details?, preserveData? }`。
*   `BashResult`: `{ output, exitCode: number | undefined, cancelled, timedOut?, truncated, totalLines, totalBytes, outputLines, outputBytes, artifactId?, workingDir? }`。JSON 序列化会省略值为 `undefined` 的字段。
*   `SessionStats`: `{ sessionFile?, sessionId, userMessages, assistantMessages, toolCalls, toolResults, totalMessages, tokens: { input, output, reasoning, cacheRead, cacheWrite, total }, premiumRequests, cost, contextUsage? }`。
*   `Model` 是模型目录对象。`provider` 和 `id` 是稳定的选择键；请保留未知的附加模型元数据以保持向前兼容。

`RpcSessionState` 包含：

| 字段 | 类型 |
| --- | --- |
| `model?` | `Model` |
| `thinkingLevel` | 思考级别字符串，或省略 |
| `isStreaming`、`isCompacting` | boolean |
| `steeringMode`、`followUpMode` | `"all" \| "one-at-a-time"` |
| `interruptMode` | `"immediate" \| "wait"` |
| `sessionFile?`、`sessionId`、`sessionName?` | string |
| `autoCompactionEnabled` | boolean |
| `fastModeEnabled`、`fastModeActive` | boolean |
| `tokensPerSecond` | number 或 `null` |
| `messageCount`、`queuedMessageCount` | number |
| `todoPhases` | `TodoPhase[]` |
| `systemPrompt?` | `string[]` |
| `dumpTools?` | 形如 `{ name, description, parameters, examples? }` 的数组 |
| `contextUsage?` | `{ tokens: number, contextWindow: number, percent: number }` |

`RpcAvailableSlashCommand` 是 `{ name, source, aliases?, description?, input?: { hint? }, subcommands?: Array<{ name, description?, usage? }> }`。`source` 是 `"builtin"`、`"skill"`、`"extension"`、`"custom"`、`"mcp_prompt"` 或 `"file"`。

### Agent 消息

事件与历史响应携带 `AgentMessage` 对象。使用者应按 `role` 分派，并保留未知角色，因为扩展可以添加消息变体。

| `role` | 核心字段 |
| --- | --- |
| `user` | `content: string \| (TextContent \| ImageContent)[]`、`timestamp`，外加可选的 attribution/传输元数据 |
| `developer` | 相同的内容形式和 `timestamp` |
| `assistant` | `content: ContentBlock[]`、`api`、`provider`、`model`、`usage`、`stopReason`、`timestamp`，外加可选的错误、时序、恢复和 provider 元数据 |
| `toolResult` | `toolCallId`、`toolName`、`content`、`isError`、`timestamp`，可选 `details` |
| `bashExecution` | `command`、`output`、`exitCode?`、`cancelled`、`truncated`、`timestamp`，可选 `meta`、`excludeFromContext` |
| `pythonExecution` | `code`、`output`、`exitCode?`、`cancelled`、`truncated`、`timestamp`，可选 `meta`、`excludeFromContext` |
| `custom` | `customType`、`content`、`display`、`details?`、`timestamp` |
| `hookMessage` | 与 `custom` 匹配的遗留形态 |
| `fileMention` | `files: Array<{ path, content, lineCount?, byteSize?, skippedReason?, image? }>`、`timestamp` |
| `branchSummary` | `summary`、`fromId`、`timestamp` |
| `compactionSummary` | `summary`、`shortSummary?`、`tokensBefore`、`tokensAfter?`、`method?`、`blocks?`、`images?`、`warning?`、`timestamp` |

常见的内容块有：

*   `{ type: "text", text: string, textSignature?: string }`
*   `{ type: "thinking", thinking: string, thinkingSignature?: string, itemId?: string }`
*   `{ type: "redactedThinking", data: string }`
*   `ImageContent`
*   `{ type: "toolCall", id: string, name: string, arguments: object, intent?: string, …opaque replay metadata }`
*   `{ type: "fallback", from: { model: string }, to: { model: string } }`
*   `{ type: "anthropicServerTool", block: object }`，用于 provider 原生的服务端工具回放

Provider 专属的 assistant 块也可能出现。忽略你不渲染的块，但如果你要持久化并回放协议数据，请保留它们。assistant 的 `usage` 是 `{ input, output, cacheRead, cacheWrite, totalTokens, contextTokens?, orchestration?, premiumRequests?, reasoningTokens?, cttl?, server?, cost: { input, output, cacheRead, cacheWrite, total } }`。`stopReason` 是 `"stop"`、`"length"`、`"toolUse"`、`"error"` 或 `"aborted"`。

## 事件与通知模式

### Agent 生命周期事件

| `type` | `type` 之后的字段 |
| --- | --- |
| `agent_start` | 无 |
| `agent_end` | `messages: AgentMessage[]`、`isTerminal?: boolean`、`telemetry?: object`、`coverage?: object`；传输压缩也可能增加 `messageCount` |
| `turn_start` | 无 |
| `turn_end` | `message: AgentMessage`、`toolResults: ToolResultMessage[]` |
| `message_start` | `message: AgentMessage` |
| `message_update` | `message: AgentMessage`、`assistantMessageEvent: AssistantMessageEvent` |
| `message_end` | `message: AgentMessage` |
| `tool_execution_start` | `toolCallId`、`toolName`、`args`、`intent?` |
| `tool_execution_update` | `toolCallId`、`toolName`、`args`、`partialResult` |
| `tool_execution_end` | `toolCallId`、`toolName`、`result`、`isError?` |

`AssistantMessageEvent` 是以下之一：

| 事件的 `type` | 其他字段 |
| --- | --- |
| `start` | `partial: AssistantMessage` |
| `text_start` | `contentIndex`、`partial` |
| `text_delta` | `contentIndex`、`delta: string`、`partial` |
| `text_end` | `contentIndex`、`content: string`、`partial` |
| `thinking_start` | `contentIndex`、`partial` |
| `thinking_delta` | `contentIndex`、`delta: string`、`partial` |
| `thinking_end` | `contentIndex`、`content: string`、`partial` |
| `image_end` | `contentIndex`、`content: ImageContent`、`partial` |
| `toolcall_start` | `contentIndex`、`partial` |
| `toolcall_delta` | `contentIndex`、`delta: string`、`partial` |
| `toolcall_end` | `contentIndex`、`toolCall`、`partial` |
| `done` | `reason: "stop" \| "length" \| "toolUse"`、`message: AssistantMessage` |
| `error` | `reason: "aborted" \| "error"`、`error: AssistantMessage` |

拼写是 `toolcall_*`，`tool` 与 `call` 之间没有下划线。

### 会话事件

| `type` | `type` 之后的字段 |
| --- | --- |
| `auto_compaction_start` | `reason: "threshold" \| "overflow" \| "idle" \| "incomplete"`, `action: "context-full" \| "remote" \| "handoff" \| "shake" \| "snapcompact"` |
| `auto_compaction_end` | `action`、`result?: CompactionResult`、`aborted`、`willRetry`、`errorMessage?`、`skipped?` |
| `auto_retry_start` | `attempt`、`maxAttempts`、`delayMs`、`errorMessage`、`errorId?` |
| `auto_retry_end` | `success`、`attempt`、`finalError?`、`retryErrors?` |
| `retry_fallback_applied` | `from`、`to`、`role` |
| `retry_fallback_succeeded` | `model`、`role` |
| `model_changed` | 无；如果你需要新模型，请调用 `get_state` |
| `thinking_level_changed` | `thinkingLevel?`、`configured?`、`resolved?` |
| `ttsr_triggered` | `rules: Rule[]` |
| `todo_reminder` | `todos: TodoItem[]`、`attempt`、`maxAttempts` |
| `todo_auto_clear` | 无 |
| `irc_message` | `message: CustomMessage` |
| `notice` | `level: "info" \| "warning" \| "error"`、`message`、`source?` |
| `goal_updated` | `goal: Goal \| null`、`state?: GoalModeState` |

### 其他 stdout 帧

| `type` | 字段与作用 |
| --- | --- |
| `ready` | `protocolVersion: 1`、`supportedProtocolVersions: [1,2]`、`maxFrameBytes`、`maxReassembledFrameBytes` |
| `response` | 上文描述的命令结果信封 |
| `rpc_chunk` | `chunkId`、`index`、`count`、`byteLength`、`data`；在派发前重组 |
| `rpc_frame_error` | `error`、`originalType?`；某个逻辑输出无法装进当前传输 |
| `prompt_result` | `id?`、`agentInvoked: boolean`；目前仅在仅本地完成时发出 |
| `available_commands_update` | `commands: RpcAvailableSlashCommand[]`；在启动时以及元数据变化时发出 |
| `command_output` | `text: string`；来自某个本地处理的 slash 命令的输出 |
| `session_info_update` | `title?`、`sessionId`；会话元数据发生了变化 |
| `config_update` | `model?`、`thinkingLevel?`；某个本地命令更改了配置 |
| `extension_error` | `extensionPath`、`event`、`error` |
| `extension_ui_request` | 下文的 UI 子协议 |
| `host_tool_call`、`host_tool_cancel` | 下文的宿主工具子协议 |
| `host_uri_request`、`host_uri_cancel` | 下文的宿主 URI 子协议 |
| `subagent_lifecycle`、`subagent_progress`、`subagent_event` | 下面由订阅门控的 subagent 帧 |

未知的事件类型应被忽略或记录，而不应视为致命的协议错误。可以在不改变传输版本的情况下添加新的可选字段和事件类型。

## 扩展 UI 子协议

所有请求都有 `type: "extension_ui_request"` 和一个 `id`。只有 `select`、`confirm`、`input` 和 `editor` 期望值型响应。即发即忘（fire-and-forget）的展示方法不需要响应。

| `method` | 请求字段 |
| --- | --- |
| `select` | `title`、`options: string[]`、`optionDetails?: Array<{ description?: string }>`、`timeout?` |
| `confirm` | `title`、`message`、`timeout?` |
| `input` | `title`、`placeholder?`、`timeout?` |
| `editor` | `title`、`prefill?`、`promptStyle?` |
| `cancel` | `targetId` |
| `notify` | `message`、`notifyType?: "info" \| "warning" \| "error"` |
| `setStatus` | `statusKey`、`statusText?` |
| `setWidget` | `widgetKey`、`widgetLines?: string[]`、`widgetPlacement?: "aboveEditor" \| "belowEditor"` |
| `setTitle` | `title`；除非设置了 `PI_RPC_EMIT_TITLE=1`，否则会被抑制 |
| `set_editor_text` | `text` |
| `open_url` | `url`、`launchUrl?`、`instructions?`；在提供 `launchUrl` 时，优先把它作为复制/打开的目标 |

请用相同的 `id` 在 stdin 上应答：

```
Text/select/editor: { type: "extension_ui_response", id, value: string }
Confirmation:       { type: "extension_ui_response", id, confirmed: boolean }
Cancel/timeout:      { type: "extension_ui_response", id, cancelled: true, timedOut?: boolean }
```

未知的响应 id 会被忽略。当请求带有 `timeout` 时，宿主应强制执行该超时，并返回带 `timedOut: true` 的取消形态。

OAuth `login` 会发出 `open_url`，可能发出通知帧，然后可以用 `input` 要求粘贴重定向结果或代码。在产生 URL 之前就需要交互式输入的 Provider 在 RPC 模式下会被拒绝；请改为通过交互式 omp 登录。

## 宿主工具与宿主 URI

在 `set_host_tools` 之后，omp 可以请你的进程执行某个已注册的工具：

```
{"type":"host_tool_call","id":"host-1","toolCallId":"toolu-1","toolName":"lookup_ticket","arguments":{"id":42}}
```

你可以流式传输零个或多个更新，然后用同一个 id 完成：

```
{"type":"host_tool_update","id":"host-1","partialResult":{"content":[{"type":"text","text":"looking up ticket"}]}}
{"type":"host_tool_result","id":"host-1","result":{"content":[{"type":"text","text":"ticket 42 is open"}]}}
```

`partialResult` 和 `result` 是 `{ content: Array<TextContent | ImageContent>, details?: any, isError?: boolean, providerMetadata?: object, useless?: boolean }`。在 `host_tool_result` 上设置顶层 `isError: true`，可以拒绝该挂起的调用，并把返回的内容作为工具错误呈现。`host_tool_cancel` 是 `{ type, id, targetId }`；请停止 `targetId` 所标识的操作。

在 `set_host_uri_schemes` 之后，omp 会把那些 scheme 的读取和允许的写入路由到你的进程：

```
Read:  { type: "host_uri_request", id, operation: "read", url }
Write: { type: "host_uri_request", id, operation: "write", url, content }
Cancel:{ type: "host_uri_cancel", id, targetId }
```

用以下方式应答：

```
Success read:  { type: "host_uri_result", id, content, contentType?, notes?, immutable? }
Success write: { type: "host_uri_result", id }
Failure:       { type: "host_uri_result", id, isError: true, error?: string, content?: string }
```

`contentType` 是 `"text/markdown"`、`"application/json"` 或 `"text/plain"`，默认为纯文本。成功的读取需要 `content`。结果级的 `immutable` 会针对该次读取覆盖已注册的 scheme。`edit` 工具不会编辑宿主 URI；请把 scheme 注册为可写，以让整体替换式的写入走 `write` 路径。

## Subagent 帧

转发默认是 `off`（关闭）：

*   `progress` 会发出 `subagent_lifecycle` 和 `subagent_progress`。
*   `events` 还会发出每一个嵌套的 `subagent_event`。

`subagent_lifecycle.payload` 是 `{ id, agent, agentSource, description?, status: "started" | "completed" | "failed" | "aborted", sessionFile?, parentToolCallId?, index, detached? }`。

`subagent_progress.payload` 是 `{ index, agent, agentSource, task, parentToolCallId?, assignment?, progress, sessionFile?, detached? }`。`progress` 包含身份/状态、最近的工具/输出摘要、计数、token、成本、耗时、模型选择以及可选的重试状态。请把新加入的进度指标视为可选。

`subagent_event.payload` 是 `{ id, event: AgentSessionEvent }`，其中 `event` 使用上面相同的生命周期模式。

由 `get_subagents` 返回的 `RpcSubagentSnapshot` 是 `{ id, index, agent, agentSource, description?, status, task?, assignment?, sessionFile?, lastUpdate, progress?, parentToolCallId? }`。

`RpcSubagentMessagesResult` 是 `{ sessionFile, fromByte, nextByte, reset, entries, messages }`。按 `subagentId` 或 `sessionFile` 选择；`fromByte` 支持增量读取。如果会话记录收缩到 `fromByte` 之下，服务端会从字节零重新开始，并把 `reset` 置为 `true`。

## 宿主实现清单

一个健壮的语言无关客户端应该：

1.   为每个独立受控的会话启动一个进程，并等待 `ready`。
2.   保持 stdin 写入串行化、以换行结尾并 flush。
3.   在请求尚未返回时持续读取 stdout；绝不要等待某个响应才开始处理回调。
4.   生成唯一的字符串 id，并按 id 关联响应，而不是按到达顺序。
5.   分别跟踪 prompt 的接受情况，以及终结性或仅本地性的完成情况。
6.   协商 v2，并在可能出现大消息时严格重组分块。
7.   在不阻塞读取器的情况下派发扩展 UI、宿主工具和宿主 URI 请求。
8.   保留未知字段、消息角色、内容块和事件类型，以保持向前兼容。
9.   有序关闭时先关闭 stdin，然后等待进程退出。
