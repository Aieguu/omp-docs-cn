# MCP

## 何时使用 MCP

当有人已经为你想要的集成发布了 MCP 服务器时——文件系统、GitHub、Slack、Linear、Postgres——请使用 MCP。你只需放下一个 JSON 配置；omp 处理握手、OAuth、重连和工具注册。如果你需要定制逻辑，请改写[自定义工具](./custom-tools.md)。

## 配置文件

omp 从以下位置读取 `mcp.json`，按优先级排序：

- `.omp/mcp.json` — 项目，omp 管理
- `~/.omp/agent/mcp.json` — 用户，omp 管理
- 仓库根目录的 `mcp.json` 或 `.mcp.json` — 独立备用
- `.claude/`、`.cursor/`、`.vscode/`、`.gemini/`、`.windsurf/`、`opencode.json` — 自动发现

项目条目会遮蔽具有相同键的用户条目。通过将服务器的键添加到 `disabledServers` 来禁用服务器而不删除其配置。

## stdio 传输

启动本地进程。omp 通过其 stdin/stdout 传输 JSON-RPC。

```
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "fs": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}/projects"],
      "env": {
        "LOG_LEVEL": "info"
      },
      "cwd": "${HOME}"
    }
  }
}
```

当设置了 `command` 时，`type` 默认为 `"stdio"`。`${VAR}` 和 `${VAR:-default}` 在加载时展开，适用于 `command`、`args`、`env`、`cwd`、`url`、`headers`、`auth` 和 `oauth`。

## Streamable HTTP 传输

连接到远程端点。通过 `headers` 发送 bearer token，或通过 `oauth` 配置 OAuth。

```
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "linear": {
      "type": "http",
      "url": "https://mcp.linear.app/sse",
      "headers": {
        "Authorization": "Bearer ${LINEAR_TOKEN}"
      }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "oauth": {
        "clientId": "${GH_CLIENT_ID}",
        "clientSecret": "${GH_CLIENT_SECRET}"
      }
    }
  }
}
```

对于 OAuth 服务器，通过 `/mcp reauth <name>` 完成认证流程。凭据存储在加密的 `agent.db` 中；不会回写到 JSON 文件。

## 发现与作用域

工具以 `mcp__<server>_<tool>` 的形式呈现。该前缀使两个具有相同上游工具名的服务器保持区分。连接、列表和工具加载并行进行，带有 250ms 的快速启动门控——缓存的工具定义立即以延迟句柄的形式出现，同时慢速服务器完成握手。故障按服务器隔离，传输层会自动重连并退避。

## 按需激活

对于大型目录，将所有 MCP 工具加载到提示中会浪费上下文。在 `~/.omp/agent/config.yml` 中设置 `tools.discoveryMode: mcp-only`，MCP 工具会被门控在一个发现步骤之后：模型看到一个 `mcp_discover` 工具，调用它列出服务器及其工具，只有被选中的工具才会在当前轮次实体化为活跃工具集。

```
tools:
  discoveryMode: mcp-only   # 或 "always"（默认），"off"
```

## 斜杠命令

| 类别 | 命令 |
| --- | --- |
| 编辑配置 | `/mcp add`、`/mcp remove`、`/mcp enable`、`/mcp disable` |
| 运行时 | `/mcp test`、`/mcp reauth`、`/mcp unauth`、`/mcp reconnect <name>`、`/mcp reload` |
| 检查 | `/mcp list`、`/mcp resources`、`/mcp prompts`、`/mcp notifications` |
| Smithery | `/mcp smithery-search`、`/mcp smithery-login`、`/mcp smithery-logout` |

`/mcp add`、`/mcp enable`、`/mcp disable` 和 `/mcp reauth` 会回写到 omp 管理的文件并自动添加 `$schema` 行。

## 相关

- [自定义工具](./custom-tools.md) — 编写你自己的工具，而非采用 MCP 服务器。
- [Plugins](./plugins.md) — 将 MCP 配置与 Skills、命令和 Hooks 打包。
- [设置](./settings.md) — `tools.discoveryMode` 及相关配置项。
