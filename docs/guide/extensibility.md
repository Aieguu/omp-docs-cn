# 扩展、技能、MCP 与 Hook

omp 提供多条扩展路径。优先级建议：

1. **Extension**：推荐。一个 TS/JS 模块可以同时注册事件、工具、命令、渲染和 Provider。
2. **Skill**：文档/流程/知识包，供模型按需读取。
3. **MCP**：接入外部工具 server。
4. **Custom tool**：只想增加一个模型可调用工具时使用。
5. **Hook**：旧式事件 API；当前默认 CLI 更偏向 extension runner。

## Extension

最小示例：

```ts
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function myExtension(pi: ExtensionAPI) {
  const { z } = pi.zod;

  pi.on("tool_call", async (event) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      return { block: true, reason: "Blocked by extension policy" };
    }
  });

  pi.registerTool({
    name: "hello_extension",
    label: "Hello Extension",
    description: "Return a greeting",
    parameters: z.object({ name: z.string() }),
    async execute(_id, params) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}` }],
        details: { greeted: params.name }
      };
    }
  });

  pi.registerCommand("hello-ext", {
    description: "Show extension status",
    handler: async (_args, ctx) => {
      ctx.ui.notify(`cwd=${ctx.cwd}`, "info");
    }
  });
}
```

### Extension 生命周期

```text
load paths
  -> import module + run factory
  -> register handlers/tools/commands
  -> ExtensionRunner.initialize(...)
  -> emit session/agent/tool events
  -> wrap tool execution
```

加载阶段只能注册，不能调用运行时 action。`pi.sendMessage()` 等 action 需要在事件、命令或工具执行期间使用。

### 重要事件

| 类别 | 事件 |
| --- | --- |
| session | `session_start`、`session_before_switch`、`session_switch`、`session_before_compact`、`session_tree`、`session_shutdown` |
| prompt / turn | `input`、`before_agent_start`、`context`、`turn_start`、`turn_end`、`message_start/update/end` |
| tool | `tool_call`、`tool_result`、`tool_execution_start/update/end` |
| reliability | `auto_compaction_start/end`、`auto_retry_start/end`、`ttsr_triggered`、`todo_reminder` |

`tool_call` 可阻止工具执行；`tool_result` 可修改返回内容和 details。

## Skill

布局：

```text
<skills-root>/<skill-name>/SKILL.md
```

推荐 frontmatter：

```md
---
name: postgres
description: PostgreSQL schema migration and query tuning workflow.
---

# PostgreSQL 工作流
...
```

发现规则：

- Provider 扫描 `skills/` 下一层目录，不递归。
- `skills.customDirectories` 也是一层 `*/SKILL.md`。
- native `.omp` 和 customDirectories 通常要求 description。
- 重名 skill 由 provider 优先级决定，先出现者胜出。

运行时暴露方式：

- system prompt 中列出 name + description。
- 通过 `read skill://<name>` 读取 `SKILL.md`。
- 通过 `read skill://<name>/<relative-path>` 读取同目录资产。
- 如果启用 `skills.enableSkillCommands`，注册 `/skill:<name>`。

## MCP

推荐配置位置：

```text
项目级: .omp/mcp.json
用户级: ~/.omp/agent/mcp.json
```

基本结构：

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/absolute/path"]
    }
  },
  "disabledServers": []
}
```

支持 transport：

- `stdio`：默认，要求 `command`。
- `http`：要求 `url`，新 remote server 推荐。
- `sse`：兼容旧 server。

详见 [MCP 配置速查](../reference/mcp.md)。

## Custom tools

Custom tool 是独立工具模块。当前 loader 支持从配置目录、plugin paths 和显式 paths 发现。

适合：

- 只增加一个模型可调用 API。
- 不需要注册命令、快捷键、复杂 UI 或 Provider。

如果一个包需要策略、命令、工具和渲染一起工作，优先做 Extension。

## Hook

Hook subsystem 仍可用，但默认 CLI 启动流中：

- `--hook` 被当作 `--extension` 的 alias。
- 工具由 `ExtensionToolWrapper` 包装，不是旧 `HookToolWrapper`。
- 上下文转换和 lifecycle emission 走 `ExtensionRunner`。

旧 Hook factory 示例：

```ts
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

export default function hook(pi: HookAPI): void {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && String(event.input.command ?? "").includes("rm -rf")) {
      return { block: true, reason: "blocked by policy" };
    }
  });
}
```

如果是新项目，建议直接使用 Extension。

## Marketplace / Plugin

omp 支持插件与 marketplace 概念。技能文档中的示例包含：

- `hello-extension`
- `safety-hook`
- `mini-marketplace`

这些示例展示了扩展注册、安全拦截和 marketplace 插件结构。团队内部可以把常用扩展和技能打包成 marketplace 分发。
