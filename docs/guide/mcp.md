# MCP

## 连接你的第一个服务器

当一个服务或工具已经发布了 MCP 服务器、而你希望 omp 与之协作时——例如搜索问题跟踪器、查询数据库，或使用当前项目之外的文件系统——请使用 MCP。你只需配置一次该服务器，之后用普通语言请求相应的工作即可。

最快的方式是使用 omp 内部的引导式设置：

```
/mcp add
```

当该仓库中的所有人都应能发现该服务器时选择 **Project**（项目），仅当它只属于你本人时选择 **User**（用户）。设置完成后立即验证：

```
/mcp test filesystem
```

成功的测试会显示服务器名称与版本、工具数量以及最多十个工具名。之后你就可以例如这样请求：

> 使用 filesystem MCP 服务器总结我 Documents 文件夹中的 Markdown 文件。

你无需用 MCP 工具的内部名称来指代它们。

## 最小配置

对于本地服务器，请在项目中创建 `.omp/mcp.json`。以下示例会启动官方的 filesystem 服务器，并仅授予它访问一个目录的权限：

```
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/alice/Documents"
      ]
    }
  }
}
```

将该路径替换为你机器上的一个绝对目录。当省略 `type` 时，`stdio` 是默认的传输方式。

如果在 omp 运行期间编辑该文件，请用以下命令应用并验证更改：

```
/mcp reload
/mcp list
/mcp test filesystem
```

`/mcp list` 会按来源对服务器分组，并显示每一台是已连接、连接中、未激活、已禁用还是未连接。

## omp 的查找位置

你通常无需复制已有的 MCP 配置。omp 会自动从 Claude Code、Codex、Gemini CLI、OpenCode、Cursor、Windsurf、VS Code、已安装的插件以及扩展包中导入受支持的服务器定义。运行 `/mcp list` 可查看发现了什么以及由哪个文件提供。

对于由 omp 管理的配置，优先使用：

| 作用域 | 文件 | 用途 |
| --- | --- | --- |
| 项目 | `.omp/mcp.json` | 由该仓库共享的服务器定义 |
| 用户 | `~/.omp/agent/mcp.json` | 你在默认档案(profile)中的个人服务器 |
| 命名档案 | `~/.omp/profiles/<name>/agent/mcp.json` | 隔离给 `omp --profile <name>` 使用的服务器 |
| 便携式备用 | 项目根目录下的 `mcp.json` 或 `.mcp.json` | 与其他 MCP 客户端共享的最低优先级文件 |

项目级 MCP 发现默认启用。对于重复的服务器，先找到的定义胜出；定义不会被合并。`/mcp add`、`/mcp enable`、`/mcp disable` 以及 OAuth 命令只会写入 omp 管理的文件，而不会改动其他应用的配置。

## 传输方式

选择服务器所发布的传输方式。以 `/sse` 结尾的 URL 本身并不会选择 SSE；请为每一台远程服务器显式设置 `type`。

| 传输方式 | 必填字段 | 何时使用 |
| --- | --- | --- |
| `stdio` | `command`；可选 `args`、`env`、`cwd` | 本地可执行程序。可省略 `type`。 |
| `http` | `type: "http"`、`url`；可选 `headers` | 托管式 Streamable HTTP 服务器。新的远程集成请使用它。 |
| `sse` | `type: "sse"`、`url`；可选 `headers` | 明确要求旧传输方式的传统 HTTP+SSE 服务器。 |

一个最小的 Streamable HTTP 条目如下所示：

```
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "acme": {
      "type": "http",
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

一个服务器不能同时具有 `command` 和 `url`。

## 认证与密钥

### Bearer 令牌与 API 密钥

将本地进程的凭据放入 `env`，或将 HTTP/SSE 的凭据放入 `headers`。请引用环境变量，而不是提交密钥明文：

```
{
  "mcpServers": {
    "acme": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${ACME_TOKEN}"
      }
    }
  }
}
```

omp 在加载文件时会展开服务器配置中的 `${VAR}` 和 `${VAR:-default}`。在 `env` 和 `headers` 中，如果整个值指向某个环境变量，也会从进程环境中解析。以 `!` 开头的值会运行剩余部分的 shell 命令并使用其修剪后的输出；请只对你信任的命令使用这种写法。

虽然 schema 接受 `auth.type: "apikey"`，但它并不会获取并注入 API 密钥。请使用 `env` 或 `headers` 来提供 API 密钥。

### OAuth

对于支持 OAuth 的 HTTP 或 SSE 服务器，省略 token 并运行：

```
/mcp reauth acme
```

omp 会打开授权流程，并把凭据存储在激活档案(profile)的认证存储（`agent.db`，或配置的 auth broker）中，而不会写入 `mcp.json`。使用 `/mcp unauth acme` 可移除该凭据。如果 provider 要求注册客户端，只添加它所要求的设置：

```
{
  "mcpServers": {
    "acme": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "clientId": "${ACME_CLIENT_ID}",
        "clientSecret": "${ACME_CLIENT_SECRET}"
      }
    }
  }
}
```

OAuth 凭据绑定到激活档案(profile)和服务器 URL。同一档案(profile)可以在另一个检出目录中为相同的 URL 复用该凭据。显式的 `Authorization` 头会优先于托管的 OAuth，因此在重新授权前请移除过期的头。

## 检查与控制服务器

| 命令 | 你看到的内容或所做的更改 |
| --- | --- |
| `/mcp list` | 已配置和已发现的服务器、来源文件、传输方式与连接状态 |
| `/mcp test <name>` | 一次临时连接测试、服务器版本、工具数量以及最多十个上游工具名；按 Esc 可取消 |
| `/mcp reload` | 重新发现配置文件，并重建当前会话的 MCP 连接与工具 |
| `/mcp reconnect <name>` | 重新连接某一台已知服务器，而无需重新发现每个配置文件 |
| `/mcp enable <name>` | 启用一台服务器；对于导入的配置，会创建一个用户级覆盖 |
| `/mcp disable <name>` | 按名称禁用一台服务器，包括从其他工具导入的服务器 |
| `/mcp reauth <name>` | 替换激活档案(profile)的托管 OAuth 凭据 |
| `/mcp unauth <name>` | 移除该托管 OAuth 凭据 |
| `/mcp resources` | 列出已连接服务器暴露的资源与资源模板 |
| `/mcp prompts` | 列出已连接服务器暴露的提示词及其斜杠命令名称 |
| `/mcp notifications` | 显示通知支持情况、订阅，以及更新注入是否已启用 |
| `/mcp remove <name> [--scope project\|user]` | 删除一条 omp 管理的定义；project 是默认作用域 |
| `/mcp help` | 显示当前的命令参考 |

`/tools` 会显示 omp 当前可见的所有工具。MCP 工具名在名称被转成小写并规范化为下划线后，呈现为 `mcp__<server>_<tool>`。omp 可能会移除重复的服务器前缀或缩短超长的名称。这些名称帮助你识别某一能力来自何处；请继续使用自然语言请求工作。

已连接的服务器也可能发布提示词、资源和通知。`/mcp prompts` 会以 `/server:prompt` 的形式显示可调用的提示词命令。只有当 `mcp.notifications` 被启用时，资源更新才会进入对话；默认是关闭的。

## 安全

把每一条 MCP 定义都视为可执行的可信配置：

*   `stdio` 服务器会以你的用户权限运行其配置的命令。在打开不熟悉的仓库前，请先审查项目 MCP 文件。
*   授予最小的可用文件系统根目录、OAuth 作用域、数据库权限与 API 权限。
*   远程服务器会收到每次所请求操作需要的参数与数据。只使用你信任的端点和服务器包。
*   永远不要提交 token 或客户端机密。优先使用环境变量、可信的密钥命令或托管的 OAuth。
*   由于 OAuth 按 URL 限定在档案(profile)内，一个定义相同 URL 的不可信检出目录可能会使用该档案(profile)存储的凭据。请为不可信项目使用独立的档案(profile)。
*   用 `/mcp disable <name>` 禁用一个不需要的已发现服务器，而不是编辑其他应用的配置。

## 故障排查

### 服务器在 `/mcp list` 中缺失

检查 JSON 能否解析且包含顶层的 `mcpServers` 对象，然后运行 `/mcp reload`。用户级的 `disabledServers` 条目可能会隐藏该服务器。当 `mcp.enableProjectConfig` 为 false 时，项目来源也会被跳过。如果同名存在于多个来源，优先级更高的定义胜出。

### 远程服务器提示 `stdio server requires "command"`

添加 `"type": "http"`（对于传统服务器则用 `"sse"`）。当没有 `type` 时，omp 假定为 `stdio`。

### 本地服务器无法连接

运行 `/mcp test <name>`，检查可执行程序是否已安装、`cwd` 是否存在、参数是否正确，以及启动 omp 的进程能否访问所需的环境变量。stdio 服务器必须把 stdout 保留给 MCP 协议消息；诊断日志应发送到 stderr。

### 服务器返回 401 或 403

对于托管的 OAuth，运行 `/mcp reauth <name>`。如有需要，请先使用 `/mcp unauth <name>`。对于头认证，请确认环境变量已设置，并移除任何会覆盖 OAuth 的过期显式 `Authorization` 头。

### 连接超时

设置更大的按服务器计的毫秒级 `timeout`，然后重新加载。默认值是 30 秒；`0` 会禁用客户端侧的 MCP 超时。`OMP_MCP_TIMEOUT_MS` 会为该进程覆盖每一个按服务器的超时。

```
{
  "mcpServers": {
    "slow-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "timeout": 120000
    }
  }
}
```

对于瞬时故障，使用 `/mcp reconnect <name>`。在更改文件之后、或当发现本身出错时，使用 `/mcp reload`。

## 服务器字段参考

| 字段 | 适用于 | 含义 |
| --- | --- | --- |
| `enabled` | 全部 | 除非为 `false`，否则连接；用户的启用/禁用覆盖可取代导入的定义 |
| `timeout` | 全部 | 以毫秒计的请求超时；`0` 表示禁用 |
| `requestIdFormat` | 全部 | 默认是 `"number"`；仅对要求字符串 JSON-RPC ID 的服务器使用 `"string"` |
| `command` | stdio | 要启动的可执行程序 |
| `args` | stdio | 不经 shell 解析而传递的参数数组 |
| `env` | stdio | 传递给进程的环境变量 |
| `cwd` | stdio | 进程的工作目录 |
| `url` | http, sse | 远程 MCP 端点 |
| `headers` | http, sse | 请求头，包括 token 认证 |
| `oauth` | http, sse | 可选的 `clientId`、`clientSecret`、`redirectUri`、`callbackPort`、`callbackPath` 与 `prompt` 授权设置 |
| `auth` | 全部 | 高级的已存储凭据元数据；通常由托管的 OAuth 生成/解析，而非手工编写 |

用户配置还可以包含 `disabledServers` 和 `enabledServers` 数组。拒绝列表拥有最高的优先级。

以下相关设置位于 `~/.omp/agent/config.yml`（或激活档案(profile)的配置）中：

```
mcp:
  enableProjectConfig: true
  renderMarkdownResults: true
  notifications: false
  notificationDebounceMs: 500
```

这些都是默认值。`notificationDebounceMs` 控制资源更新在进入对话之前被分组等待的时间。

## 相关

*   [自定义工具](./custom-tools.md) — 当没有合适的 MCP 服务器时，编写一个小型原生工具。
*   [编写 MCP 服务端](./mcp-authoring.md) — 构建并打包属于你自己的服务器。
*   [设置](./settings.md) — 配置项目发现、通知与结果渲染。
*   [Plugins](./plugins.md) — 将 MCP 定义与其他 omp 扩展一起分发。
