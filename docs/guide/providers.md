# Provider

## 选择适合你的路线

Provider 指账户或后端，例如 `anthropic`、`openai-codex` 或 `ollama`。模型以 `provider/model-id` 的形式选择。

对大多数人来说，最短路径是：

1. 启动 `omp`。
2. 运行 `/model`。
3. 选择一个 Provider。没有凭据的 Provider 会显示为 **not configured（未配置）**；选中一个并按回车，若有可用流程就会启动它的登录流程。
4. 登录完成后选择模型。

如果你已经清楚想如何认证，可直接使用此表：

| 路线 | 最适合 | 第一步 |
| --- | --- | --- |
| OAuth 或账户登录 | 浏览器、设备码与托管账户流程 | 在 omp 中运行 `/login`，或用 `/login openai-codex` 直接跳转到某个 Provider |
| 编码订阅 | ChatGPT Plus/Pro、Claude Pro/Max、Copilot 及其他受支持的套餐 | 使用套餐的 Provider ID，而不是厂商 API 的 Provider ID |
| API 密钥 | 按量计费 API、CI 与非交互式 shell | 导出 Provider 的环境变量，然后启动 omp |
| 本地引擎 | 使用 Ollama、llama.cpp 或 LM Studio 的私有或离线推理 | 启动引擎；omp 无需登录即可发现它 |
| 自定义端点 | 团队网关、自托管 API 与未内置的 Provider | 将端点添加到 `~/.omp/agent/models.yml` |

账户订阅与开发者 API 往往是相互独立的产品。例如，ChatGPT 凭据使用 `openai-codex`；`openai` 则期望使用 `OPENAI_API_KEY`。Google 和 xAI 也有类似的区分。在猜测某个 ID 之前，请参见[各 Provider 的注意事项](./providers.md)。

## 先跑通一条路线

### 使用 OAuth 或订阅登录

在交互式会话中：

```
/login openai-codex
```

按照 omp 显示的浏览器、设备码或粘贴码说明操作。对于远程终端，流程可能要求你把最终的跳转 URL 或代码以 `/login <value>` 的形式粘贴回来。当某个 Provider 支持多个账户或工作区时，再次运行 `/login <provider>` 即可添加另一个账户；omp 可以轮换托管账户。

然后验证并选择一个具体模型：

```
omp models openai-codex
omp --model openai-codex/gpt-5.5
```

`omp models <provider>` 只打印当前此安装可用的模型。如果示例模型已变化，请从该输出中复制选择器。在已有会话中，请改运行 `/model` 或 `/model provider/model-id`。

用 `/logout` 选择要移除的凭据，或用 `/logout <provider>` 直接打开该 Provider。

### 使用 API 密钥

对于一次性启动或 CI 任务，把密钥放进进程环境：

```
OPENAI_API_KEY=sk-... omp --model openai/gpt-5.5
```

进行交互式设置时，许多基于密钥的 Provider 也会出现在 `/login` 中；omp 会打开该 Provider 的密钥页面，索取密钥、验证并存储该凭据。没有登录入口的 Provider 则使用其环境变量。

要持久化环境变量而不把它加进 shell 启动文件，可以让 omp 加载 `.env` 文件。已导出的进程值优先，其次依次是：

1. `<当前目录>/.env`
2. `~/.omp/agent/.env`
3. `~/.omp/.env`
4. `~/.env`

不要提交含密钥的项目 `.env`。每个 Provider 的密钥名称及完整的 `.env` 规则见[环境变量](../reference/env.md)。

在开始长任务前先验证该路线：

```
omp models openai
omp --model openai/gpt-5.5 "Reply with the model provider and model ID you are using."
```

### 使用本地引擎

omp 会自动探测以下本地 Provider：

| Provider ID | 默认端点 | 覆盖设置 |
| --- | --- | --- |
| `ollama` | `http://127.0.0.1:11434` | `OLLAMA_BASE_URL`，其次 `OLLAMA_HOST` |
| `llama.cpp` | `http://127.0.0.1:8080` | `LLAMA_CPP_BASE_URL` |
| `lm-studio` | `http://127.0.0.1:1234/v1` | `LM_STUDIO_BASE_URL` |

先启动引擎并在其中加载模型。默认的无密钥端点无需登录或配置文件。然后询问 omp 发现了什么：

```
omp models ollama
```

从输出中复制一个选择器：

```
omp --model ollama/model-id
```

如果引擎在另一台机器上，请设置它的 base-URL 环境变量。在 `models.yml` 中显式配置了同一 ID 的 Provider 会取代自动发现。`vllm` 也是内置的 Provider 路线，但当它并非以免认证的本地端点暴露时，需要先配置或认证它。

### 添加自定义 Provider

对 OpenAI 兼容、Anthropic 兼容或其他受支持的公共端点，使用 `~/.omp/agent/models.yml`。下面这个最小示例从 `MY_GATEWAY_API_KEY` 读取密钥：

```
providers:
  my-gateway:
    baseUrl: https://gateway.example.com/v1
    api: openai-completions
    apiKey: MY_GATEWAY_API_KEY
    models:
      - id: fast-chat
        name: Fast Chat
        contextWindow: 128000
        maxTokens: 8192
```

设置密钥并验证已加载的条目：

```
export MY_GATEWAY_API_KEY=...
omp models my-gateway
omp --model my-gateway/fast-chat
```

`apiKey` 优先作为环境变量名称解析，否则按字面文本处理。建议使用环境变量名称，这样密钥就不会留在文件中。对真正无密钥的端点，请用 `auth: none` 代替 `apiKey`。

其他线上协议 API、模型发现、请求头、密钥命令、兼容性选项及模型覆盖见[自定义模型与 Provider](./custom-models.md)。

## 模型如何变为可用

启动时，omp 按以下顺序组装模型注册表：

1. 内置 Provider 与已知模型；
2. 来自 `~/.omp/agent/models.yml` 或 `models.yaml` 的 Provider 覆盖与自定义模型；
3. 对受支持的 Provider 和本地引擎进行缓存或实时发现；
4. 由已加载扩展注册的 Provider 和模型。

与内置条目具有相同 `provider` 和 `id` 的自定义模型会替换内置条目。运行时发现可以更新某 Provider 暴露的模型；之后会重新应用模型覆盖。

模型仅在以下情况才可选择：

*   其 Provider 不在生效的 `disabledProviders` 列表中；且
*   该 Provider 无密钥，或拥有 omp 可解析的凭据。

有用的检查命令：

```
omp models                    # all currently available models
omp models find sonnet        # search provider, ID, selector, or display name
omp models refresh            # force fresh online discovery, then list
```

在 TUI 内，`/model` 会列出可用模型，并把没有凭据的目录 Provider 显示为锁定。选择可登录的锁定 Provider 会启动它的设置。被禁用的 Provider 会被省略。

对于初始选择，显式的 `--model` 优先。没有它时，omp 会依次考虑当前生效的模型作用域、已保存的默认值、已知的 Provider 默认值，最后是第一个可用模型。当同一模型 ID 存在于多条路线时，建议使用精确的 `provider/model-id`；裸 ID 和模糊的 `--model` 模式取决于可用目录及所配置的 Provider 顺序。持久化默认值及针对任务的模型选择见[模型角色](./roles.md)。

## 凭据优先级

当同一 Provider 存在多个凭据时，omp 使用第一个适用的来源：

1. 本进程的运行时 `--api-key`；
2. `models.yml` 中的 `providers.<id>.apiKey`；
3. 已存储的 OAuth 凭据（必要时刷新）；
4. 由 `/login` 存储的 API 密钥；
5. Provider 的环境变量（包括从 `.env` 加载的值）；
6. 其他已存储的 API 密钥，例如 broker 迁移的密钥；
7. 自定义 Provider 的回退解析器。

这意味着已存储的 OAuth 登录通常优先于环境中的 `ANTHROPIC_API_KEY`，而在 `models.yml` 中显式固定的密钥优先于 OAuth。当你想同时保留账户访问与 API 访问时，请保持 Provider ID 相互独立。

本地凭据通常存放在 `~/.omp/agent/agent.db` 中。配置了 auth broker 后，登录、登出、刷新与凭据读取都会改用远程存储。存储方式、多账户、auth broker 及 Provider 兼容的认证网关见[密钥与认证](../reference/secrets.md)。

## 当前 Provider 一览

实时目录是权威来源：完成认证后运行 `omp models`。下面的分组涵盖当前内置的模型 Provider ID 及常规设置路线。

| 路线 | Provider ID | 常规设置 |
| --- | --- | --- |
| 主流模型 API | `anthropic`、`openai`、`google`、`groq`、`mistral`、`xai`、`deepseek`、`openrouter` | API 密钥；`anthropic`、`xai`、`deepseek` 和 `openrouter` 还提供引导式 `/login` 设置 |
| 账户与订阅访问 | `openai-codex`、`github-copilot`、`cursor`、`google-antigravity`、`google-gemini-cli`、`kimi-code`、`xai-oauth`、`devin`、`firepass`、`ollama-cloud` | `/login <provider>` |
| 编码套餐与区域门户 | `aiand`、`alibaba-coding-plan`、`alibaba-token-plan`、`minimax-code`、`minimax-code-cn`、`qwen-portal`、`umans`、`xiaomi`、`xiaomi-token-plan-ams`、`xiaomi-token-plan-cn`、`xiaomi-token-plan-sgp`、`zai`、`zhipu-coding-plan` | `/login <provider>`；该流程要么登录，要么验证粘贴的套餐密钥 |
| Git 托管的助手 | `gitlab-duo`、`gitlab-duo-agent` | `/login <provider>` 或 `GITLAB_TOKEN`；GitHub Copilot 列在上面的订阅中 |
| 托管推理 API | `aimlapi`、`baseten`、`cerebras`、`coreweave`、`fireworks`、`gmi-cloud`、`huggingface`、`meta`、`minimax`、`moonshot`、`nanogpt`、`nvidia`、`novita`、`qianfan`、`sakana`、`siliconflow`、`siliconflow-cn`、`synthetic`、`together`、`venice`、`wafer-serverless` | Provider API 密钥；大多数还支持引导式 `/login` 密钥录入 |
| 网关与聚合器 | `cloudflare-ai-gateway`、`kilo`、`litellm`、`opencode-go`、`opencode-zen`、`vercel-ai-gateway`、`zenmux` | 网关密钥，以及按需的 base URL 或账户/团队设置 |
| 云身份路线 | `amazon-bedrock`、`bedrock-mantle`、`azure`、`google-vertex` | 云特定的凭据及区域/项目/端点配置 |
| 本地与自托管引擎 | `ollama`、`llama.cpp`、`lm-studio`、`vllm` | 启动端点；仅当端点要求时才进行认证 |

精确的环境变量名称有意统一集中在[环境变量](../reference/env.md)，因为有些 Provider 接受多个凭据来源。

## 各 Provider 的注意事项

| Provider 或系列 | 需要了解的内容 |
| --- | --- |
| OpenAI | `openai-codex` 是 ChatGPT 订阅访问。`openai` 是开发者 API，使用 `OPENAI_API_KEY`。要进行无界面（headless）的 Codex 登录，请选择 `openai-codex-device`；它会为 `openai-codex` 存储登录结果。 |
| Anthropic | `anthropic` 路线支持 Claude Pro/Max OAuth 与 API 密钥。重复登录可添加独立的组织或订阅工作区。固定在 `models.yml` 中的密钥会覆盖已存储的 OAuth。Foundry 部署有独立的企业凭据设置。 |
| Google | `google` 使用 `GEMINI_API_KEY`；`google-gemini-cli` 与 `google-antigravity` 使用账户登录；`google-vertex` 使用 Google Cloud 的项目/位置凭据。这些 ID 不可互换。 |
| xAI | `xai` 是付费的 API 密钥路线。`xai-oauth` 是 SuperGrok 或 X Premium+ 账户路线。 |
| GitHub Copilot | 登录使用 GitHub 的设备流程。企业用户必须向预期的 Enterprise 主机进行认证；该主机与 API 端点会随凭据一同保存。 |
| GitLab Duo | `gitlab-duo` 是不带代理功能的常规路线；`gitlab-duo-agent` 是 Duo Agent 路线。两者都可使用 `GITLAB_TOKEN`，但其模型目录与请求路径不同。 |
| Z.AI | `/login zai` 验证编码套餐的 API 密钥。单独的登录选项 `zai-coding-plan` 会把它生成的凭据存储在模型 Provider `zai` 名下，因此模型选择器仍以 `zai/` 开头。 |
| Azure OpenAI | 如果 omp 无法推断你的部署端点，仅凭密钥是不够的。请按照[自定义模型与 Provider](./custom-models.md)中描述的 Azure 端点/部署路线进行配置。 |
| Google Vertex | Application Default Credentials 需要项目与位置。在云身份可用之前，目录中可能已存在条目，因此请用 `omp models google-vertex` 验证。 |
| Amazon Bedrock | Bedrock 使用 AWS 凭据链与区域，而非普通的 bearer 密钥。`bedrock-mantle` 是独立的 bearer 令牌路线。 |
| 网关 | 当网关有内置发现时，使用该网关的 Provider ID。对于私有网关或非标准 URL，请使用 `models.yml`；其中配置的 `apiKey` 会刻意覆盖任何已存储的上游 OAuth 令牌。 |
| 本地引擎 | 当同一 Provider ID 被显式配置或禁用时，会跳过自动发现。引擎必须已经在运行，并且至少暴露一个模型。 |

## 故障排查

**Provider 处于锁定状态，或未出现在 `omp models` 中。** 先检查它的凭据，再检查它是否被禁用：

```
omp config get disabledProviders
```

即使凭据有效，被禁用的 Provider 仍保持不可用。项目设置可以替换全局的 `disabledProviders` 数组；见[设置](./settings.md)。

**登录成功但模型列表已过时。** 运行 `omp models refresh`，然后重新列出该 Provider。动态目录可能因账户、工作区、区域或套餐而异。

**用错了账户或密钥。** 将你的来源与上面的凭据顺序对比。查找固定在 `models.yml` 中的密钥、已存储的 OAuth 账户、导出的变量以及四个 `.env` 位置。用 `/logout <provider>` 移除托管账户。

**自定义 Provider 被跳过。** 运行 `omp models`；验证错误会在列表之前打印。带显式模型的 Provider 需要 `baseUrl`、`api` 值及 `apiKey`，除非它声明了 `auth: none`。

**本地 Provider 不返回任何模型。** 确认引擎正在生效的 base URL 上监听且已加载模型，然后运行 `omp models refresh`。空的或无法访问的本地端点仍然不可用。
