# 编写 MCP 服务端

## 构建一次，从多个客户端使用

MCP 服务端可将 API、本地服务或工作流变成 omp 可以发现并使用的工具。当集成也需要与其它 MCP 客户端一起使用时，请选择 MCP。对于仅面向 omp 的集成，[自定义工具](./custom-tools.md) 通常更小。

最快的路径是本地 **stdio** 服务端。官方 SDK 负责处理 JSON-RPC 分帧、版本协商以及初始化序列，因此你的代码可以专注于工具 schema 和行为。

## 构建一个最小的 stdio 服务端

在你的项目中安装当前的 TypeScript 服务端 SDK 和 Zod：

```
npm install @modelcontextprotocol/server zod
```

将其保存为 `mcp/hello-server.mjs`：

```
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server = new McpServer({
  name: "hello",
  version: "1.0.0",
});

server.registerTool(
  "greet",
  {
    description: "Greet one person by name.",
    inputSchema: z.object({
      name: z.string().min(1).describe("The person's name"),
    }),
  },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }),
);

await server.connect(new StdioServerTransport());
```

在 stdio 服务端中，不要把日志打印到 stdout。stdout 承载的是以换行分隔的 MCP 消息；一行调试信息就可能破坏连接。请改将诊断信息写入 stderr。

### 将其连接到 omp

在 `.omp/mcp.json` 添加项目配置：

```
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "hello": {
      "type": "stdio",
      "command": "node",
      "args": ["./mcp/hello-server.mjs"]
    }
  }
}
```

在该项目中启动 omp，然后运行：

```
/mcp reload
/mcp test hello
```

`/mcp test hello` 会创建一个临时连接，完成初始化，调用 `tools/list`，并报告服务端身份与发现的工具名称。它**不会**调用工具。用一次普通请求来检验 handler：

> 使用 hello 服务端向 Ada 问好。

你应该会看到 `Hello, Ada!`。除非服务端配置中设置了 `cwd`，否则子进程会在 omp 项目目录中启动，因此上面的相对 `args` 会从项目根目录解析。

## 选择传输方式

| 传输方式 | 适用场景 | 服务端契约 | omp 配置 |
| --- | --- | --- | --- |
| **stdio** | 为单个 omp 会话启动的本地服务端 | 从 stdin 读取 JSON-RPC，向 stdout 写入换行分隔的 JSON-RPC，并让诊断信息远离 stdout | 省略 `type` 或使用 `"type": "stdio"`；设置 `command`，并可选用 `args`、`env` 和 `cwd` |
| **Streamable HTTP** | 守护进程或托管的共享服务 | 通过 HTTP POST 接受 MCP JSON-RPC；按 MCP 传输层规范要求支持 JSON 或 SSE 响应 | 使用 `"type": "http"` 和 `url`；`headers` 与 OAuth 可选 |
| **Legacy HTTP+SSE** | 为 2024-11-05 传输层构建的既有服务端 | 打开一个 SSE 流，用于宣告 JSON-RPC POST 端点 | 使用 `"type": "sse"` 和 `url`；新服务端请勿选择此项 |

当 `type` 缺失时，默认即为 stdio。因此，没有 `"type": "http"` 的远程条目会被当作 stdio 处理，并因没有 `command` 而失败。

### 通过 Streamable HTTP 发布同一个工具

当前 SDK 可同时服务当前客户端与 2025 时代的客户端。对于小型 Node 托管的端点，请安装其 Node 适配器：

```
npm install @modelcontextprotocol/node
```

一个最小的回环服务端看起来是这样：

```
import { createServer } from "node:http";
import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: "hello-http", version: "1.0.0" });
  server.registerTool(
    "greet",
    {
      description: "Greet one person by name.",
      inputSchema: z.object({ name: z.string().min(1) }),
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}!` }],
    }),
  );
  return server;
});

const nodeHandler = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();

createServer((request, response) => {
  if (!validateHost(request, response) || !validateOrigin(request, response)) return;
  void nodeHandler(request, response);
}).listen(3000, "127.0.0.1");
```

配置正在运行的端点：

```
{
  "mcpServers": {
    "hello-http": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

对于公开部署，请校验 `Host` 和 `Origin`，在分发到 MCP handler 之前完成身份认证，使用 TLS，并且只将经过验证的身份传给工具代码。handler 不会替你认证请求。关于 omp 的请求头与 OAuth 配置，请参阅 SDK 的 [HTTP 服务指南](https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html) 与 [MCP](./mcp.md)。

## 公开协议契约

强烈建议使用 MCP SDK。如果你自己实现线上协议，以下是 omp 所依赖的互操作要点：

| 阶段 | 服务端必须做什么 |
| --- | --- |
| `initialize` | 接受一个 JSON-RPC 2.0 请求。omp 目前提供 MCP 协议修订版 `2025-11-25`。回复协商后的 `protocolVersion`、`serverInfo` 和 `capabilities`。 |
| `notifications/initialized` | 在期待后续会话流量之前接受该通知。通知没有请求 ID，也不会收到响应。 |
| `tools/list` | 当声明了 `capabilities.tools` 时，返回 `{ "tools": [...] }`。如果结果包含 `nextCursor`，omp 会持续跟随，直到加载完所有页。 |
| `tools/call` | 接受 `{ "name": string, "arguments"?: object }` 并返回工具结果。精确回显每个 JSON-RPC 请求 ID；合法的 ID 可以是数字或字符串。 |
| 服务端请求 | omp 会应答 `ping` 与 `roots/list`。`roots/list` 将活动项目作为 `file:` URI 返回。除非客户端已公告支持，否则不要假定它支持其它服务端到客户端的方法。 |
| 工具变更 | 如果工具可能会变化，请公告 `tools.listChanged`，并在初始化之后发送 `notifications/tools/list_changed`。这样 omp 就会在不重启会话的情况下重新加载该服务端的工具列表。 |

对于 Streamable HTTP，当你签发 `Mcp-Session-Id` 后要保留它，并接受初始化之后请求上的 `MCP-Protocol-Version: 2025-11-25`。支持公开的 MCP 传输层规范所定义的 HTTP 方法、状态码、媒体类型以及可选的 SSE 通道。官方 SDK 会处理这些细节。

omp 默认发送数字形式的 JSON-RPC 请求 ID。服务端应同时接受 JSON-RPC 所允许的两种形式；只要求其中一种表示形式会降低与其它客户端的兼容性。

## 定义便于移植的工具

一个被列出的工具需要稳定的 `name`、具体的 `description`，以及顶层为 JSON Schema 对象的 `inputSchema`。使用上面的 SDK，像 Zod 这样的 Standard Schema 库会为你生成该 schema。

良好的 schema 能帮助客户端选择合适的工具并构造出合法的参数：

*   描述用户可见的动作，以及适合使用它的时机。
*   使用明确的属性描述、边界、枚举和 `required` 字段。
*   让可选字段真正可选；不要要求客户端发送空的占位值。
*   在 handler 中再次校验权限和输入。schema 是引导与校验，不是授权。
*   一旦用户开始依赖某个名称，就保持其稳定。

omp 按服务端对发现的工具进行命名空间隔离，将其名称转为小写，把 `[a-z_]` 之外的字符替换为下划线，并在需要时将挂载名称截断到 64 个字符并附上稳定的哈希后缀。规范化后相同的不同原始名称会发生冲突；omp 会保留一个确定性的胜出者。建议优先使用简短、区分度好的小写名称，例如 `search_issues` 或 `create_invoice`。用户会使用自然语言请求该能力，而不是输入挂载名称。

## 返回结果与错误

每次成功的调用都应返回 `content`。文本是最具可移植性的内容类型：

```
return {
  content: [{ type: "text", text: "Created invoice INV-1042." }],
};
```

omp 也接受 MCP 图片内容（以 base64 编码的 `data` 加 `mimeType`）以及内嵌资源内容。如果你同时返回 `structuredContent`，请在 `content` 中包含有用的文本表示；不要让人类可读的结果依赖结构化输出的支持。

对于预期内、用户可修正的失败，请使用 `isError: true`。这样能把失败附着在工具调用上，并给模型提供可以据此行动的信息：

```
return {
  content: [{ type: "text", text: "Customer C-17 does not exist." }],
  isError: true,
};
```

把抛出的异常或 JSON-RPC 错误响应留给协议违规、依赖不可用以及服务端意外故障。omp 将预期内的 `isError` 结果显示为工具错误；传输层与 JSON-RPC 的失败则表现为 MCP 错误。两种形式中都不要包含密钥、令牌或私有堆栈信息。

对于受保护的 HTTP 工具，基于标准的授权质询可以连同错误一起放在 `_meta["mcp/www_authenticate"]` 中返回。omp 能识别这一公开的 MCP 质询，并且当服务端配置了 OAuth 时，可以在重试前重新授权。

## 调试循环

1.   **独立测试服务端。** 对于 stdio 示例，先运行 `node --check mcp/hello-server.mjs`，再使用官方 inspector：

```
npx @modelcontextprotocol/inspector node ./mcp/hello-server.mjs
```

确认 `greet` 出现，并用 `{ "name": "Ada" }` 调用它。

2.   **重新加载发现。** 编辑 `.omp/mcp.json` 后，运行 `/mcp reload`，再运行 `/mcp list` 确认服务端名称与源文件。

3.   **测试发现与 schema。** 运行 `/mcp test hello`。它会验证初始化与 `tools/list`，但不会验证 handler 本身。

4.   **测试真实的用户路径。** 让 omp 执行该动作，然后检查返回的内容。对于动态服务端，`/mcp notifications` 有助于确认列表变更通知。

5.   **只重启发生变更的部分。** 更改本地服务端代码后使用 `/mcp reconnect hello`。更改发现或配置后使用 `/mcp reload`。

| 症状 | 检查项 |
| --- | --- |
| `ENOENT` 或找不到命令 | 检查 `command`、相对于项目的路径、可执行权限以及 `cwd`。 |
| 测试卡住或超时 | 确保服务端应答 `initialize`，然后接受 `notifications/initialized` 和 `tools/list`。默认请求超时为 30 秒；先解决卡顿，再调大 `timeout`。 |
| 无效 JSON 或立即断开 | 移除所有 stdout 日志/横幅。检查每个 stdio 帧都是一个完整的 JSON-RPC 对象且后面跟一个换行符。 |
| 测试能连接但真实调用失败 | `/mcp test` 不会调用工具。用 Inspector 复现问题，并对领域失败返回可操作的 `isError` 结果。 |
| 工具变更没有出现 | 重新连接已重启的 stdio 进程，或公告 `tools.listChanged` 并发送 `notifications/tools/list_changed`。 |
| HTTP 401 或 403 | 检查服务端的令牌校验以及客户端的请求头/OAuth 配置；受管的 OAuth 请使用 `/mcp reauth <name>`。 |
| 服务端列出了工具但工具缺失 | 查找规范化名称冲突、非法的顶层输入 schema，或者遮蔽了同名定义的其它服务端。 |

## 发布检查清单

*   服务端与 omp 协商 `2025-11-25`，并且在初始化完成前不发送会话流量。
*   stdio 的 stdout 只包含协议帧；托管的 HTTP 具备 TLS、认证以及 Host/Origin 校验。
*   `tools/list` 正确返回稳定的名称、描述、对象输入 schema 以及每一个分页游标。
*   每条 `tools/call` 路径都返回有用的 `content`；预期内的失败返回 `isError: true`。
*   Inspector 可以列出并调用每个工具，`/mcp test <name>` 报告相同的清单。
*   在 omp 中用自然语言发出的请求可以成功驱动真实的 handler。

## 相关内容

*   [MCP](./mcp.md) — 配置位置、发现、传输层、凭证以及生命周期命令。
*   [自定义工具](./custom-tools.md) — 当不需要跨客户端兼容性时，面向 omp 的替代方案。
*   [插件](./plugins.md) — 将 MCP 配置与技能、命令和 Hook 打包在一起。
*   [MCP 规范](https://modelcontextprotocol.io/specification/2025-11-25) — 公开的协议与传输层契约。
*   [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/v2/) — 当前的服务端 API 与示例。
