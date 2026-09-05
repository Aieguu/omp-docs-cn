# 编写扩展

## 构建你的第一个扩展

扩展是 omp 加载到会话进程中的 TypeScript 或 JavaScript 模块。当某项能力需要可执行行为时使用扩展：模型可用的工具、面向用户的 slash 命令、围绕工具调用的策略、自定义 UI 或 provider 集成。

可分发的扩展包还可以捆绑声明式能力，例如技能、提示词模板、规则、hook、自定义工具和 MCP 服务端配置。扩展工厂与这些同级文件夹会被一起发现，因此用户只需安装一个包。

先从两个文件开始。omp 直接运行 TypeScript，因此构建步骤是可选的。

```
hello-extension/
├── package.json
└── src/
    └── index.ts
```

```
{
  "name": "hello-extension",
  "version": "1.0.0",
  "type": "module",
  "files": ["src"],
  "omp": {
    "extensions": ["./src/index.ts"]
  }
}
```

`omp.extensions` 是一个数组，其中每个条目都相对于包根目录。已安装插件中的条目可以是 `.ts`、`.js`、`.mjs` 或 `.cjs`。较旧的 `pi.extensions` 字段仍然兼容，但新包应使用 `omp.extensions`。

将 omp 的包安装为开发依赖，以获得当前的 TypeScript 类型和编辑器补全：

```
cd hello-extension
bun add --dev @oh-my-pi/pi-coding-agent
```

现在创建 `src/index.ts`：

```
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function helloExtension(pi: ExtensionAPI) {
  const z = pi.zod;

  pi.on("session_start", (_event, ctx) => {
    ctx.ui.notify("hello-extension loaded", "info");
  });

  pi.registerCommand("hello", {
    description: "Greet someone",
    handler: async (args, ctx) => {
      const name = args.trim() || "there";
      ctx.ui.notify(`Hello, ${name}!`, "info");
    },
  });

  pi.registerTool({
    name: "greet_person",
    label: "Greet Person",
    description: "Create a short greeting for a person",
    parameters: z.object({
      name: z.string().describe("Person to greet"),
    }),
    approval: "read",
    async execute(_toolCallId, params) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: { name: params.name },
      };
    },
  });
}
```

默认导出即公共的工厂契约：

```
export type ExtensionFactory = (
  pi: ExtensionAPI,
) => void | Promise<void>;
```

在工厂内部注册命令、工具、处理器、渲染器、标志和 provider。工厂加载期间，诸如 `pi.sendMessage()` 之类的运行时操作尚不可用；请从事件处理器、命令处理器或工具执行中稍后再调用它们。

## 加载并测试

在包含 `hello-extension` 的目录中，启动一次性的开发会话：

```
omp --extension ./hello-extension
# -e 是短形式
```

在 TUI 中：

1.   `hello-extension loaded` 通知确认工厂已运行。
2.   输入 `/hello Ada` 测试面向用户的命令。
3.   以普通提示词询问 **“Use the greeting tool to greet Ada.”**，从而实际调用该工具。
4.   打开 `/extensions` 检查发现的能力项及其启用状态。

扩展工厂在会话启动时初始化。修改 `src/index.ts` 后，退出并启动一个新会话以加载新代码。

### 开发期间保持启用

将包链接到你的用户插件集合中：

```
omp plugin link ./hello-extension
# 本地路径的等价写法：
omp install ./hello-extension
```

本地安装是符号链接，因此修改会在 omp 下次启动时生效；它不会热重载正在运行的扩展工厂。使用 `omp plugin list` 确认链接，使用 `omp plugin doctor` 检查已安装插件的健康状况。

对于不想安装的包，可以改为将其绝对路径添加到用户配置中：

```
# ~/.omp/agent/config.yml
extensions:
  - /absolute/path/to/hello-extension
```

配置中的相对路径从 omp 启动时所在的目录解析，而不是从配置文件所在目录解析。项目特定的配置应放在 `<project>/.omp/config.yml`。散置的模块也可以直接放在 `<project>/.omp/extensions/` 或 `~/.omp/agent/extensions/` 中；自动目录扫描会找到 `.ts` 和 `.js` 文件，以及一层 `index.ts` 或 `index.js` 子目录。

## 捆绑更多能力

通过 `--extension`、`extensions:` 或插件管理器加载的包根目录可以包含以下约定路径：

```
hello-extension/
├── package.json
├── src/index.ts
├── skills/release-notes/SKILL.md
├── commands/release.md
├── rules/commit-policy.md
├── prompts/review.md
├── hooks/
│   ├── pre/block-dangerous.ts
│   └── post/audit.ts
├── tools/
│   └── changelog/index.ts
└── .mcp.json
```

| 路径 | omp 会发现的项 |
| --- | --- |
| `skills/<name>/SKILL.md` | 按需技能 |
| `commands/*.md` | 用户 slash 命令 |
| `rules/*.{md,mdc}` | 项目或工作流规则 |
| `prompts/*.md` | 提示词模板 |
| `hooks/pre/*`、`hooks/post/*` | 工具前与工具后 hook |
| `tools/*` | 以受支持的脚本、Markdown、JSON、TS 或 JS 格式编写的自定义工具 |
| `.mcp.json` 或 `mcp.json` | MCP 服务端定义 |

这些文件夹无需在 `package.json` 中声明任何字段。发布时请将它们包含在包的 `files` 列表中。每种文件的格式参见[技能](./skills.md)、[Hook](./hooks.md)、[自定义工具](./custom-tools.md)和 [MCP](./mcp.md)。

一个包可以暴露多个运行时工厂：

```
{
  "omp": {
    "extensions": ["./src/policy.ts", "./src/tools.ts"]
  }
}
```

仅当条目确实彼此独立时才使用多个条目。单个工厂即可注册所有公共扩展面。

## 打包并分发

扩展与 omp 拥有相同的文件系统、网络、环境和进程权限。它们不会被沙箱隔离。请保持包的可审计性，避免不必要的依赖，并告知用户它需要哪些外部访问权限。

### 发布到 npm

确保 `files` 包含每个工厂和所有捆绑的能力目录，然后在发布前检查 tarball：

```
npm pack --dry-run
npm publish
```

用户按 npm 名称安装已发布的包：

```
omp install @acme/hello-extension
```

包管理器会安装其依赖，并从发布后的 `package.json` 读取 `omp.extensions`。安装或升级扩展模块后，请启动新的 omp 会话。

### 从 Git 安装

无需市场即可安装公共仓库：

```
omp install github:acme/hello-extension#v1.0.0
```

为获得可复现的安装，请使用不可变的标签或提交。

### 通过市场发布

市场是包含 `.omp-plugin/marketplace.json` 的 Git 仓库。`.claude-plugin/marketplace.json` 是与 Claude Code 兼容的回退方案。最小的仓库可以将扩展放在 `plugins/hello-extension/` 中，并使用此目录清单：

```
{
  "name": "acme-extensions",
  "owner": { "name": "Acme" },
  "plugins": [
    {
      "name": "hello-extension",
      "description": "A greeting command and tool",
      "version": "1.0.0",
      "source": "./plugins/hello-extension",
      "category": "productivity"
    }
  ]
}
```

推送仓库后，用户运行：

```
omp plugin marketplace add acme/omp-extensions
omp plugin install hello-extension@acme-extensions
```

发布更新时，给仓库打标签，酌情更新目录清单的版本与源固定(source pin)，并让用户依次运行 `omp plugin marketplace update` 和 `omp plugin upgrade hello-extension@acme-extensions`。目录清单的源格式、固定、作用域与更新行为参见[市场](./marketplace.md)，安装与功能管理参见[插件](./plugins.md)。

## 公共扩展接口

已安装的 `@oh-my-pi/pi-coding-agent` TypeScript 声明是权威的签名参考。请从包根目录导入公共类型：

```
import type {
  ExtensionAPI,
  ExtensionContext,
  ExtensionCommandContext,
  ExtensionFactory,
  ToolDefinition,
} from "@oh-my-pi/pi-coding-agent";
```

### `ExtensionAPI`

| 公开面 | 公共成员 |
| --- | --- |
| Schema 与宿主访问 | `zod`、`arktype`、`typebox`、`logger`、`pi` |
| 事件 | `on(event, handler)`、共享的 `events` 总线 |
| 注册 | `registerTool`、`registerCommand`、`registerShortcut`、`registerFlag`、`registerMessageRenderer`、`registerAssistantThinkingRenderer`、`registerComposerShape` |
| Provider 集成 | `registerProvider`、`unregisterProvider` |
| 宿主文件系统回退 | `registerFileWriteFallback`、`registerFileDeleteFallback` |
| 消息与执行 | `sendMessage`、`sendUserMessage`、`appendEntry`、`exec` |
| 工具与命令 | `getActiveTools`、`getAllTools`、`setActiveTools`、`getCommands` |
| 会话选项 | `setModel`、`getThinkingLevel`、`setThinkingLevel`、`getServiceTiers`、`setServiceTier`、`getSessionName`、`setSessionName` |
| 元数据与标志 | `setLabel`、`getFlag` |

新工具 schema 请使用 `pi.zod` 或 `pi.arktype`。`pi.typebox` 用于兼容较旧的扩展。

### 命令、快捷键与标志

```
pi.registerCommand("deploy", {
  description: "Deploy the current project",
  getArgumentCompletions: (prefix) => [
    { value: "staging", label: "staging" },
    { value: "production", label: "production" },
  ].filter((item) => item.value.startsWith(prefix)),
  handler: async (args, ctx) => {
    // args is the text after /deploy
  },
});

pi.registerShortcut("ctrl+shift+d", {
  description: "Open deployment controls",
  handler: async (ctx) => {
    ctx.ui.notify("Deployment controls", "info");
  },
});

pi.registerFlag("deployment-target", {
  description: "Default deployment target",
  type: "string",
  default: "staging",
});
```

命令名称不得与内置 slash 命令冲突。快捷键使用与[快捷键](./keybindings.md)中描述的相同 ID；保留的终端与核心组合键无法被替换。使用 `pi.getFlag("deployment-target")` 读取已注册的标志。

### 工具

一个 `ToolDefinition` 需要 `name`、`label`、`description`、`parameters` 和一个异步的 `execute` 函数。完整的可选面如下：

| 字段 | 用途 |
| --- | --- |
| `hidden` | 除非被显式选中，否则排除该工具 |
| `defaultInactive` | 注册该工具但不在一开始激活它 |
| `loadMode` | 默认为 `"discoverable"`；使用 `"essential"` 让它保持为顶级工具 |
| `approval` | `"read"`、`"write"` 或 `"exec"`；默认为 `"exec"` |
| `deferrable` | 允许需要 resolve 或 discard 的分阶段更改 |
| `strict` | 选择启用或停用 provider 的结构化输出语法 |
| `onSession` | 在启动、切换、分叉、树导航或关闭时初始化或清理状态 |
| `renderCall`、`renderResult` | 为自定义展示提供 TUI 组件 |
| `mcpServerName`、`mcpToolName` | 当工具作为 MCP 前端时添加发现元数据 |

`execute(toolCallId, params, signal, onUpdate, ctx)` 返回一个 agent 工具结果，其中包含 `content` 数组和可选的带类型 `details`。请尊重 `signal` 以支持取消，并使用 `onUpdate` 提供有意义的流式进度。

### 运行时与命令上下文

每个事件处理器和工具都会收到 `ExtensionContext`。命令处理器收到更大的 `ExtensionCommandContext`。

| `ExtensionContext` 成员 | 用途 |
| --- | --- |
| `cwd`、`mode`、`hasUI`、`ui` | 当前目录与用户界面面 |
| `model`、`models`、`modelRegistry` | 当前模型与只读的模型发现/解析 |
| `sessionManager` | 只读的会话访问 |
| `getContextUsage()`、`getAsyncJobSnapshot()` | 当前上下文与后台任务快照 |
| `isIdle()`、`hasPendingMessages()`、`abort()`、`shutdown()` | 会话状态与生命周期控制 |
| `compact()`、`getSystemPrompt()` | 上下文操作 |
| `memory` | 已配置的结构化记忆运行时(如可用) |
| `setInterval`、`setTimeout`、`clearTimer` | 受管理的后台回调 |
| `invokeTool` | 在替换同一内置工具时委托给原生实现 |
| `localProtocolOptions` | 调用会话的本地协议映射(如存在) |
| `isProjectTrusted()` | 兼容性检查；omp 目前信任已加载的项目输入 |

命令处理器还会收到 `waitForIdle()`、`newSession()`、`switchSession()`、`branch()`、`navigateTree()` 和 `reload()`。

`ctx.ui` 包含通知、选择/确认/输入对话框、编辑器访问、状态与组件(widget)、页眉/页脚控制、主题、自定义 TUI 组件和自动补全注册。在依赖仅限交互的行为之前，请检查 `ctx.hasUI` 或 `ctx.mode === "tui"`；print 与 RPC 会话没有交互式终端。

请使用 `ctx.setInterval()` 和 `ctx.setTimeout()`，而不是原始定时器。受管理的回调会包含抛出的错误、不会让进程保持存活，并会在会话关闭时被清除。

### 事件

使用 `pi.on(name, handler)` 订阅。事件对象与允许的返回值会根据事件名称推断。

| 分组 | 事件名称 |
| --- | --- |
| 资源发现 | `resources_discover` |
| 会话生命周期 | `session_start`、`session_before_switch`、`session_switch`、`session_before_branch`、`session_branch`、`session_before_compact`、`session.compacting`、`session_compact`、`session_before_tree`、`session_tree`、`session_shutdown` |
| 提示词与 provider | `input`、`before_agent_start`、`before_provider_request`、`after_provider_response`、`context` |
| Agent 与消息 | `agent_start`、`agent_end`、`session_stop`、`turn_start`、`turn_end`、`message_start`、`message_update`、`message_end` |
| 工具生命周期 | `tool_call`、`tool_result`、`tool_execution_start`、`tool_execution_update`、`tool_execution_end`、`tool_approval_requested`、`tool_approval_resolved` |
| 用户命令与 MCP | `user_bash`、`user_python`、`mcp_notification` |
| 压缩与重试 | `auto_compaction_start`、`auto_compaction_end`、`auto_retry_start`、`auto_retry_end`、`retry_fallback_applied`、`retry_fallback_succeeded`、`ttsr_triggered` |
| 会话服务 | `todo_reminder`、`goal_updated`、`credential_disabled` |

前置事件可以取消或替换其文档中描述的操作，`tool_call` 可以阻止一次调用，`tool_result` 可以替换其结果。请让 TypeScript 强制约束精确的返回结构，而不是返回本应属于其他事件的字段。

## 故障排查

### 包无法加载

*   确认每个 `omp.extensions` 路径都存在且相对于 `package.json`。
*   确认入口默认导出一个函数，而不是已创建好的对象。
*   运行 `omp --extension /absolute/path/to/package`，以消除配置与工作目录的歧义。
*   检查 `/extensions` 以及 `~/.omp/logs/` 下的结构化日志，了解该能力的发现状态。运行时工厂的导入错误会包含失败路径，位于 `~/.omp/logs/` 下的结构化日志中。
*   如果扩展导入了运行时依赖，请在加载它之前先运行包管理器，并将这些依赖声明在 `dependencies` 中，而不只是 `devDependencies`。

单个扩展失败不会阻止其他扩展路径加载。

### 能加载，但缺少某项能力

*   修改扩展工厂或安装包之后，重启 omp。
*   确保捆绑的文件夹位于包根目录、紧挨 `package.json`，并且包含在发布的 tarball 中。
*   对于修改过的技能、slash 命令和 MCP 服务端，使用 `/reload-plugins`。工具、hook 和扩展模块需要新会话。
*   检查该项是否在 `/extensions` 中或由配置中的 `disabledExtensions` 禁用。运行时工厂的 ID 是 `extension-module:<filename>`；`index.ts` 条目使用其父目录名称。

### 在 TUI 之外崩溃或表现不同

扩展在进程内运行且不受沙箱隔离。请捕获你自己的未跟踪 promise 中抛出的失败，使用受管理的上下文定时器，尊重中止信号，并在 `session_shutdown` 时释放资源。使用 `ctx.mode === "tui"` 保护自定义终端 UI；当扩展还必须在 print、RPC 或 ACP 会话中工作时，请提供非交互行为。
