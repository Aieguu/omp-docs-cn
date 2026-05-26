# SDK

## 安装

```
bun add @oh-my-pi/pi-coding-agent
```

需要 Node 20+ 或任意版本的 Bun。该包是一个 TypeScript ES 模块；消费者基于发布的 `.d.ts` 进行编译。

## 打开会话

`createAgentSession` 遵循与 CLI 相同的发现规则：它读取 `~/.omp/agent/config.yml`，查找凭据，加载 Extension、MCP Server、Skill、提示词模板。传入任意选项即可覆盖对应部分。

```
import {
  ModelRegistry,
  SessionManager,
  createAgentSession,
  discoverAuthStorage,
} from "@oh-my-pi/pi-coding-agent";

const authStorage = await discoverAuthStorage();
const modelRegistry = new ModelRegistry(authStorage);
await modelRegistry.refresh();

const { session, modelFallbackMessage } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
  model: modelRegistry.getAvailable()[0],
  thinkingLevel: "medium",
});

if (modelFallbackMessage) {
  process.stderr.write(modelFallbackMessage + "\n");
}

const unsubscribe = session.subscribe((event) => {
  if (
    event.type === "message_update" &&
    event.assistantMessageEvent.type === "text_delta"
  ) {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt("Summarize this repository in three bullets.");
unsubscribe();
await session.dispose();
```

`SessionManager.inMemory()` 保持所有内容为临时状态。可替换为 `SessionManager.create(cwd)` 以使用 CLI 所用的磁盘 JSONL 存储，或自行实现。有关持久化会话如何恢复、分叉和分支，请参阅 [会话](./sessions.md)。

## 流式传输一轮对话

`session.subscribe(handler)` 返回一个取消订阅函数。每个事件携带一个 `type`；你通常关心的事件如下：

| 事件 | 携带内容 |
| --- | --- |
| `message_update` | 助手输出。通过 `assistantMessageEvent.type` 区分 `text_delta`、`thinking_delta`、`tool_call_start`、`tool_call_delta` 或 `tool_result`。 |
| `tool_execution_start` / `_update` / `_end` | 助手消息之外的工具调用生命周期。包含 `toolCallId`、`toolName`、意图标签。 |
| `agent_start` / `agent_end` | 轮次边界。`agent_end` 携带停止原因，是单次 `session.prompt` 的终止信号。 |
| `auto_compaction_start` / `_end` | 流式传输过程中触发的压缩。 |

## 可覆盖项

- `model` 和 `thinkingLevel` — 或让发现机制自动选择。
- `systemPrompt` — 数组形式（替换默认值）或 `(defaults) => final` 函数形式。
- `toolNames` — 缩小活动的内置工具集。`requireYieldTool` 可启用隐藏的 `yield` 工具。
- `customTools` — 宿主端工具，代理可以回调（见下文）。
- `extensions`、`additionalExtensionPaths`、`disableExtensionDiscovery`。
- `skills`、`rules`、`promptTemplates`、`slashCommands`、`contextFiles` — 数组形式覆盖发现机制。
- `authStorage` — 默认为针对 `~/.omp/agent/agent.db` 的 `discoverAuthStorage()`。
- `sessionManager` — `inMemory()`、基于文件（`create(cwd)`）或自行实现。
- `enableMCP`、`enableLsp`，或传入自定义 `mcpManager`。

## 自定义工具

`CustomTool` 是一个普通对象，代理可以回调。参数使用 TypeBox；`execute` 返回 `AgentToolResult`。

```
import { Type } from "@sinclair/typebox";
import { createAgentSession, type CustomTool } from "@oh-my-pi/pi-coding-agent";

const echoHost: CustomTool = {
  name: "echo_host",
  label: "Echo Host",
  description: "Echo a value back through the embedding host.",
  parameters: Type.Object({ message: Type.String() }),
  async execute(_id, { message }) {
    return { content: [{ type: "text", text: `host: ${message}` }] };
  },
};

const { session } = await createAgentSession({
  customTools: [echoHost],
});
```

将 `signal` 参数传递给长时间运行的子进程，以便中止操作（TUI 中按 Esc、RPC 管道上的 `abort`、SDK 中的 `session.abort()`）能真正取消工作。

## 生命周期

| 方法 | 效果 |
| --- | --- |
| `session.prompt(text, opts?)` | 运行一轮对话。在 `agent_end` 时 resolve。 |
| `session.steer(text)` | 向正在运行的轮次注入引导消息。 |
| `session.abort()` | 停止当前轮次；发出带有 aborted 停止原因的 `agent_end`。 |
| `session.compact()` | 强制执行一次压缩。 |
| `session.dispose()` | 释放模型、MCP Server 以及会话打开的所有 LSP 进程。 |

需要非 Node 语言，或在代理和宿主之间设置进程边界？请改用 [RPC 模式](./rpc.md)。通过 SDK 启动 omp 是 [CLI 参考](../reference/cli.md) 中介绍的多种入口形式之一。
