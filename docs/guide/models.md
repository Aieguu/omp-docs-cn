# 模型与 Provider

omp 的模型系统由内置模型目录、自定义 `models.yml`、运行时发现、认证存储、Provider 兼容层和角色路由共同组成。

::: warning 术语校正
`/model` 是模型选择器入口，可选择模型并调整角色分配；会话内按角色/模型循环切换当前主模型的是 `Ctrl+P`。`Alt+P` 是临时模型选择，不写回角色配置。
:::

## Provider 分类

上游 README 将 Provider 大致分为三类。

### Frontier APIs / 网关

Anthropic、OpenAI、OpenAI Codex、Google Gemini、Google Antigravity、xAI、Mistral、Groq、Cerebras、Fireworks、Together、Hugging Face、NVIDIA、OpenRouter、Synthetic、Vercel AI Gateway、Cloudflare AI Gateway、Perplexity 等。

### Coding plans

Cursor、GitHub Copilot、GitLab Duo、Kimi Code、Moonshot、MiniMax Coding Plan、Alibaba Coding Plan、Qwen Portal、Z.AI / GLM、Xiaomi MiMo、Qianfan、NanoGPT、Venice、Kilo、ZenMux、OpenCode Go / Zen 等。

### 本地 / 自托管

Ollama、Ollama Cloud、LM Studio、llama.cpp、vLLM、LiteLLM。

## `models.yml`

默认路径：

```text
~/.omp/agent/models.yml
```

基本结构：

```yaml
providers:
  <provider-id>:
    baseUrl: https://api.example.com/v1
    apiKey: MY_PROVIDER_API_KEY
    api: openai-completions
    headers:
      X-Team: platform
    authHeader: true
    models:
      - id: some-model-id
        name: Some Model
        contextWindow: 128000
        maxTokens: 16384

equivalence:
  overrides:
    my-provider/codex: gpt-5.3-codex
  exclude:
    - demo/codex-preview
```

## 支持的 API 类型

`api` 可选值：

- `openai-completions`
- `openai-responses`
- `openai-codex-responses`
- `azure-openai-responses`
- `anthropic-messages`
- `google-generative-ai`
- `google-vertex`

## 认证解析顺序

请求某个 Provider 的 key 时，顺序为：

1. CLI runtime override，例如 `--api-key`。
2. `agent.db` 中保存的 API key。
3. `agent.db` 中保存的 OAuth credential，必要时 refresh。
4. 环境变量，如 `OPENAI_API_KEY`、`ANTHROPIC_API_KEY`。
5. `models.yml` 中的 `apiKey`。

`models.yml` 的 `apiKey` 先被当成环境变量名解析；如果环境变量不存在，就当字面 token 使用。

## `/login` 登录

交互式 TUI 中可以使用：

```text
/login
/login anthropic
/login openai
/login github-copilot
/logout anthropic
```

官方文档说明：

- `/login` 无参数时打开 Provider 选择器。
- 支持 OAuth 的 Provider 会走浏览器或 device-code 流程。
- 不支持 OAuth 的 Provider 通常会提示粘贴 API key。
- `/login` 是追加凭据，不会自动覆盖其他 Provider。
- `/logout <provider>` 清除指定 Provider 凭据。
- 凭据保存在 `~/.omp/agent/agent.db`。
- 同一 Provider 中，保存的 API key 通常优先于 OAuth token。

常见 `/login` id：

| Provider | `/login` id | 说明 |
| --- | --- | --- |
| Anthropic Pro / Max | `anthropic` | 浏览器登录；取消时可回退到 key prompt。 |
| OpenAI Codex | `openai` | ChatGPT 账号流。 |
| GitHub Copilot | `github-copilot` | GitHub device-code 流。 |
| Gemini CLI | `gemini` | Google 账号流，复用 gemini CLI 凭据。 |
| Z.AI | `zai` | 通过 `/login zai` 粘贴 key。 |
| Cursor | `cursor` | Cursor 账号流。 |

## 自定义 OpenAI-compatible Provider

本地无认证服务：

```yaml
providers:
  local-openai:
    baseUrl: http://127.0.0.1:8000/v1
    auth: none
    api: openai-completions
    models:
      - id: Qwen/Qwen2.5-Coder-32B-Instruct
        name: Qwen 2.5 Coder 32B (local)
```

带环境变量 key 的代理：

```yaml
providers:
  anthropic-proxy:
    baseUrl: https://proxy.example.com/anthropic
    apiKey: ANTHROPIC_PROXY_API_KEY
    api: anthropic-messages
    authHeader: true
    disableStrictTools: true
    models:
      - id: claude-sonnet-4-20250514
        name: Claude Sonnet 4 (Proxy)
        reasoning: true
        input: [text, image]
```

## 本地模型发现

如果没有显式配置，registry 会隐式加入：

| Provider | 默认地址 | API |
| --- | --- | --- |
| `ollama` | `OLLAMA_BASE_URL` 或 `http://127.0.0.1:11434` | `openai-responses` |
| `llama.cpp` | `LLAMA_CPP_BASE_URL` 或 `http://127.0.0.1:8080` | `openai-responses` |
| `lm-studio` | `LM_STUDIO_BASE_URL` 或 `http://127.0.0.1:1234/v1` | `openai-completions` |

这些本地 Provider 默认 keyless。

## Canonical model equivalence

同一个上游模型可能通过多个 Provider 暴露。omp 会保留具体 Provider 模型，同时建立 canonical 层，例如：

```text
openai-codex/gpt-5.3-codex
zenmux/codex
p-codex/codex
=> canonical: gpt-5.3-codex
```

解析优先级：

1. 精确 `provider/modelId`：绕过 coalescing。
2. 精确 canonical id：从 canonical index 选择可用 Provider。
3. 精确裸 model id。
4. fuzzy / glob。

Provider 选择会考虑：

1. Provider 是否可用且认证可解析。
2. `modelProviderOrder`。
3. registry / Provider 默认顺序。

## 模型角色

官方文档将默认角色称为 `main`；实现和配置中也常见历史键 `default`。可以把它们理解为同一个“主模型槽位”。常用角色：

```text
main/default, smol, slow, plan, vision, designer, commit, task
```

配置示例：

```yaml
modelRoles:
  default: claude-sonnet-4-5
  smol: gpt-5.3-codex-spark:minimal
  slow: claude-opus-4-6:high
```

角色值可以是：

- `provider/modelId`
- canonical id
- 带 thinking suffix 的选择器：`:off|minimal|low|medium|high|xhigh`

## 会话内切换：`Ctrl+P`

官方 roles 文档中，`Ctrl+P` 会按配置的循环列表切换当前主模型。默认可理解为在 `slow -> main/default -> smol` 之间轮转；`Shift+Ctrl+P` 反向轮转。

可以通过 CLI 限定循环范围：

```sh
omp --models "github-copilot/*,*sonnet*"
```

`Alt+P` 会打开一次性模型选择器，只影响当前会话，不写回 `modelRoles`。

`/model` 则用于打开模型选择器；在非 TUI 路径中 `/model <id>` 也可以直接设置模型。

## Context promotion

当小上下文模型（如 `*-spark`）触发上下文长度错误时，omp 会先尝试 promotion：

1. 检查当前模型是否有 `contextPromotionTarget`。
2. 否则寻找同 Provider / API 下更大上下文模型。
3. 切换后重试当前 turn。
4. 若不可用，再 fallback 到 auto-compaction。

显式配置：

```yaml
providers:
  openai-codex:
    modelOverrides:
      gpt-5.3-codex-spark:
        contextPromotionTarget: openai-codex/gpt-5.3-codex
```

## 兼容层 `compat`

OpenAI-compatible endpoint 差异很大，`compat` 用于覆盖自动探测：

```yaml
providers:
  my-gateway:
    baseUrl: https://gateway.example.com/v1
    apiKey: MY_GATEWAY_KEY
    api: openai-completions
    compat:
      supportsDeveloperRole: true
      supportsReasoningEffort: true
      supportsStrictMode: false
      maxTokensField: max_completion_tokens
      extraBody:
        gateway: m1-01
```

常用 knobs：

- `supportsStore`
- `supportsDeveloperRole`
- `supportsUsageInStreaming`
- `maxTokensField`
- `supportsToolChoice`
- `supportsReasoningEffort`
- `thinkingFormat`
- `reasoningContentField`
- `requiresToolResultName`
- `supportsStrictMode`
- `openRouterRouting`
- `vercelGatewayRouting`

## Broker / Gateway

设置 `OMP_AUTH_BROKER_URL` 或 `auth.broker.url` 后，本地 SQLite credential store 会被远端 broker snapshot 替代。refresh token 留在 broker host，客户端到期时调用 broker refresh endpoint。

适合团队统一管理 OAuth / API key，避免每台机器各自保存敏感凭据。
