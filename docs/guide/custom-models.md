# 自定义模型与 Provider

## 连接 omp 尚不认识的模型

当你的模型运行在私有 URL、位于公司网关之后，或使用 omp 未列出的 id 时，请使用自定义 Provider。你可以自行声明确切的模型，也可以让 omp 发现服务器暴露出的模型。

进行本地推理时，你通常**不需要**这个文件。omp 会自动查找位于 `http://127.0.0.1:11434` 的 Ollama、位于 `http://127.0.0.1:8080` 的 llama.cpp，以及位于 `http://127.0.0.1:1234/v1` 的 LM Studio。启动服务器并打开 `/model`；如果其中的模型已经出现，选一个即可，不必继续。

否则，创建 `~/.omp/agent/models.yml`。对于实现了 OpenAI Chat Completions 的免认证服务器，这是最小且有效的配置：

```
providers:
  local-openai:
    baseUrl: http://127.0.0.1:8000/v1
    api: openai-completions
    auth: none
    models:
      - id: Qwen/Qwen2.5-Coder-32B-Instruct
```

Provider id `local-openai` 由你自己决定。模型 `id` 必须是服务器接受的确切 id。如果服务器实现的是 `/v1/responses` 而不是 `/v1/chat/completions`，请改用 `openai-responses`。

对于新声明的模型，被省略的元数据默认值为：以 id 作为显示名称、仅支持文本输入、无可配置的 reasoning、128,000 token 的上下文窗口、16,384 token 的输出上限以及零成本。这些默认值让最小条目即可使用，但当真实限制与能力有所不同时，你应当把它们设置正确。

## 验证并选择它

先让 omp 加载该文件并只列出你的 Provider：

```
omp models local-openai
```

一个有效且可用的模型会出现在 `local-openai` 下，并带有其上下文、输出、thinking 与图像能力。如果存在 YAML 或 schema 问题，则会打印 `models.yml validation failed` 以及出错的字段。

然后用精确的选择器实测该端点：

```
omp -p --model local-openai/Qwen/Qwen2.5-Coder-32B-Instruct "Reply with only OK"
```

当多个 Provider 暴露相同模型 id 时，精确的 `provider/model-id` 选择器可以避免歧义。若想把它设为你常用的交互模型，请启动 `omp`，输入 `/model`，找到该 Provider 与模型，并指派为 **Default**。模型中心打开时会重新加载 `models.yml` 并保存角色指派。`/switch`（或 Alt+P）只切换当前会话。

关于把同一模型指派给 `smol`、`slow`、`plan` 或其他角色，请参阅 [模型角色](./roles.md)。

## 添加认证

对于远程的 OpenAI 兼容服务，请让 `apiKey` 指向一个环境变量：

```
providers:
  myco:
    baseUrl: https://llm.internal.example/v1
    apiKey: MYCO_LLM_API_KEY
    api: openai-responses
    models:
      - id: myco-large
        name: MyCo Large
        reasoning: true
        input: [text, image]
        contextWindow: 200000
        maxTokens: 32000
        cost:
          input: 3
          output: 15
          cacheRead: 0.3
          cacheWrite: 3.75
```

```
export MYCO_LLM_API_KEY='…'
omp models myco
```

`apiKey` 的解析规则是刻意设计的，但值得了解：

1.  以 `!` 开头的值是一条 shell 命令；其去除首尾空白后的 stdout 即为密钥。
2.  否则，omp 会查找与该名称完全一致的环境变量。
3.  如果不存在这样的变量，omp 就把配置中的文本当作字面密钥使用。

例如，`apiKey: "!op read op://team/llm/key"` 会从 1Password 读取密钥。Header 的值遵循同样的规则。相比把字面凭据提交进配置，更推荐使用环境变量或密钥管理器的命令。内置 Provider 的认证方式请参阅 [环境变量](../reference/env.md) 与 [Provider](./providers.md)。

`auth` 默认为 `apiKey`。只有对真正无需认证的端点才使用 `auth: none`。`auth: oauth` 仅在 omp 或某个扩展已为该 Provider 提供 OAuth 支持时才有效；`models.yml` 无法定义新的 OAuth 流程。

仅当网关明确要求把 `Authorization: Bearer <resolved-apiKey>` 作为普通 header 注入时，才设置 `authHeader: true`。标准的 Provider 客户端本来就会应用其常规认证方案。

## 发现服务器的模型列表

如果某 OpenAI 兼容服务器暴露了 `GET /v1/models`，使用 discovery 可以免去手动维护 `models` 列表：

```
providers:
  lab:
    baseUrl: http://127.0.0.1:8000/v1
    api: openai-completions
    auth: none
    discovery:
      type: openai-models-list
```

运行 `omp models refresh lab` 可强制在线刷新，并且只显示匹配的模型。常规启动时，只要缓存目录尚未过期就会使用缓存。

`discovery.type` 接受以下取值：

| Type | 适用场景 |
| --- | --- |
| `ollama` | Ollama 原生 `/api/tags` 与 `/api/show` 端点。 |
| `llama.cpp` | llama.cpp 原生的模型与属性端点。 |
| `lm-studio` | LM Studio 的 OpenAI 兼容模型列表与元数据。 |
| `openai-models-list` | 通用的 OpenAI 兼容 `GET /v1/models` 端点。 |
| `litellm` | LiteLLM 网关；使用其更丰富的元数据路由，必要时回退到 `/v1/models`。 |
| `proxy` | 混合 OpenAI/Anthropic 代理，其模型行会公布 `supported_endpoint_types`。 |

除 `proxy` 外，discovery 都要求提供 provider 级 `api`。`proxy` 会从其公布的端点类型推导模型的 API，仅在必要时把 provider 级 `api` 作为回退。可选的 `discovery.timeoutMs` 必须是一个正的毫秒数。

不要把通用的 OpenAI 兼容服务器标记为 `ollama`：Ollama discovery 期望的是 Ollama 原生端点。请改用 `openai-models-list`。

## 覆盖内置 Provider

不带 `models` 的 Provider 条目会修改现有 Provider，而不是替换其目录。这对于公司网关或修正元数据很有用：

```
providers:
  openai:
    baseUrl: https://gateway.internal.example/v1
    apiKey: COMPANY_OPENAI_KEY
    headers:
      X-Team: coding
    modelOverrides:
      gpt-5.4:
        contextWindow: 400000
```

Provider 级 `headers`、`compat` 与 `remoteCompaction` 是基线。模型级 header 会替换同名的 provider header，`modelOverrides` 则对某个内置或发现的模型打补丁。如果自定义 `models` 条目使用了与现有模型相同的 provider 和 id，该自定义定义会替换这个模型的传输配置。

## 文件与 Provider 参考

默认路径是 `~/.omp/agent/models.yml`；当 `.yml` 文件不存在时使用 `~/.omp/agent/models.yaml`。如果两个 YAML 文件都不存在而旧版 `models.json` 存在，omp 会把它迁移为 `models.yml`。根对象只接受 `providers`。

`providers` 下的每个键都会成为选择器中的 provider 部分。

| Provider 字段 | 含义 |
| --- | --- |
| `baseUrl` | 端点根地址。当 `models` 非空时必需。必须是非空字符串。 |
| `api` | 已声明或已发现模型的默认 API。也可以改为在每一个声明的模型上设置。 |
| `apiKey` | 环境变量名、`!command` 或字面凭据。除 `auth` 为 `none` 或 `oauth` 外，声明模型时必需。 |
| `auth` | `apiKey`（默认）、`none` 或 `oauth`。 |
| `headers` | 字符串到字符串的请求 header。值支持环境变量与 `!command` 解析。 |
| `authHeader` | 为 true 时，会基于 `apiKey` 添加 Bearer `Authorization` header。 |
| `models` | 该 Provider 拥有的完整模型定义。 |
| `discovery` | 动态目录配置：`type` 以及可选的、正的 `timeoutMs`。 |
| `modelOverrides` | 从模型 id 到稀疏元数据补丁的映射。 |
| `compat` | 高级请求/响应兼容性覆盖；通常应省略它并使用 omp 的自动检测。 |
| `disableStrictTools` | 对会拒绝严格 tool schema 标记的端点（通常是 Anthropic 兼容代理）禁用这些标记。 |
| `remoteCompaction` | Provider 级的远程压缩配置。模型级的值会在其上合并。 |
| `guardrailIdentifier` | Amazon Bedrock guardrail id 或 ARN。 |
| `guardrailVersion` | Bedrock guardrail 版本；设置了 guardrail 时默认为 `DRAFT`。 |
| `guardrailTrace` | Bedrock 的 trace 模式：`enabled`、`disabled` 或 `enabled_full`。 |
| `transport` | 仅支持 `pi-native`；经由兼容的 `omp auth-gateway` 路由。需要以该网关作为 `baseUrl`、以它的 bearer 作为 `apiKey`。 |

不带 models 的 Provider 仍须做点什么：至少设置一个可用的覆盖项，例如 `baseUrl`、`headers`、`apiKey`、`auth: none`、`compat`、`disableStrictTools`、`guardrailIdentifier`、`remoteCompaction`、`modelOverrides` 或 `discovery`。

### API 取值

| `api` 取值 | 端点族 |
| --- | --- |
| `openai-completions` | OpenAI 兼容的 Chat Completions。 |
| `openai-responses` | OpenAI 兼容的 Responses API。 |
| `openai-codex-responses` | Codex 风格的 Responses API。 |
| `azure-openai-responses` | 托管在 Azure 上的 Responses API。 |
| `anthropic-messages` | Anthropic Messages API。 |
| `bedrock-converse-stream` | Amazon Bedrock Converse 流式接口。 |
| `google-generative-ai` | Gemini 公共 API。 |
| `google-gemini-cli` | Gemini CLI 兼容 API。 |
| `google-vertex` | 通过 Vertex AI 使用 Gemini。 |

以上是 omp 内置的传输方式。使用不同线上协议的端点需要扩展（extension），而不是在 `models.yml` 里再加一个字符串。

## 模型字段参考

| 模型字段 | 含义 |
| --- | --- |
| `id` | 必填、非空的上游模型 id。 |
| `name` | 选择器中的标签；默认为 `id`。 |
| `api` | 为该模型覆盖 provider 的 `api`。 |
| `baseUrl` | 为该模型覆盖 provider 的 `baseUrl`。 |
| `reasoning` | 将该模型标记为支持 reasoning。必须为 true，`thinking` 控制面才会生效。 |
| `thinking` | 显式的 effort 控制项；见下文。省略它可让已知的模型身份与兼容性来决定控制方式。 |
| `input` | 支持的输入：`[text]` 或 `[text, image]`。 |
| `imageInputDecoder` | 仅 `stb`；为无法解码 WebP 的本地后端转换 WebP 输入。 |
| `tokenizer` | 可选的本地 token 估算器：`claude-v3`、`claude-v47`、`claude-v5`、`claude-v5-sonnet`、`qwen3`、`deepseek-v3`、`kimi-k2` 或 `glm5`。 |
| `supportsTools` | 端点是否支持 tool 调用。 |
| `cost` | 每百万 token 的费率。完整定义需要 `input`、`output`、`cacheRead` 与 `cacheWrite`。 |
| `premiumMultiplier` | 应用于所报告模型成本的乘数。 |
| `contextWindow` | 正的上下文 token 总上限，供上下文计量器与溢出处理使用。 |
| `maxTokens` | 正的输出 token 上限。 |
| `omitMaxOutputTokens` | 为 true 时省略请求中的最大输出 token 字段。 |
| `headers` | 模型级 header，在 provider header 之上合并。值支持环境变量名与 `!command`。 |
| `compat` | 模型级兼容性覆盖，在 provider 的 `compat` 之上合并。 |
| `contextPromotionTarget` | 出现上下文溢出错误后、压缩之前要切换到的模型 id 或 `provider/model-id`。 |
| `compactionModel` | 压缩时优先使用的模型选择器。 |
| `remoteCompaction` | 模型级远程压缩设置。 |

`modelOverrides` 接受相同的元数据字段，但 `id`、`api` 与 `baseUrl` 除外。它的 `cost` 对象可以是部分值，而完整模型定义的 `cost` 必须包含全部四种费率。

### Thinking 字段

新的显式 `thinking` 块采用以下结构：

```
reasoning: true
thinking:
  mode: effort
  efforts: [low, medium, high]
  defaultLevel: medium
```

| 字段 | 含义 |
| --- | --- |
| `mode` | 必填：`effort`、`budget`、`google-level`、`anthropic-adaptive` 或 `anthropic-budget-effort`。 |
| `efforts` | 新配置中必填：`minimal`、`low`、`medium`、`high`、`xhigh`、`max` 的一个有序、非空子集。 |
| `defaultLevel` | 来自受支持 effort 集合的默认值。 |
| `effortMap` | 可选：从这些 effort 名称到 provider 特定字符串的映射。 |
| `supportsDisplay` | provider 是否接受 thinking 显示偏好。 |

旧版 `levels`，或 `minLevel` 与 `maxLevel` 这一对字段仍会被接受，并会被归一化为 `efforts`；在新文件中请优先使用 `efforts`。

### 远程压缩字段

`remoteCompaction` 可以出现在 provider、模型或覆盖（override）层级。它接受 `enabled`、`api`、`endpoint`、`model`、`v2StreamingEnabled`、`v2Endpoint` 与 `streamingEndpoint`。endpoint 与 model 字符串必须非空。除非你的 Provider 提供兼容的服务端压缩端点，否则请省略此块。

## 高级兼容性字段

大多数 OpenAI 兼容服务无需 `compat` 即可工作。只有为了匹配文档所述的端点行为或解决某个具体的请求错误，才应设置这些字段。每个字段都是可选的；provider 的值构成基线，模型的值在其上合并。

**请求与流式：**`supportsStore`、`supportsDeveloperRole`、`supportsMultipleSystemMessages`、`maxTokensField`（`max_completion_tokens` 或 `max_tokens`）、`supportsUsageInStreaming`、`supportsToolChoice`、`supportsForcedToolChoice`、`alwaysSendMaxTokens`、`strictResponsesPairing`、`streamIdleTimeoutMs`、`cacheControlFormat`（`anthropic`）、`supportsLongPromptCacheRetention`、`supportsImageDetailOriginal` 与 `extraBody`。

**Reasoning：**`supportsReasoningEffort`、`supportsReasoningParams`、`reasoningEffortMap`、`thinkingFormat`（`openai`、`openrouter`、`zai`、`qwen` 或 `qwen-chat-template`）、`qwenTemplateReasoningEffort`、`reasoningContentField`（`reasoning_content`、`reasoning` 或 `reasoning_text`）、`requiresReasoningContentForToolCalls`、`allowsSyntheticReasoningContentForToolCalls`、`requiresAssistantContentForToolCalls`、`disableReasoningOnForcedToolChoice`、`disableReasoningOnToolChoice` 与 `whenThinking`。`whenThinking` 包含另一个部分的兼容性块，仅在 thinking 处于活动状态时生效。

**工具与消息历史：**`requiresToolResultName`、`requiresMistralToolIds`、`requiresAssistantAfterToolResult`、`requiresThinkingAsText`、`supportsStrictMode`、`toolStrictMode`（`all_strict` 或 `none`）与 `requiresToolResultId`。

**流式与 Anthropic 兼容行为：**`streamMarkupHealingPattern`（`kimi`、`dsml`、`qwen` 或 `thinking`）、`supportsEagerToolInputStreaming`、`allowAnthropicHeaderOverrides` 与 `replayUnsignedThinking`。

**网关路由：**`openRouterRouting` 与 `vercelGatewayRouting`，各自带可选的 `only` 与 `order` 字符串列表。

**Bedrock prompt 缓存：**`promptCacheMode`（`none`、`automatic` 或 `explicit`）、`promptCacheMinimumTokens`、`promptCacheMaximumCheckpoints` 与 `supportsLongPromptCacheRetention`。

## 故障排查

### Provider 没有出现

运行 `omp models <provider-id>`。一个无效的自定义条目会让该文件中本次运行的自定义 Provider 全部失效，而内置 Provider 仍然可用。请先检查以下规则：

*   带 `models` 的 Provider 需要 `baseUrl`。
*   它需要 `apiKey`，除非 `auth` 为 `none` 或已受支持的 `oauth`。
*   它需要 provider 级 `api`，或在每个模型上都有 `api`。
*   `id` 必须非空；提供的 `contextWindow` 和 `maxTokens` 必须为正数。
*   根键是 `providers`；`modelRoles`、`modelProviderOrder` 等设置属于 `config.yml`，而不是 `models.yml`。

### 模型出现了，但请求返回 401 或 403

确认 `apiKey` 所指的环境变量已在启动 omp 的 shell 中导出。请记住，变量名缺失时会回退为字面 token，所以即使该变量不存在，`apiKey: MYCO_LLM_API_KEY` 也仍能加载。请检查该服务期望的是常规的 SDK 认证 header 还是显式的 Bearer header；只有后者才需要 `authHeader: true`。

### 请求返回 404 或 “unsupported endpoint”

请同时检查 API 类型与 URL。`openai-completions` 需要 Chat Completions，而 `openai-responses` 需要 Responses。通用的 OpenAI 兼容 base URL 通常以 `/v1` 结尾；llama.cpp discovery 接受其原生根地址，并会自行归一化模型请求 URL。

### Discovery 没有返回任何模型

确保服务器正在运行，然后运行 `omp models refresh <provider-id>`。仅在 Ollama 原生端点使用 `ollama`，在通用的 `/v1/models` 服务使用 `openai-models-list`。如果服务器位于远程或响应较慢，请设置更大的、正的 `discovery.timeoutMs`。

### Tool 调用或 reasoning 返回 400

对于拒绝严格 tool schema 的 Anthropic 兼容代理，请设置 `disableStrictTools: true`。对于 OpenAI 兼容方言不匹配的情况，只修改服务错误信息中提到的相关 `compat` 字段；大段照搬的兼容性块可能会禁用端点实际上支持的某些功能。

### 上下文或用量数字看起来不对

被发现的端点并不总能报告可靠的元数据。请显式声明该模型，或添加一条带真实 `contextWindow`、`maxTokens`、`input`、`reasoning` 与 `cost` 值的 `modelOverrides` 条目。
