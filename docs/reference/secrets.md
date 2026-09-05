# 密钥与认证

推荐的做法是让 omp 替你管理 provider 登录。启动 `omp`，运行 `/login`，选择一个 provider，然后完成浏览器或 API key 提示流程。这样既避免了把密钥写进 shell 命令，又能保持 OAuth 自动刷新，并且可以从同一界面移除账户。

```
/login
```

登录成功后，如果 provider 提供了身份信息，omp 会为账户命名，并打印保存凭据的路径。再次打开 `/login` 可以查看每个 provider 的状态以及当前生效的来源，例如 `login`、`api key`、`env`、`config` 或 `--api-key`。然后用 `/model` 选择模型。

你也可以直接指定已知的 provider ID：

```
/login anthropic
```

有些 provider 使用 OAuth，有些要求 API key，还有一些使用设备码或粘贴码流程。请按 omp 显示的提示操作。只把凭据粘贴到该登录提示中——不要粘贴到聊天消息或 shell 参数里。对 OAuth provider 重复执行 `/login` 会添加另一个账户；omp 在发起请求时可以从已存账户中选用。

## 凭据存放在哪里

在没有 auth broker 的情况下，默认存储位置是：

```
~/.omp/agent/agent.db
```

Profile、`PI_CODING_AGENT_DIR` 以及 XDG 数据目录都可以改变它的位置。`/login` 的成功消息会显示实际使用的路径。`agent.db` 也用于存储 omp 的其他状态，因此不要为了登出而删除整个数据库。

SQLite 凭据行包含 provider ID，以及以下两者之一：

*   一个 API key，或
*   一个 OAuth access token、refresh token、过期时间以及可用的账户元数据。

本地数据库**在静态时未加密**。在 POSIX 系统上，omp 以 `0700` 模式创建其目录，并将数据库权限改为 `0600`；Windows 依赖账户的文件系统 ACL。SQLite 在数据库打开期间还会在数据库旁边使用 `agent.db-wal` 和 `agent.db-shm`。请保护整个目录以及任何备份或同步副本，而不只是 `agent.db`。

要检查默认路径的权限：

```
ls -ld ~/.omp ~/.omp/agent
ls -l ~/.omp/agent/agent.db*
```

其他用户不应有权访问。全盘加密可以保护已关机的机器，但无法保护凭据免遭恶意软件、不受信任的扩展或以你的用户身份运行的另一个进程的窃取。

## 什么会离开机器

一次普通的 provider 登录和请求涉及三个相关流程：

1.   **OAuth 登录：** 你的浏览器会打开 provider 的授权页面。provider 向 omp 返回一个短期有效的授权结果，omp 再将其兑换为 token。对于 loopback 流程，回调会返回到运行 omp 的机器上的本地端口。
2.   **Provider 请求：** omp 将选定的 API key 或 OAuth access token 放进认证头，发送到模型端点。因此，自定义 `baseUrl` 或代理属于你的信任边界的一部分——它们会收到凭据和请求内容。
3.   **OAuth 刷新：** 当 access token 需要续期时，omp 会把 refresh token 发送到 provider 的 token 端点。刷新后的值会保存回凭据存储。

Provider 凭据用于对网络请求进行认证；它们不应被放进对话中。在登录完成之前，请把授权 URL、回调 URL、设备码和粘贴的登录码都视为秘密。omp 会把 `/login <callback-or-code>` 命令排除在输入历史之外，但你的终端、剪贴板管理器、屏幕共享或 shell 历史仍可能泄露你在其他地方输入的秘密。

## 哪份凭据生效

对于某个 provider，omp 按以下顺序取第一个可用来源：

| 优先级 | 来源 | 实际效果 |
| --- | --- | --- |
| 1 | `omp --api-key …` | 对显式选定模型所属 provider 的一次性覆盖（`--api-key` 要求先选择模型）。在共享系统上应避免使用：命令行可能进入 shell 历史或进程列表。 |
| 2 | `models.yml` 中的 `providers.<name>.apiKey` | 显式 provider 覆盖，通常与自定义端点搭配使用。优先使用环境变量或 secret-manager 引用，而非字面密钥。 |
| 3 | 已存储的 OAuth 登录 | 自动刷新，优先于普通的环境密钥。 |
| 4 | 通过 `/login` 保存的 API key | 主动的交互式登录同样胜过 provider 环境变量。 |
| 5 | Provider 环境变量 | 例如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 或 `GEMINI_API_KEY`；确切名称因 provider 而异。 |
| 6 | 其他已存储的静态 API key | 主要是由 broker 工具导入或迁移的凭据。 |
| 7 | 自定义 provider 回退 | 为自定义 provider 配置的解析器。 |

也就是说，导出环境密钥**不会**替换掉现有的 `/login` 凭据。请先用 `/logout` 移除已存储的账户；如果那确实是你想要的，再使用显式的 `models.yml`/`--api-key` 覆盖。更改环境后请重启 omp。Provider 专属设置见 [环境变量](./env.md) 和 [自定义模型](../guide/custom-models.md)。

对于本地开发和 CI，provider 环境变量优于写在已检入文件中的字面密钥。请从 CI secret store 或密码管理器注入它，并确认项目文件、shell 历史、日志和导出的会话记录中都不包含它。

## 登出、吊销与轮换

运行 `/logout`，然后选择要移除的 provider 和已存储账户。带上 provider ID 时，omp 会直接打开该 provider 的账户选择器：

```
/logout anthropic
```

交互式 `/logout` 会移除**一条选定的已存储凭据**，当你有多个账户时这一点很重要。它不会移除环境变量、`models.yml` 覆盖或进程启动时传入的 `--api-key`。移除之后，omp 会报告任何剩余的认证来源；如果你打算完全登出，请移除该来源并重启。

删除本地记录并不等于在 provider 处吊销凭据。对于设备丢失或疑似泄露的情况：

1.   在 provider 的安全控制台中吊销 OAuth grant 或旧 API key。
2.   用 `/logout` 移除已存储的凭据。
3.   用 `/login` 创建或授权替代凭据（或更新环境变量/secret-manager 来源）。
4.   在 `/login` 中确认目标账户，并用所选模型发起一次请求。

对于例行的 API key 轮换：先创建替代密钥，更新来源，验证，然后吊销旧密钥。provider 已签发的 OAuth access token 在 provider 使其过期或吊销之前可能仍然有效。

## 用 auth broker 集中管理凭据

当若干台受信任的机器需要共享同一个凭据池，或 refresh token 应当保留在受控主机上时，请使用 auth broker。omp 默认使用本地 SQLite 存储；配置 broker 后，该进程的凭据存储会切换到 broker。

在 broker 主机上登录并启动仅限 loopback 的服务：

```
omp auth-broker login anthropic
omp auth-broker serve
```

默认绑定地址是 `127.0.0.1:8765`。需要时 `serve` 会创建一个 bearer token；在另一个 shell 中可以用以下命令打印它：

```
omp auth-broker token
```

对于远程 broker，只能通过私有网络或终止 TLS 的反向代理暴露它。broker 协议是 HTTP，本身不额外提供 TLS。不要把 `0.0.0.0:8765` 直接发布到互联网。

配置每个客户端，最好通过 secret injector：

```
export OMP_AUTH_BROKER_URL='https://auth.example.internal'
export OMP_AUTH_BROKER_TOKEN='…'
omp auth-broker status
omp
```

对应的配置键是当前 agent `config.yml` 中的 `auth.broker.url` 和 `auth.broker.token`。环境变量优先。如果只配置了 URL 而没有 token，启动会失败，而不是静默回退到本地凭据。也可以从配置根目录下的 `auth-broker.token` 文件读取 token。

当 TUI 客户端由 broker 支撑时，`/login` 会把新凭据上传到 broker，`/logout` 会禁用选定的 broker 凭据。如需更严格的边界，请在 broker 主机本身上完成 OAuth。如果主机可通过 SSH 访问，但它的 loopback 回调需要到达你本地浏览器，请运行：

```
omp auth-broker login anthropic --via=user@broker
```

`omp auth-broker login` 和 `omp auth-broker logout` 作用于运行该命令的主机上的本地凭据数据库；请在 broker 主机上使用它们进行 broker 管理。与 TUI 的一次一个账户选择器不同，`omp auth-broker logout <provider>` 会移除该 provider 的所有有效记录。

### Broker 数据与信任边界

Broker 客户端会收到 API key 和 OAuth **access** token，以便它们直接调用 provider。OAuth refresh token 保留在 broker 上，在快照中被替换为远程哨兵值。从客户端发起的登录仍然必须通过受保护连接，把新签发的凭据发送到 broker 一次。

客户端会在配置根目录的 `cache/auth-broker-snapshot.enc`（默认 `~/.omp/cache/auth-broker-snapshot.enc`）保留一份短期加密快照缓存。它的加密密钥由 broker bearer token 与 URL 派生而来。这本身可以保护被复制的缓存文件；能读取 bearer token 的进程也能解密缓存并查询 broker。

Broker bearer 是一种保险库管理员凭据：它可以读取可用凭据并修改存储。请把它排除在源代码管理和日志之外，只分发给受信任的客户端，并在泄露后轮换：

```
omp auth-broker token --regenerate
```

运行中的 broker 在启动时读取其允许的 token，因此在重新生成之后，请重启 broker 并更新每个客户端。健康端点无需认证；凭据端点要求 bearer。

## 在 provider 流量前放置 auth gateway

Broker 与受信任的 omp 客户端共享凭据；它不代理它们的模型请求。只有在不太受信任的客户端需要在拿不到 provider 凭据的情况下发出 OpenAI、Anthropic、Responses 或 pi 原生兼容请求时，才使用 `omp auth-gateway`。

网关需要一个已配置的 broker：

```
omp auth-gateway serve
omp auth-gateway token
```

它默认绑定 `127.0.0.1:4000`，并以 `0600` 权限将入站 bearer 存储在配置根目录的 `auth-gateway.token` 中。网关对客户端进行认证，通过 broker 解析 provider 凭据，并注入上游认证。客户端的入站 bearer 不会被转发为 provider 凭据。

这缩小的是秘密的分发范围，而非权限：任何持有网关 bearer 的人都可以消耗 provider 配额，并通过关联账户发送请求内容。网关操作者可以查看请求内容和响应。在远程暴露之前，请保留默认的 loopback 绑定，或添加私有网络、TLS、访问控制与日志等保护。`--no-auth` 允许每个能触达 socket 的进程通过，因此应仅限于有意信任的 loopback 环境。

用 `omp auth-gateway token --regenerate` 轮换网关 bearer，然后重启网关并更新其客户端。

## 故障排查

### `/login` 成功，但没有可用的模型

打开 `/login` 检查该 provider 的来源/状态，然后打开 `/model`。确认你登录的是目标模型所使用的 provider。如果你设置了环境变量，请从同一环境启动 omp，并使用该 provider 支持的确切变量。

### 环境密钥被忽略

运行时覆盖、`models.yml` API key、已存储的 OAuth 登录或通过 `/login` 保存的 API key 都优先于环境。`/logout <provider>` 会显示已存储的账户；移除它们之后，还要检查自定义模型配置以及 omp 的启动方式。

### `/logout` 未能完全登出

你可能还有另一个已存储账户或非存储来源。对其余账户重复执行 `/logout`。在来源处移除 provider 环境变量或配置覆盖，并在不带 `--api-key` 的情况下重启。登出后的消息会在存在剩余来源时指出来。

### 浏览器回调无法完成

请使用 omp 显示的完整授权 URL；不要复制被视觉截断的片段。如果 omp 报告它的回调端口被占用，请停止占用该端口的其他进程并重试。在远程或无头系统上，请遵循对话框中显示的 provider 专属设备/粘贴说明；对于远程 broker，当该 provider 使用 loopback 回调时，用 `auth-broker login --via=user@host`。

### Broker 启动或请求失败

在客户端运行 `omp auth-broker status`。检查解析出的 URL、TLS/私有网络可达性，以及客户端 bearer 是否与运行中的 broker 匹配。已配置的 broker 会替代本地认证，而不是回退到 `agent.db`；缺少 token 属于配置错误。重新生成 token 后，请重启 broker 并更新所有客户端。

### 凭据文件权限过宽

在修复或移动其 SQLite 文件之前，先停止 omp。把 agent 目录限制为仅你的账户可访问，把数据库、WAL、SHM、broker-token、gateway-token 和加密缓存文件限制为仅属主可访问。同时修复备份和 secret-manager 导出文件的权限；只修改当前数据库并不能清除已泄露的副本。

## 相关

*   [Providers](../guide/providers.md) — 支持的登录方式及 provider 专属的环境变量。
*   [环境变量](./env.md) — 凭据与 broker 的环境设置。
*   [自定义模型](../guide/custom-models.md) — 自定义端点与 `models.yml` 中的 provider 覆盖。
*   [MCP](../guide/mcp.md) — MCP OAuth 凭据使用相同的底层凭据存储和 broker 刷新路径。
