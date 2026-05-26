# 自定义模型与 Provider

## 文件位置

自定义 Provider 和模型配置存放在 `~/.omp/agent/models.yml`。同路径下的旧格式 `models.json` 会在首次加载时自动迁移。该文件与 `config.yml` 的关系请参阅 [设置](./settings.md)。

## 添加模型条目

在 Provider 块中通过 `models:` 列表声明完整的模型元数据。列出的所有模型都会出现在 `/model` 中（参阅 [Slash 命令](./slash-commands.md)），并可被 [模型角色](./roles.md) 使用。

```
# ~/.omp/agent/models.yml
providers:
  myco:
    baseUrl: https://llm.internal.myco.dev/v1
    apiKey: MYCO_API_KEY
    api: openai-responses
    auth: apiKey
    models:
      - id: myco-large
        name: MyCo Large
        reasoning: true
        input: [text, image]
        contextWindow: 200000
        maxTokens: 32000
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 }
```

`apiKey:` 首先作为环境变量名查找，未匹配则视为字面 token。配置此块并导出 `MYCO_API_KEY`（参阅 [环境变量](../reference/env.md)）后，该模型将以 `myco/myco-large` 的形式出现在选择器中。

### 模型字段

`id`

上游模型 ID。用于线上请求。

`name`

选择器中的显示标签。

`reasoning`

当模型支持思考级别时设为 `true`。启用 `:level` 后缀和 Shift+Tab 循环。

`input`

模态类型——可选 `text`、`image`、`audio` 的任意组合。

`contextWindow` / `maxTokens`

Token 数量。用于实时上下文预算计算。

`cost`

每百万 token 的费率。在 `/usage` 中展示。

`contextPromotionTarget`

可选。当单回合即将超出 `contextWindow` 时，omp 会在回退链运行前切换到此模型 ID。

## 覆盖内置 Provider

没有 `models:` 列表的 Provider 条目仅用于覆盖——适用于将内置 Provider 重定向到代理，或修补某个模型的元数据而无需重新声明整个目录。

```
providers:
  anthropic:
    baseUrl: https://gateway.internal/anthropic
    headers:
      X-Org-Id: myco
    modelOverrides:
      claude-sonnet-4-6:
        contextPromotionTarget: anthropic/claude-opus-4-6
    disableStrictTools: true
```

`baseUrl` / `headers`

将 Provider 指向代理或网关。

`compat`

调整 OpenAI 兼容方言（`thinkingFormat`、`reasoningContentField`、工具 ID 格式）。

`disableStrictTools: true`

某些第三方 Anthropic 兼容端点会拒绝 strict tool-schema 字段，需设置此项。

`modelOverrides`

针对单个模型的 `contextWindow`、`maxTokens`、`cost`、`contextPromotionTarget` 补丁。

`discovery`

内置 Provider 的实时模型列表。类型：`ollama`、`llama.cpp`、`lm-studio`、`openai-models-list`。

## 实现自定义 Provider

Provider 块声明线协议传输方式、认证方案以及（可选的）模型自动发现方式。

### 传输方式（`api:`）

- `openai-completions` — 经典 chat-completions。
- `openai-responses` — Responses API。
- `openai-codex-responses` — Codex 变体。
- `azure-openai-responses` — Azure 托管的 Responses。
- `anthropic-messages` — Anthropic Messages API。
- `google-generative-ai` — Gemini 公共 API。
- `google-vertex` — 通过 Vertex 使用 Gemini。

### 认证方案（`auth:`）

`apiKey`

从 `apiKey:` 读取，解析顺序参阅 [Provider](./providers.md)，以及 `--api-key`。云端端点的默认值。

`none`

不发送任何凭据。适用于 llama.cpp、Ollama、LM Studio 等无需认证的本地服务。

`oauth`

omp 在 `/login <provider>` 时驱动浏览器或设备码授权流程（参阅 [Slash 命令](./slash-commands.md)），并将可刷新的 token 存储在 `agent.db` 中。每次调用前自动刷新 token。要接入 OAuth，Provider 需要注册的 client ID 和授权端点——目前仅限内置 Provider 和特定网关集成。

### 自动发现（`discovery:`）

当上游提供模型列表端点时，声明一次即可省略 `models:` 列表：

```
providers:
  llama.cpp:
    baseUrl: http://127.0.0.1:8080
    api: openai-responses
    auth: none
    discovery:
      type: llama.cpp
```

自动发现会在启动时查询端点并缓存结果。如果启动时服务器离线，omp 会回退到 `models.yml` 中的内容。支持的类型：`ollama`、`llama.cpp`、`lm-studio`、`openai-models-list`。

## 等价性与优先级仲裁

规范 ID（`claude-sonnet-4-6`、`gpt-5.3-codex`）将同一底层模型的网关和衍生版本归为一组。将自定义 Provider 映射到规范组中，这样单个角色配置即可自动路由到你拥有凭据的任意 Provider：

```
equivalence:
  overrides:
    myco/myco-large: claude-sonnet-4-6

modelProviderOrder:
  - anthropic
  - myco
```

`config.yml` 中的 `modelProviderOrder` 用于在多个 Provider 提供相同规范 ID 时仲裁——排在前面的优先；未认证的 Provider 会被跳过。
