# Provider 认证与管理

## 三种认证方式

选择最适合当前场景的方式。后设置的内容会覆盖该 Provider 之前的配置。

| 方式 | 适用场景 | 示例 |
| --- | --- | --- |
| 环境变量 | 脚本、CI、首次冒烟测试。无需磁盘配置。 | `ANTHROPIC_API_KEY=sk-ant-… omp` |
| `/login` | 交互式。当 Provider 支持 OAuth 时自动完成授权流程，否则提示输入密钥。存储在 `~/.omp/agent/agent.db` 中。 | `/login anthropic` |
| `config.yml` / `models.yml` | 声明式。为每个 Provider 指定密钥（或环境变量名称），无需交互步骤即可就绪。 | `apiKey: MYCO_API_KEY` |

`/login` 是追加操作——不会替换已有凭据。`/logout <provider>` 可清除凭据。完整的 `/login` 用法请参阅 [Slash 命令](./slash-commands.md)，各 Provider 对应的 API 密钥环境变量请参阅 [环境变量](../reference/env.md)。

## 支持 OAuth 的 Provider

这些 Provider 允许你使用已有账户登录，而无需手动粘贴原始密钥。`/login <provider>` 启动授权流程；刷新后的 token 存储在 `agent.db` 中，并在每次调用前自动轮换。

| Provider | `/login` ID | 备注 |
| --- | --- | --- |
| Anthropic (Pro / Max) | `anthropic` | 通过 console.anthropic.com 进行浏览器授权。取消时回退到密钥输入。 |
| OpenAI Codex | `openai` | ChatGPT 账户授权流程。带用量感知的轮换机制，会在密钥接近 5 小时或每周上限时跳过。 |
| GitHub Copilot | `github-copilot` | 通过 github.com 或企业主机进行设备码授权。成功后自动启用完整 Copilot 模型目录（Claude、GPT、Gemini、Grok）。 |
| Gemini CLI | `gemini` | Google 账户授权流程；与 gemini CLI 共用同一凭据。 |
| Z.AI | `zai` | 仅支持密钥粘贴——无浏览器授权流程。此处列出是因为 `/login zai` 是官方推荐的入口。 |
| Cursor | `cursor` | 通过 cursor.com 进行浏览器授权。 |

其他所有 Provider 均使用 API 密钥认证——通过对应的 `*_API_KEY` 环境变量，或通过 `/login` 提示输入密钥。

## 凭据解析顺序

当 omp 需要某个 Provider 的凭据时，按以下顺序查找并返回第一个匹配项：

1. omp 进程的 `--api-key` 运行时覆盖参数。
2. `agent.db` 中存储的 API 密钥。同一 Provider 存储多个密钥时，调用会以轮询方式分配。
3. `agent.db` 中存储的 OAuth 凭据，在每次调用前按需刷新。
4. Provider 环境变量（`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY`、`ZAI_API_KEY` 等）。
5. `models.yml` 中的 `apiKey:` 字段。首先作为环境变量名查找，未匹配则视为字面 token。

> 当同一 Provider 同时存在 API 密钥和 OAuth 凭据时，API 密钥优先。设置 `ANTHROPIC_OAUTH_TOKEN` 可强制 OAuth 优先。

完整的环境变量清单请参阅 [环境变量](../reference/env.md)。全局和项目配置文件的位置请参阅 [设置](./settings.md)。

## 远程凭据库（Auth Broker）

多机环境可共享同一套凭据，无需在每台机器上分别执行 `/login`。启动 Broker：

```
omp auth-broker serve --bind 127.0.0.1:7700
omp auth-broker token issue --label laptop   # 输出一个 bearer token
omp auth-broker import --from-local          # 从 agent.db 一次性迁移
```

通过 `OMP_AUTH_BROKER_URL` + `OMP_AUTH_BROKER_TOKEN`（或 `config.yml` 中对应的 `auth.broker.*` 配置项）将客户端指向 Broker。在 Broker 模式下，`/login`、`/logout` 和 OAuth 刷新均通过远程凭据库代理；本地 `agent.db` 保持为空。客户端对每个凭据维护 5 分钟的带抖动使用缓存和最后已知可用回退，并在 `/v1/usage` 前设置 15 秒的单次请求保护，确保短暂异常不会导致调用失败。

对于需要原始 Provider 线协议的工具（CLI、脚本、第三方 Agent），可配合 `omp auth-gateway serve` 使用——一个正向代理，会将 Broker 解析的凭据注入 OpenAI Chat、Anthropic Messages 和 OpenAI Responses 请求。将这些客户端指向网关的基础 URL 并使用网关 bearer token；网关在每次请求时回调 Broker，因此凭据轮换和 `/v1/usage` 计费保持集中管理。

## 会话中切换 Provider

`/model` 打开模型选择器，范围限定为你已登录的 Provider。`/model <id>` 可直接设置模型而无需 UI。切换不会登出之前的 Provider；它仍然准备好为后续针对它的调用服务。

```
> /model
? Pick a model: anthropic/claude-sonnet-4-6
> /model openai/gpt-5.3-codex:high
```

要在单条命令中绑定 Provider，可在启动行使用 `--provider` 和 `--model`：

```
omp --provider openai --model gpt-5.3-codex:high
```

请参阅 [模型角色](./roles.md) 了解如何为不同类型的工作分配不同 Provider，参阅 [自定义模型与 Provider](./custom-models.md) 了解如何添加自定义 Provider。
