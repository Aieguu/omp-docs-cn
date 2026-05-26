# MCP 服务器编写

## 何时编写 MCP 服务器

当同一个集成需要从 omp、Claude Desktop、Cursor、VS Code 或任何其他支持 MCP 的工具中工作时，请编写 MCP 服务器。该协议让你免费获得跨编辑器复用能力。如果工具只在 omp 内运行，[自定义工具](./custom-tools.md) 编写更短、自带类型化参数，且跳过 JSON-RPC 握手。

面向 omp 的 MCP 服务器与其他客户端完全相同：stdio 或 streamable HTTP、JSON-RPC 2.0、`tools/list` 和 `tools/call`。omp 没有添加任何私有扩展。

## 最小化 stdio 服务器

stdio 是默认传输方式，也是阻力最小的路径：omp 启动你的二进制文件，向 stdin 写入 JSON-RPC 帧，从 stdout 读取响应，并将 stderr 视为日志。`@modelcontextprotocol/sdk` 包处理帧格式和 `initialize` 握手。

```
// server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({ name: "hello", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "greet",
    description: "Say hello to someone.",
    inputSchema: { type: "object", properties: { who: { type: "string" } }, required: ["who"] },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => ({
  content: [{ type: "text", text: `Hello, ${req.params.arguments?.who}!` }],
}));

await server.connect(new StdioServerTransport());
```

通过 `~/.omp/agent/mcp.json` 或 `.omp/mcp.json` 将其接入 omp：

```
{
  "mcpServers": {
    "hello": { "command": "node", "args": ["./server.js"] }
  }
}
```

`inputSchema` 是标准 JSON Schema。如果你更喜欢编译时类型，可以从 [TypeBox](https://github.com/sinclairzx81/typebox)（`Type.Object({...})`）生成 schema 并直接传入——TypeBox 输出标准 JSON Schema，这正是 omp 转发给模型的内容。

## Streamable HTTP 变体

当服务器位于 URL 之后时切换到 HTTP——长时间运行的守护进程、托管集成、需要认证或跨客户端共享状态的任何场景。在服务器端使用 SDK 的 HTTP 传输，然后在 omp 配置中设置 `type: "http"` 和 `url`。omp 通过 `headers` 或 `oauth` 块注入 bearer token；配置 schema 请参见 [MCP](./mcp.md)。

```
{
  "mcpServers": {
    "hello": {
      "type": "http",
      "url": "https://hello.example.com/mcp",
      "headers": { "Authorization": "Bearer ${HELLO_TOKEN}" }
    }
  }
}
```

`${VAR}` 和 `${VAR:-default}` 在加载时展开。header 或 env 值中以 `!` 开头的会运行 shell 命令并使用其修剪后的 stdout——对密钥管理器很有用，但如果命令可能静默失败则很危险。

## 针对 omp 进行测试

在 omp 内部，`/mcp test <name>` 会重连服务器、列出其工具并打印握手结果。`/mcp reconnect <name>` 断开现有连接并重新建立，无需重启会话——这是迭代本地服务器时最快的循环。`/mcp reload` 重新读取所有配置文件。工具更改立即传播；你不需要重新启动 omp。

连接错误、schema 验证失败以及 `tools/call` 的 `isError` 响应都会在行内显示，并附带服务器名称。

## 工具在模型中的呈现方式

omp 将每个 MCP 工具注册为 `mcp__<server>_<tool>`，全部小写，非 `[a-z_]` 字符替换为 `_`，重复的下划线被合并。工具名中多余的 `<server>_` 前缀会被去除一次。上面的 `hello` 服务器向模型暴露一个工具，名为 `mcp__hello_greet`。

选择能在该清理规则下干净保留的服务器名和工具名。`my-server` 和 `my.server` 会合并为相同的前缀，而注册表采用后者覆盖的策略。

## 相关

- [MCP](./mcp.md) — 消费端：配置位置、传输方式、OAuth、发现模式。
- [自定义工具](./custom-tools.md) — 不需要跨编辑器复用时的 omp 独有替代方案。
- [Plugins](./plugins.md) — 将 MCP 服务器配置与 Skills、命令和 Hooks 打包。
