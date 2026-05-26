# 凭据与密钥管理

omp 将所有 provider 凭据——OAuth 刷新令牌、OAuth 访问令牌、已存储的 API key——保存在一个本地 SQLite 文件中。`/login` 写入该文件，`/logout` 清除其中的条目，provider 调用则从中读取。当你需要在多台主机上使用相同的登录凭据时，只需将本地文件替换为远端 broker，无需修改其他配置。

## 凭据存储

凭据保存在 `~/.omp/agent/agent.db`（或 `PI_CONFIG_DIR` 下的等效路径）。每个凭据占一行，每个 provider 允许多条凭据——调用时会轮询选择。

每行存储三项内容：provider id（`anthropic`、`openai-codex`、`google-gemini-cli` 等）、凭据类型（OAuth 或 API key）和密钥载荷。OAuth 行同时包含长期 `refresh` token 和短期 `access` token；当 access token 距离过期不足五分钟时会自动在进程内刷新。API key 行存储原始密钥。

像保护 `~/.ssh/id_*` 一样保护该文件：文件系统权限是防止攻击者读取你的 home 目录后获取 token 的唯一屏障。如果你对此感到担忧，可以通过 [auth broker](#跨机器共享凭据) 将凭据完全移出机器——这样笔记本上就不存储任何刷新令牌。

## 登录与登出

在 omp 内：

- `/login` 打开 provider 选择器。选择一个 provider，在浏览器中完成 OAuth 流程，生成的 token 会被追加到 `agent.db`。在提示时粘贴 API key 对非 OAuth provider 同样有效。
- `/logout <provider>` 删除该 provider 的所有凭据行。用于撤销某个账户而不影响其他账户。
- 要轮换凭据，先 `/logout` 再 `/login`。不支持原地轮换——新 token 会替换旧行。

OAuth 流程会为每个 provider 绑定一个本地回调端口，以便浏览器将授权码传回 omp。默认端口：Anthropic `54545`、OpenAI Codex `1455`、Google Gemini CLI `8085`、Google Antigravity `51121`、GitLab Duo `8080`。如果端口被占用，请先关闭占用该端口的进程再重新运行 `/login`。

选择器同时也是检查界面：它会显示 `agent.db` 中至少有一条记录的所有 provider，因此只需看一眼 `/login` 就能知道当前已登录了哪些。支持 OAuth 的 provider 矩阵详见 [Providers](../guide/providers.md)。

## API key 与存储凭据的优先级

当 omp 需要某个 provider 的凭据时，按以下顺序查找并返回第一个命中项：

1. omp 命令行上的 `--api-key`。
2. `agent.db` 中存储的 API key 行。
3. `agent.db` 中存储的 OAuth 行（过期时自动刷新）。
4. Provider 环境变量（`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY` 等）。

环境变量是回退而非覆盖——对同一 provider，已存储的凭据始终优先于环境变量。要强制环境变量优先，请先 `/logout <provider>`。完整的环境变量清单见 [环境变量](./env.md)。

存在一个细粒度覆盖机制：`models.yml` 中的 `apiKey` 会覆盖存储的 OAuth token，但不会覆盖运行时的 `--api-key`。这是"我想让某个模型配置使用特定密钥，同时保持 OAuth 登录不变"的逃生舱口。

## 跨机器共享凭据

`omp auth-broker serve` 可将一台主机变成凭据保险库，其他机器通过 HTTP 查询。broker 是刷新令牌的唯一写入方；客户端接收的快照中刷新令牌被替换为哨兵值，当 access token 过期时再回调 broker。

```
# 在 broker 主机上
omp auth-broker serve --bind=0.0.0.0:8765
omp auth-broker login anthropic     # 在此运行 OAuth 流程
omp auth-broker token --json        # 为客户端生成 bearer token
```

通过 `OMP_AUTH_BROKER_URL` 和 `OMP_AUTH_BROKER_TOKEN`（或 `config.yml` 中对应的 `auth.broker.url` / `auth.broker.token` 键）将客户端指向 broker。设置后，omp 会完全绕过本地 `agent.db`，通过 broker 解析所有凭据。`/login` 和 `/logout` 也会通过代理操作，日常使用体验不变。

`omp auth-broker login <provider> --via=user@host` 是为没有浏览器的 broker 主机上的笔记本准备的技巧：它会打开 SSH 隧道，使 OAuth 回调到达本地浏览器，而凭据写入 broker 的 `agent.db`。其他实用子命令：`omp auth-broker logout <provider>`、`omp auth-broker status`、`omp auth-broker token --regenerate` 用于轮换 bearer。

客户端与 broker 之间的传输安全由你负责——在反向代理处终止 TLS，或将 broker 放在 Tailscale / WireGuard 之后。broker 在除 `/v1/healthz` 以外的所有端点强制要求 bearer token。

## 通过网关路由 provider 调用

broker 仅解析凭据，不代理 provider 流量。对于使用原始 OpenAI Chat、Anthropic Messages 或 OpenAI Responses 线路格式的客户端——第三方 CLI、脚本、IDE 插件、容器化的 omp——可配合 `omp auth-gateway serve` 使用。网关在 `127.0.0.1:4000`（默认）接受请求，去除入站 `Authorization` 头，向 broker 查询请求模型的正确凭据，然后将字节流转发到上游并注入解析后的 access token。

网关本身是 broker 客户端，因此继承 `OMP_AUTH_BROKER_URL` 和 `OMP_AUTH_BROKER_TOKEN`。其自身的入站 bearer token 保存在 `~/.omp/auth-gateway.token`（权限 `0600`）；`--no-auth` 可禁用该检查以仅用于回环场景。客户端永远不会看到 provider token，凭据轮换始终通过单一 broker 流转。

## 相关链接

- [Providers](../guide/providers.md) — 支持 OAuth 的 provider 列表和完整的凭据解析顺序。
- [环境变量](./env.md) — omp 读取的所有 `OMP_*` 和 provider `*_API_KEY` 变量。
- [MCP](../guide/mcp.md) — MCP 服务器复用同一 `agent.db` 存储 OAuth 凭据。
