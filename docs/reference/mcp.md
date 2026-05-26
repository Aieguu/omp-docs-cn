# MCP 配置速查

## 推荐位置

OMP-native：

```text
项目级: .omp/mcp.json
用户级: ~/.omp/agent/mcp.json
```

兼容 fallback：

```text
mcp.json
.mcp.json
```

优先使用 `.omp/mcp.json` 或 `~/.omp/agent/mcp.json`，这样行为最明确。

## 基本结构

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "some-mcp-server"]
    }
  },
  "disabledServers": ["server-name"]
}
```

server name 必须匹配：

```text
^[a-zA-Z0-9_.-]{1,100}$
```

## stdio

`type` 省略时默认为 `stdio`。

必填：

- `command`

可选：

- `args`
- `env`
- `cwd`
- `timeout`
- `enabled`

示例：

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/absolute/path/one",
        "/absolute/path/two"
      ]
    }
  }
}
```

## HTTP

必填：

- `type: "http"`
- `url`

可选：

- `headers`

示例：

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

## SSE

`sse` 仍兼容，但新远端 server 通常建议用 Streamable HTTP。

```json
{
  "mcpServers": {
    "legacy-remote": {
      "type": "sse",
      "url": "https://example.com/mcp/sse"
    }
  }
}
```

## OAuth / API key

`auth` 用于让 OMP 记住如何恢复凭据：

```json
{
  "auth": {
    "type": "oauth",
    "credentialId": "optional-stored-credential-id",
    "tokenUrl": "optional-token-endpoint",
    "clientId": "optional-client-id",
    "clientSecret": "optional-client-secret"
  }
}
```

`oauth` 用于显式 OAuth client 设置：

```json
{
  "oauth": {
    "clientId": "...",
    "clientSecret": "...",
    "redirectUri": "...",
    "callbackPort": 3334,
    "callbackPath": "/oauth/callback"
  }
}
```

## Secret 解析

在 `.omp/mcp.json` 和 `~/.omp/agent/mcp.json` 中，stdio `env` 与 HTTP/SSE `headers` 的值会按以下规则解析：

1. 以 `!` 开头：执行后面的 shell 命令，10 秒超时，使用 trim 后 stdout。
2. 命令失败、超时、空输出：该项省略。
3. 否则检查值是否是环境变量名。
4. 环境变量存在且非空：使用环境变量值。
5. 否则使用字面字符串。

示例：

```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "GITHUB_PERSONAL_ACCESS_TOKEN"
  },
  "headers": {
    "Authorization": "!printf 'Bearer %s' \"$GITHUB_TOKEN\""
  }
}
```

根目录 `mcp.json` / `.mcp.json` 还支持 `${VAR}` 和 `${VAR:-default}` 展开。

## 禁用 server

`disabledServers` 从用户级配置读取，用于屏蔽从任意来源发现的 server：

```json
{
  "disabledServers": ["github", "slack"]
}
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `/mcp add` | 引导式添加。 |
| `/mcp reload` | 重新发现并连接。 |
| `/mcp list` | 查看 server 来自哪个配置文件。 |
| `/mcp test <name>` | 测试单个 server。 |
| `/mcp reconnect <name>` | 重连单个 server。 |
| `/mcp resources` | 查看 resources。 |
| `/mcp prompts` | 查看 prompts。 |
| `/mcp notifications` | 查看 notifications。 |

## 常见错误

### `stdio server requires "command" field`

通常是远端 server 忘了写：

```json
"type": "http"
```

### `both "command" and "url" are set`

一个 server 只能选一种 transport。

### server 在其他工具里存在但 OMP 不显示

检查：

- `/mcp list`。
- `mcp.enableProjectConfig` 是否禁用项目配置。
- 用户级 `disabledServers` 是否屏蔽。
- server name 是否和高优先级来源冲突。
