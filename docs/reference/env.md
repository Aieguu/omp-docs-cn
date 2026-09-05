# 环境变量

## 选择正确的配置方式

当某个值属于机器或进程而非项目时,应使用环境变量:例如密钥、云凭据、代理、仅 CI 使用的值或临时覆盖。例如:

```
export ANTHROPIC_API_KEY="sk-ant-..."
omp
```

对于单次调用,可以把赋值放在命令之前而不导出:

```
PI_SLOW_MODEL="openai/gpt-5.5:high" omp
```

环境变量**不是** YAML 设置,也**不是** CLI 标志:

- 需要随其余配置一起被审查的持久 omp 行为,请使用 [`~/.omp/agent/config.yml`](../guide/settings.md) 或项目设置。
- 需要一次性显式选择时使用 [`omp` 标志](../reference/cli.md)。当标志与环境变量控制同一个值时,标志优先;例如 `--slow` 优先于 `PI_SLOW_MODEL`。
- 在 shell 或 `.env` 文件中使用本页的变量。不要往 `config.yml` 里写 `export PI_FOO=...`,也不要指望名为 `PI_FOO` 的 YAML 键生效。

不存在放之四海皆准的“环境变量总是压过 YAML”规则。有些变量是回退值,有些则显式覆盖对应设置。下方每个表格都会说明属于哪种行为。

当一行说明为 **truthy** 时,omp 的共享标志解析器接受 `1`、`y`、`true`、`yes` 或 `on`(不区分所列的大小写形式)。部分子系统会归一化大小写或要求某个确切取值,这些行会单独说明。

对于支持交互式登录的 Provider,`/login` 通常比把 OAuth token 放在 shell 启动文件里更安全。请把所有 API key、token、cookie、客户端密钥和凭据文件都视为机密。

## omp 从哪里读取环境值

启动时,omp 按以下顺序保留它找到的第一个非空值:

1. 启动 omp 的 shell 继承的环境。
2. 启动目录下的 `$PWD/.env`。
3. 活动 agent 的 `.env`:通常是 `~/.omp/agent/.env`;对于命名 profile 则是 `~/.omp/profiles/<name>/agent/.env`。
4. 活动配置根目录的 `.env`:通常是 `~/.omp/.env`;对于命名 profile 则是 `~/.omp/profiles/<name>/.env`。
5. `~/.env`。

Bun 可能会在 omp 运行前预加载它支持的启动目录文件——例如 `.env.local`、`.env.<NODE_ENV>` 和 `.env.<NODE_ENV>.local`。以这种方式加载的值已经出现在继承的进程环境中,因此拥有第一个来源的优先级。

`PI_CONFIG_DIR` 会改变 `.omp` 根目录名称。`PI_CODING_AGENT_DIR` 会改变默认 profile 的 agent 目录;命名 profile 会忽略它。

在解析的 `.env` 文件内部,`OMP_FOO` 键也会被复制为 `PI_FOO`,且复制出的值优先于同文件中 `PI_FOO` 的值。此兼容规则仅适用于 `.env` 文件,不适用于从父 shell 继承的变量。

> 修改 `.env` 文件后请重启 omp。环境变化不会热加载。

### `.env` 语法

名称必须匹配 `[A-Za-z_][A-Za-z0-9_]*`。允许空行和 `#` 注释;`export` 是可选的。接受单引号、双引号和反引号。

```
# ~/.omp/.env
export ANTHROPIC_API_KEY="sk-ant-..."
PI_SLOW_MODEL='anthropic/claude-opus-4-8:high'
PI_NOTIFICATIONS=off
```

omp 自己的解析器会保留值的字面形式。启动目录的 `.env` 可能先由 Bun 在 omp 启动前加载,因此 Bun 支持的展开可能已经在那里发生;不要依赖其他 `.env` 文件中的展开。

## Provider 凭据

只设置你要用的 Provider 凭据。来自 `/login` 或 Provider 配置的已存凭据可能优先于环境回退值;下方优先级说明描述的是环境变量名之间的先后关系。

| Provider 或服务 | 变量与解析顺序 |
| --- | --- |
| Anthropic | `ANTHROPIC_OAUTH_TOKEN` → `ANTHROPIC_API_KEY`。开启 Foundry 模式后:`ANTHROPIC_FOUNDRY_API_KEY` → OAuth token → API key。 |
| ai& | `AIAND_API_KEY`。 |
| AIML API | `AIMLAPI_API_KEY`。 |
| Alibaba Coding Plan | `ALIBABA_CODING_PLAN_API_KEY`。 |
| QwenCloud Token Plan | `ALIBABA_TOKEN_PLAN_API_KEY` → `BAILIAN_TOKEN_PLAN_API_KEY`。 |
| Baseten | `BASETEN_API_KEY`。 |
| Cerebras | `CEREBRAS_API_KEY`。 |
| Cloudflare AI Gateway | `CLOUDFLARE_AI_GATEWAY_API_KEY`。 |
| CoreWeave Serverless Inference | `COREWEAVE_API_KEY` → `WANDB_API_KEY`;当账户需要 OpenAI-Project 请求头时,设置 `COREWEAVE_PROJECT=<team>/<project>`。 |
| Cursor | 运行时认证用 `CURSOR_ACCESS_TOKEN`;目录发现阶段也识别 `CURSOR_API_KEY`。推荐 `/login cursor`。 |
| DeepSeek | `DEEPSEEK_API_KEY`。 |
| Devin | `DEVIN_API_KEY`。 |
| Fire Pass | `FIREPASS_API_KEY`。 |
| Fireworks | `FIREWORKS_API_KEY`。 |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`;通用的 `GITHUB_TOKEN` 和 `GH_TOKEN` 不是 Copilot 凭据。 |
| GitLab Duo and Duo Agent | `GITLAB_TOKEN`。 |
| GMI Cloud | `GMI_API_KEY`。 |
| Google Gemini | `GEMINI_API_KEY`;图像生成回退到 `GOOGLE_API_KEY`。 |
| Groq | `GROQ_API_KEY`。 |
| Hugging Face | `HUGGINGFACE_HUB_TOKEN` → `HF_TOKEN`。 |
| Kilo Gateway | `KILO_API_KEY`;目录发现也允许免认证网关。 |
| Kimi Code | API key 发现用 `KIMI_API_KEY`;常用路径是 `/login kimi-code`。 |
| LiteLLM | `LITELLM_API_KEY`;免认证代理时可省略。 |
| LM Studio | `LM_STUDIO_API_KEY`;常规本地服务器时可省略。 |
| llama.cpp | `LLAMA_CPP_API_KEY`;常规本地服务器时可省略。 |
| Meta Model API | `MODEL_API_KEY` → `META_API_KEY`。 |
| MiniMax | `MINIMAX_API_KEY`。 |
| MiniMax Code | `MINIMAX_CODE_API_KEY`。 |
| MiniMax Code CN | `MINIMAX_CODE_CN_API_KEY`。 |
| Mistral | `MISTRAL_API_KEY`。 |
| Moonshot | `MOONSHOT_API_KEY` → `KIMI_API_KEY`。 |
| NanoGPT | `NANO_GPT_API_KEY`。 |
| NVIDIA | `NVIDIA_API_KEY`。 |
| Novita | `NOVITA_API_KEY`;目录发现也允许免认证端点。 |
| Ollama | `OLLAMA_API_KEY`;常规本地服务器时可省略。 |
| Ollama Cloud | `OLLAMA_CLOUD_API_KEY`,或 `/login ollama-cloud`。 |
| OpenAI | `OPENAI_API_KEY`。 |
| OpenAI Codex | `OPENAI_CODEX_OAUTH_TOKEN`,或 `/login openai-codex`。 |
| OpenCode Go / Zen | `OPENCODE_API_KEY`。 |
| OpenRouter | `OPENROUTER_API_KEY`;免认证的自定义端点也可被发现。 |
| Qianfan | `QIANFAN_API_KEY`。 |
| Qwen Portal | `QWEN_OAUTH_TOKEN` → `QWEN_PORTAL_API_KEY`。 |
| Sakana / Fugu | `SAKANA_API_KEY` → `FUGU_API_KEY`。 |
| SiliconFlow | `SILICONFLOW_API_KEY`。 |
| SiliconFlow China | `SILICONFLOW_CN_API_KEY`。 |
| Synthetic | `SYNTHETIC_API_KEY`。 |
| Together | `TOGETHER_API_KEY`。 |
| Umans AI Coding Plan | `UMANS_AI_CODING_PLAN_API_KEY`;也允许免认证端点。 |
| Venice | `VENICE_API_KEY`;允许免认证访问。 |
| Vercel AI Gateway | 运行时认证用 `AI_GATEWAY_API_KEY`;目录发现阶段也检查 `VERCEL_AI_GATEWAY_API_KEY`。 |
| vLLM | `VLLM_API_KEY`;任意非空值都会让免认证的本地服务器参与发现。 |
| Wafer Serverless | `WAFER_SERVERLESS_API_KEY`,或 `/login wafer-serverless`。 |
| xAI | `XAI_API_KEY`。对于 SuperGrok OAuth 路线,`XAI_OAUTH_TOKEN` 优先于 `XAI_API_KEY`。 |
| Xiaomi MiMo | `XIAOMI_API_KEY`。 |
| Xiaomi Token Plan | 按所选区域使用 `XIAOMI_TOKEN_PLAN_AMS_API_KEY`、`XIAOMI_TOKEN_PLAN_CN_API_KEY` 或 `XIAOMI_TOKEN_PLAN_SGP_API_KEY`。 |
| z.ai | `ZAI_API_KEY`。 |
| ZenMux | `ZENMUX_API_KEY`;允许免认证端点。 |
| Zhipu Coding Plan | `ZHIPU_API_KEY`。 |

CI 任务示例:

```
export OPENAI_API_KEY="$CI_OPENAI_API_KEY"
export PI_SLOW_MODEL="openai/gpt-5.5:high"
omp -p "Review this change for correctness"
```

### 远程认证代理(Remote auth broker)

这些变量用于选择远程凭据保险库,而不是本地凭据数据库。

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `OMP_AUTH_BROKER_URL` | Broker 基础 URL。设置后即选择 broker 模式,且此值优先于 `auth.broker.url`。若无法解析出任何 token,启动会失败而不是回退到本地凭据。 |
| `OMP_AUTH_BROKER_TOKEN` | Bearer token。解析顺序为 env → `auth.broker.token` → `<config-root>/auth-broker.token`。 |
| `OMP_AUTH_BROKER_SNAPSHOT_TTL_MS` | 非负毫秒数;默认 `3600000`(1 小时)。`0` 禁用加密快照缓存的读写。 |
| `OMP_AUTH_BROKER_SNAPSHOT_CACHE` | 快照缓存路径;默认 `~/.omp/cache/auth-broker-snapshot.enc` 或其 XDG 等价路径。 |
| `OMP_AUTH_BROKER_ACCOUNT_POOL_FILE` | JSON 文件,把 Provider ID 映射到允许的 broker `identityKey` 数组。非法输入按失败关闭处理。缺失的 Provider 不受限制;`[]` 会隐藏该 Provider 的 OAuth 账户。 |

```
export OMP_AUTH_BROKER_URL="https://broker.example.net:8765"
export OMP_AUTH_BROKER_TOKEN="..."
omp
```

## 网络、代理与端点配置

### 出站代理

对于 Provider 请求,omp 先检查 `NO_PROXY`,再按以下顺序解析代理:

1. `PI_PROXY_<PROVIDER>`,其中 Provider ID 大写、标点变成 `_`,例如 `PI_PROXY_GITHUB_COPILOT`。
2. `PI_PROXY`。
3. HTTPS 与 WebSocket 用 `HTTPS_PROXY` / `https_proxy`,HTTP 用 `HTTP_PROXY` / `http_proxy`。
4. `ALL_PROXY` / `all_proxy`。

`NO_PROXY` 与 `no_proxy` 包含常见的逗号分隔排除项。回环、链路本地和 RFC 1918 私有地址会绕过 Provider 代理。`PI_PROXY` 覆盖整个进程,也覆盖登录、刷新、用量与发现调用;Provider 专属变量只覆盖该 Provider。

```
export PI_PROXY="http://127.0.0.1:7890"
export NO_PROXY="localhost,127.0.0.1,.internal.example"
```

### Provider 端点与协议控制

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `OPENAI_BASE_URL` | OpenAI 兼容基础 URL 回退;已配置的 Provider/模型 URL 优先。 |
| `ANTHROPIC_BASE_URL` | Anthropic 基础 URL 回退;默认 `https://api.anthropic.com`。 |
| `MOONSHOT_BASE_URL` | Moonshot 对话与模型发现基础地址;默认 `https://api.moonshot.ai/v1`。 |
| `XAI_BASE_URL` | xAI API 基础 URL 覆盖。 |
| `SAKANA_BASE_URL`, `FUGU_BASE_URL` | Sakana/Fugu 基础 URL;`SAKANA_BASE_URL` 优先。 |
| `AIAND_BASE_URL` | ai& 端点覆盖。 |
| `LITELLM_BASE_URL` | LiteLLM 回退基础地址;默认 `http://localhost:4000/v1`。显式 Provider 或 `models.yml` 配置优先。 |
| `LM_STUDIO_BASE_URL` | 隐式 LM Studio 发现基础地址;默认 `http://127.0.0.1:1234/v1`。 |
| `OLLAMA_BASE_URL` | 隐式 Ollama 发现基础地址。回退到 `OLLAMA_HOST`,再回退到 `http://127.0.0.1:11434`。 |
| `OLLAMA_HOST` | Ollama 风格主机,如 `127.0.0.1:11434`;仅在 `OLLAMA_BASE_URL` 未设置时使用。 |
| `OLLAMA_CONTEXT_LENGTH` | 正整数上下文窗口,omp 在为隐式 Ollama 模型做预算时使用。不会改变 Ollama 服务端的上下文。 |
| `LLAMA_CPP_BASE_URL` | 隐式 llama.cpp 基础地址;默认 `http://127.0.0.1:8080`。 |
| `PI_OPENROUTER_RESPONSES` | Responses API 默认开启;恰好为 `0` 时选择 Chat Completions。 |
| `UMANS_WEBSEARCH_PROVIDER` | 当模型未配置时,Umans 模型的默认 Anthropic 网页搜索 Provider 名称。 |

```
export OLLAMA_BASE_URL="http://gpu-box.local:11434"
export OLLAMA_CONTEXT_LENGTH=32768
omp
```

### Anthropic Foundry、自定义请求头与 TLS

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `CLAUDE_CODE_USE_FOUNDRY` | `1`、`true`、`yes` 或 `on` 开启 Foundry 模式。 |
| `FOUNDRY_BASE_URL` | Foundry 模式下的 Anthropic 端点;否则仍以已配置的 Provider/模型 URL 作为回退。 |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry bearer token;Foundry 模式下优先级最高的 Anthropic 环境凭据。 |
| `ANTHROPIC_CUSTOM_HEADERS` | 逗号或换行分隔的 `name: value` 请求头。与非 Anthropic 的 `ANTHROPIC_BASE_URL` 一起使用时同样生效。 |
| `NODE_EXTRA_CA_CERTS` | PEM 文件路径或内联 PEM(含转义的 `\n`)。额外 CA 应用于所有 Provider 请求。 |
| `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY` | 成对的客户端证书与私钥,各自为 PEM 路径或内联 PEM;仅用于 Foundry mTLS。 |

### Amazon Bedrock

区域解析顺序为请求选项 → `AWS_REGION` → `AWS_DEFAULT_REGION` → profile 区域 → `us-east-1`。

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `AWS_REGION`, `AWS_DEFAULT_REGION` | 主区域与回退区域。 |
| `AWS_PROFILE` | 命名 profile;默认 profile 名为 `default`。 |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | IAM 访问密钥对与可选的会话 token。 |
| `AWS_BEARER_TOKEN_BEDROCK` | 优先级最高的 Bedrock bearer-token 路径;跳过 AWS 凭据链。 |
| `AWS_SHARED_CREDENTIALS_FILE`, `AWS_CONFIG_FILE` | 覆盖标准 AWS INI 路径。 |
| `AWS_SDK_LOAD_CONFIG` | `1` 或 `true` 时,即使没有显式 profile 也加载共享配置。 |
| `AWS_WEB_IDENTITY_TOKEN_FILE`, `AWS_ROLE_ARN`, `AWS_ROLE_SESSION_NAME` | Web 身份角色凭据与可选会话名。 |
| `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`, `AWS_CONTAINER_CREDENTIALS_FULL_URI` | ECS 凭据端点。 |
| `AWS_CONTAINER_AUTHORIZATION_TOKEN`, `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE` | ECS 凭据端点授权。 |
| `AWS_EC2_METADATA_DISABLED` | `true` 禁用 IMDSv2。 |
| `AWS_EC2_METADATA_SERVICE_ENDPOINT` | IMDS 端点覆盖。 |
| `AWS_EC2_METADATA_SERVICE_ENDPOINT_MODE` | `ipv6` 选择 IPv6 IMDS 回退;其他值使用 IPv4。 |
| `AWS_BEDROCK_SKIP_AUTH` | Truthy 标志为可信的免认证代理注入虚拟凭据。 |
| `AWS_BEDROCK_FORCE_CACHE` | Truthy 标志强制 Bedrock prompt-cache 行为,即使模型目录并未显式标注。 |

### Azure OpenAI Responses

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `AZURE_OPENAI_API_KEY` | 必需,除非由 Provider 配置提供。 |
| `AZURE_OPENAI_API_VERSION` | API 版本;Responses 默认 `v1`(Chat Completions 兼容路径默认 `2024-10-21`)。 |
| `AZURE_OPENAI_BASE_URL` | 直接基础 URL;优先于由资源名推导的 URL。 |
| `AZURE_OPENAI_RESOURCE_NAME` | 构建 `https://<resource>.openai.azure.com/openai/v1`。 |
| `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` | 逗号分隔的 `model=deployment` 对。 |

### Google Vertex AI

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT`, `GCP_PROJECT`, `GCLOUD_PROJECT` | 项目 ID,按此顺序。 |
| `GOOGLE_VERTEX_LOCATION`, `GOOGLE_CLOUD_LOCATION`, `VERTEX_LOCATION` | Vertex 位置,按此顺序;ADC 支撑的 Vertex 使用所必需。 |
| `GOOGLE_CLOUD_API_KEY` | 直接 Vertex API-key 认证;否则 omp 使用 ADC。 |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC JSON 路径;回退为 `~/.config/gcloud/application_default_credentials.json`。 |
| `GOOGLE_CLOUD_ACCESS_TOKEN`, `CLOUDSDK_AUTH_ACCESS_TOKEN` | 显式 OAuth 访问 token,按此顺序;绕过 ADC token 获取。 |
| `GOOGLE_CLOUD_PROJECT_ID` | Gemini CLI 登录助手的项目回退;不是 Vertex 的主项目变量。 |

## Web 搜索

这些变量用于让某个搜索 Provider 可用,或细化其端点。支持该能力的 Provider 可用 `/login` 存储凭据。

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `EXA_API_KEY` | Exa 搜索与 Exa MCP 访问。 |
| `BRAVE_API_KEY` | Brave Search API key。 |
| `PERPLEXITY_API_KEY` | 直接 Perplexity API 模式。 |
| `PERPLEXITY_COOKIES` | Perplexity 消费者 cookie 认证;优先于已存 OAuth。 |
| `PI_PERPLEXITY_RESPONSES` | 恰好为 `1` 选择 Responses 端点;否则用 Chat Completions。 |
| `PI_PERPLEXITY_MODEL` | 消费者订阅模型;默认 `experimental`。 |
| `PI_PERPLEXITY_API_MODEL` | 直接 API 模型;默认 `sonar-pro`。 |
| `TINYFISH_API_KEY` | TinyFish 搜索/浏览器 API key。 |
| `FIRECRAWL_API_KEY` | Firecrawl API key;配置的自定义端点也可以无 key。 |
| `FIRECRAWL_BASE_URL`, `FIRECRAWL_API_URL` | Firecrawl 端点覆盖;`FIRECRAWL_BASE_URL` 优先。 |
| `GOOGLE_GEMINI_BASE_URL` | Gemini 搜索端点覆盖;必须是绝对 HTTP(S) URL。 |
| `GEMINI_SEARCH_MODEL` | Gemini 搜索模型覆盖。 |
| `TAVILY_API_KEY` | Tavily API key。 |
| `ZAI_API_KEY` | z.ai 搜索,也用于 z.ai 聊天模型。 |
| `PI_CODEX_WEB_SEARCH_MODEL` | Codex 搜索模型覆盖。 |
| `MOONSHOT_SEARCH_API_KEY`, `KIMI_SEARCH_API_KEY` | Kimi/Moonshot 搜索 key;Moonshot 名称优先。 |
| `MOONSHOT_SEARCH_BASE_URL`, `KIMI_SEARCH_BASE_URL` | Kimi/Moonshot 搜索端点;Moonshot 名称优先。 |
| `KAGI_API_KEY` | Kagi Search API key。 |
| `JINA_API_KEY` | Jina API key。 |
| `PARALLEL_API_KEY` | Parallel API key。 |
| `SEARXNG_ENDPOINT` | SearXNG 端点;回退到 `searxng.endpoint` YAML 设置。 |
| `SEARXNG_TOKEN` | SearXNG bearer token;在其 YAML 设置之后作为环境回退。 |
| `SEARXNG_BASIC_USERNAME`, `SEARXNG_BASIC_PASSWORD` | SearXNG Basic Auth;在其 YAML 设置之后作为环境回退。 |
| `ANTHROPIC_SEARCH_API_KEY` | 仅用于搜索的 Anthropic key;搜索时优先于普通 Anthropic 凭据。 |
| `ANTHROPIC_SEARCH_BASE_URL` | 仅用于搜索的基础 URL;优先于 Foundry 与 `ANTHROPIC_BASE_URL`。 |
| `ANTHROPIC_SEARCH_MODEL` | 搜索模型;默认 `claude-haiku-4-5`。 |
| `PI_AUTH_NO_BORROW` | 任意非空值都会禁止在登录期间借用 Perplexity macOS 应用 token。 |

```
export BRAVE_API_KEY="..."
omp -p "Find the current release notes and summarize the breaking changes"
```

## 模型、执行与会话行为

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_SMOL_MODEL` | 仅本次会话的 `smol` 角色模型;`--smol` 优先。 |
| `PI_SLOW_MODEL` | 仅本次会话的 `slow` 角色模型;`--slow` 优先。 |
| `PI_PLAN_MODEL` | 仅本次会话的 `plan` 角色模型;`--plan` 优先。 |
| `PI_TINY_DEVICE` | 覆盖 `providers.tinyModelDevice`。默认 CPU。可接受:`cpu`、`gpu`、`metal`、`webgpu`、`auto`、`cuda`、`dml`、`coreml`、`wasm`、`webnn`、`webnn-gpu`、`webnn-cpu`、`webnn-npu`。 |
| `PI_TINY_DTYPE` | 覆盖 `providers.tinyModelDtype`。未设置时保留模型自带的 dtype,目前为 `q4`。可接受:`auto`、`fp32`、`fp16`、`q8`、`int8`、`uint8`、`q4`、`bnb4`、`q4f16`、`q2`、`q2f16`、`q1`、`q1f16`。 |
| `PI_NO_TITLE` | 任意非空值都会禁用自动生成首条消息的会话标题。`--no-title` 设置相同行为。 |
| `PI_NO_INTERLEAVED_THINKING` | 恰好为 `1` 禁用 Anthropic 交错思考预算。 |
| `PI_NO_THINKING_LOOP_GUARD` | 恰好为 `1` 禁用思考循环保护。 |
| `NULL_PROMPT` | 恰好为 `true` 时返回空系统提示词;用于原始模型诊断。 |
| `PI_CACHE_RETENTION` | `long`、`short` 或 `none`;非法值会被忽略。适用于 Anthropic、OpenAI Responses 与 Bedrock 支持的范围。 |
| `PI_PACKAGE_DIR` | 内置文档、示例与变更日志的包资源根目录。 |
| `OMP_SKIP_SETUP` | 除 `0`、`false`、`no` 外的任意非空值都会跳过自动交互式设置;被显式强制的设置仍会运行。 |
| `PI_DISABLE_LSPMUX` | 恰好为 `1` 禁用 lspmux,改用直连的语言服务器进程。 |
| `PI_RPC_EMIT_TITLE` | Truthy 标志在 RPC 模式下发送标题事件。 |
| `OMP_MCP_TIMEOUT_MS` | 全局 MCP 请求超时(毫秒)。正整数会覆盖每个服务器的超时;`0` 禁用客户端超时;非法值被忽略。 |
| `PI_BROWSER_RELAY` | `1` 开启或 `0` 关闭浏览器中继,覆盖 `browser.relay`。 |
| `PI_BROWSER_CMUX` | `1` 开启或 `0` 关闭 cmux 浏览器表面,覆盖 `browser.cmux`。 |

### Eval 运行时

这些环境门控覆盖 `eval.py`、`eval.js`、`eval.rb` 与 `eval.jl`。标准 truthy 值为被识别大小写下的 `1`、`y`、`true`、`yes` 与 `on`;任何其他已定义的值都视为 false。

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_PY` | Python 门控;未设置时使用 YAML 设置,默认开启。 |
| `PI_JS` | JavaScript 门控;未设置时使用 YAML 设置,默认开启。 |
| `PI_RB` | Ruby 门控;未设置时使用 YAML 设置,默认关闭。 |
| `PI_JL` | Julia 门控;未设置时使用 YAML 设置,默认关闭。 |
| `PI_PYTHON_SKIP_CHECK` | Truthy 时跳过 Python 可用性探测;运行时仍会按需启动。 |
| `PI_RUBY_SKIP_CHECK` | Truthy 时跳过 Ruby 可用性探测。 |
| `PI_PYTHON_IPC_TRACE` | Truthy 时记录 Python runner 的 NDJSON 帧。 |
| `PI_RUBY_IPC_TRACE` | Truthy 时记录 Ruby runner 帧。 |
| `PI_JULIA_IPC_TRACE` | Truthy 时记录 Julia runner 帧。 |
| `VIRTUAL_ENV` | 优先级最高的 Python 环境路径。 |
| `CONDA_PREFIX` | `VIRTUAL_ENV` 之后的 Python 环境回退,在本地 `.venv` 与 `venv` 之前。 |

### 子代理与操作上限

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_TASK_MAX_OUTPUT_BYTES` | 每个子代理捕获的最大字节数;默认 `500000`。 |
| `PI_TASK_MAX_OUTPUT_LINES` | 每个子代理捕获的最大行数;默认 `5000`。 |
| `PI_BLOCKED_AGENT` | 要阻止的确切子代理类型。未设置则不阻止任何类型。 |
| `PI_SUBPROCESS_CMD` | 用于启动子代理的完整替代命令,替代查找 `omp` / `omp.cmd`。 |
| `PI_MAX_AST_FILES` | 单次结构化编辑操作接受的最大文件数(正整数);默认 `1000`。非法、零与负值使用默认值。 |
| `PI_WALK_WORKERS` | `omp grep` 的文件系统遍历 worker 数;默认 `4`,`0` 自动选择可用的并行度。 |

### 编辑、shell 与图像

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_EDIT_VARIANT` | `patch`、`replace`、`hashline` 或 `apply_patch`;非法值被忽略。 |
| `PI_STRICT_EDIT_MODE` | 恰好为 `1` 禁用模型专属的编辑模式回退。 |
| `PI_INTENT_TRACING` | `tools.intentTracing` 的布尔类覆盖。 |
| `PI_NO_PTY` | 恰好为 `1` 禁用交互式 PTY 执行;`--no-pty` 会在内部设置它。 |
| `PI_DISABLE_UUTILS_BUILTINS` | 除 `0` 或 `false` 外的任意非空值都会禁用内置 shell 工具。存在 `shell.env.PI_DISABLE_UUTILS_BUILTINS` 时以它为准。 |
| `PI_BASH_NO_CI`, `CLAUDE_BASH_NO_CI` | 规范变量与旧回退;任意非空值都会抑制在派生的 shell 中自动设置 `CI=true`。 |
| `PI_BASH_NO_LOGIN`, `CLAUDE_BASH_NO_LOGIN` | 规范变量与旧回退;任意非空值会把 Unix shell 参数从 `-l -c` 改为 `-c`。 |
| `PI_SHELL_PREFIX`, `CLAUDE_CODE_SHELL_PREFIX` | 规范包装前缀与旧回退,应用于每条 shell 命令。 |
| `VISUAL`, `EDITOR` | 外部编辑器命令与回退,Ctrl+G 使用。 |
| `OMP_NO_WEBP` | `1` 或 `true`(不区分大小写)在图像缩放时禁用 WebP 选择。 |
| `OMP_NATIVE_LIBRARY_PATH` | 仅 Linux;以冒号分隔的本地模型 worker 原生库目录,追加到 `LD_LIBRARY_PATH`;在 NixOS 上很有用。 |

## 存储、profile 与兼容路径

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `OMP_PROFILE` | 命名 profile 选择器。即使显式为空也优先于 `PI_PROFILE`;空、空白或 `default` 选择默认 profile。名称必须匹配 `[a-z0-9][a-z0-9._-]{0,63}`,不能是 `.` 或 `..`,不能以 `.` 结尾,也不能是 Windows 保留设备名。 |
| `PI_PROFILE` | 旧 profile 选择器,仅在 `OMP_PROFILE` 未定义时使用。 |
| `PI_CONFIG_DIR` | home 下配置根目录名;默认 `.omp`。 |
| `PI_CODING_AGENT_DIR` | 仅默认 profile 的完整 agent 目录覆盖;命名 profile 会忽略它。 |
| `PI_CODING_AGENT_SESSION_DIR` | 启动参数解析期间使用的初始会话目录覆盖。 |
| `PI_CONFIG_FILES` | Unix 上以 `:` 分隔、Windows 上以 `;` 分隔的 YAML 叠加路径。它们在项目设置之后、重复的 `--config` 叠加之前按顺序加载。 |
| `OMP_WORKTREE_DIR` | agent 管理的工作树根目录;默认 `~/.omp/wt`。必须是绝对路径或 `~` 相对路径;非法相对路径被忽略。它优先于 `worktree.base`。 |
| `OMP_AUTORESEARCH_DB_DIR` | 按项目的自动研究数据库与工件目录。 |
| `OMP_GITHUB_CACHE_DB` | GitHub 虚拟 URL SQLite 缓存路径;默认 `~/.omp/cache/github-cache.db`。 |
| `XDG_DATA_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME` | 在 macOS/Linux 上,仅当目标 `omp` 根目录或命名 profile 根目录已存在时,才重定向对应的 omp 路径。 |
| `CLAUDE_CONFIG_DIR` | 迁移导入的 Claude Code 命令、插件、MCP 配置、会话与 `.claude.json`;未设置时使用常规 Claude 路径。 |
| `COPILOT_HOME` | GitHub Copilot 配置 home;默认 `~/.copilot`。 |
| `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` | 逗号分隔的额外 Copilot 指令目录。 |
| `JS_DEBUG_DAP_SERVER` | 已有 JavaScript 调试适配器服务器的地址。 |

`PWD`、`HOME`、`XDG_CONFIG_HOME`、`APPDATA`、`SHELL` 与 `ComSpec` 也参与常规操作系统路径与 shell 发现;它们不是 omp 专属设置。

## 记忆后端

### Hindsight

下方每个 `HINDSIGHT_*` 值都会覆盖其对应的 `hindsight.*` YAML 设置。空字符串被忽略。布尔值不区分大小写:只有 `true`、`1` 与 `yes` 表示真。非法整数与枚举值被忽略。

| 变量 | 可接受的值与内置默认 |
| --- | --- |
| `HINDSIGHT_API_URL` | 非空 URL;`http://localhost:8888`。 |
| `HINDSIGHT_API_TOKEN` | 非空 token;未设置。 |
| `HINDSIGHT_BANK_ID` | 非空 ID;未设置,由作用域推导。 |
| `HINDSIGHT_BANK_MISSION` | 字符串;空。 |
| `HINDSIGHT_RETAIN_MODE` | `full-session` 或 `last-turn`;`full-session`。 |
| `HINDSIGHT_RECALL_BUDGET` | `low`、`mid` 或 `high`;`mid`。 |
| `HINDSIGHT_AUTO_RECALL` | 布尔;`true`。 |
| `HINDSIGHT_AUTO_RETAIN` | 布尔;`true`。 |
| `HINDSIGHT_SCOPING` | `global`、`per-project` 或 `per-project-tagged`;`per-project-tagged`。 |
| `HINDSIGHT_DEBUG` | 布尔;`false`。 |
| `HINDSIGHT_RECALL_MAX_TOKENS` | 整数;`1024`。 |
| `HINDSIGHT_RECALL_CONTEXT_TURNS` | 整数;`1`。 |
| `HINDSIGHT_RECALL_MAX_QUERY_CHARS` | 整数;`800`。 |
| `HINDSIGHT_RETAIN_EVERY_N_TURNS` | 整数;`3`。 |
| `HINDSIGHT_REQUEST_TIMEOUT_MS` | 整数毫秒;`30000`。 |
| `HINDSIGHT_REFLECT_TIMEOUT_MS` | 整数毫秒;`120000`。 |
| `HINDSIGHT_RECALL_TIMEOUT_MS` | 整数毫秒;`30000`。 |
| `HINDSIGHT_RETAIN_TIMEOUT_MS` | 整数毫秒;`60000`。 |

### Mnemopi

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `MNEMOPI_EMBEDDING_MODEL` | 当 `mnemopi.embeddingModel` 未设置时的嵌入模型覆盖;否则由配置的变体选择模型。 |
| `MNEMOPI_POLYPHONIC_RECALL` | 恰好为 `1` 开启;其他任何已定义的值都关闭。覆盖 `mnemopi.polyphonicRecall`,其默认值为 false。 |
| `MNEMOPI_ENHANCED_RECALL` | 恰好为 `1` 开启;其他任何已定义的值都关闭。覆盖 `mnemopi.enhancedRecall`,其默认值为 false。 |
| `MNEMOPI_PROACTIVE_LINKING` | 恰好为 `1` 开启;其他任何已定义的值都关闭。覆盖 `mnemopi.proactiveLinking`,其默认值为 false。 |

## 终端与浏览器行为

大多数终端身份变量由终端自身设置。仅当检测有问题时,才设置这些 omp 专属控制项。

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_NOTIFICATIONS` | `off`、`0` 或 `false` 抑制桌面通知;其他值保持开启。 |
| `PI_TUI_WRITE_LOG` | 非空文件路径会记录所有 TUI 写入。 |
| `PI_TUI_RAW_BACKSPACE_IS_CTRL` | 恰好为 `1` 时把原始字节 `0x08` 视为 Ctrl+Backspace。 |
| `PI_HARDWARE_CURSOR` | Truthy 开启硬件光标模式。 |
| `PI_NO_SYNC_OUTPUT` | 任意非空值禁用 DEC 2026 同步输出包装。 |
| `PI_TUI_SYNC_OUTPUT` | 恰好 `0` 关闭或 `1` 开启同步输出。`PI_NO_SYNC_OUTPUT` 优先于开启值。 |
| `PI_FORCE_SYNC_OUTPUT` | 当 `PI_NO_SYNC_OUTPUT` 与 `PI_TUI_SYNC_OUTPUT` 未禁用它时,恰好为 `1` 开启同步输出。 |
| `PI_NO_DECCARA` | 除 `0` 或 `false` 外的任意非空值禁用 Kitty DECCARA 背景填充。 |
| `PI_DEBUG_REDRAW` | 恰好为 `1` 开启重绘诊断。 |
| `PI_FORCE_IMAGE_PROTOCOL` | `kitty`、`iterm2`/`iterm` 或 `sixel` 强制使用该协议。`off`、`none`、`0` 或 `false` 禁用终端图像。其他任何非空值也会禁用图像检测,所以请只使用文档中的取值。 |
| `PI_ALLOW_SIXEL_PASSTHROUGH` | Truthy 仅在强制协议为 `sixel` 时允许直通。 |
| `PI_KITTY_PLACEHOLDERS` | `1`、`true`、`on`、`yes` 或 `y` 强制开启 Kitty Unicode 占位符;`0`、`false`、`off`、`no` 或 `n` 强制关闭,不区分大小写。 |
| `PI_NO_KITTY_PLACEHOLDERS` | `1`、`true`、`on`、`yes` 或 `y` 禁用 Kitty 占位符,并优先于 `PI_KITTY_PLACEHOLDERS`。 |
| `PI_TUI_RESIZE_SCROLLBACK` | `preserve`、`append` 或 `rebuild`;默认 `preserve`。`append` 按新宽度重放已定稿的历史,`rebuild` 先清除原生回滚再重放。 |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium 可执行文件路径。 |
| `PUPPETEER_PROXY` | Chromium `--proxy-server` 值。 |
| `PUPPETEER_PROXY_BYPASS_LOOPBACK` | `1`、`true`、`yes` 或 `on`(不区分大小写)让 localhost 走代理。 |
| `PUPPETEER_PROXY_IGNORE_CERT_ERRORS` | 同样的 truthy 值;在忽略证书错误的情况下启动 Chromium。 |
| `CMUX_WORKSPACE_ID`, `CMUX_SURFACE_ID` | 浏览器分屏的 cmux workspace/surface 目标。 |
| `CMUX_RELAY_ID`, `CMUX_RELAY_TOKEN` | cmux 中继身份与凭据回退。 |

自动检测的终端信号包括 `COLORTERM`、`TERM`、`COLORFGBG`、`TERM_PROGRAM`、`TERM_PROGRAM_VERSION`、`TERMINAL_EMULATOR`、`WT_SESSION`、`TMUX_PANE`、`CMUX_SURFACE_ID`、`KITTY_WINDOW_ID`、`WEZTERM_PANE`、`TERM_SESSION_ID`、`ZELLIJ_PANE_ID` 与 `ZELLIJ_SESSION_NAME`。OMP 也遵循 `NO_COLOR`;在 Linux 上,它会从 `DISPLAY`、`WAYLAND_DISPLAY`、`WSL_DISTRO_NAME`、`WSL_INTEROP` 与 `TERMUX_VERSION` 检测剪贴板/显示支持。

## 诊断与高级控制

### 启动、Provider 与提交诊断

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_TIMING` | 任意非空值把累计计时打印到 stderr。`full` 包含每次模块加载的跨度;`x` 打印启动计时并在 TUI 之前成功退出。 |
| `PI_DEBUG_STARTUP` | 任意非空值把同步的 `[startup] phase:start/done` 标记流式输出到 stderr。 |
| `DEBUG_CURSOR` | 非空开启 Cursor 日志;`2` 或 `verbose` 包含负载片段。 |
| `DEBUG_CURSOR_LOG` | Cursor JSONL 日志路径。 |
| `PI_CODEX_DEBUG` | Truthy 开启 Codex Provider 诊断。 |
| `PI_COMMIT_TEST_FALLBACK` | 不区分大小写的 `true` 强制使用启发式提交消息回退。 |
| `PI_COMMIT_NO_FALLBACK` | 不区分大小写的 `true` 在生成失败时让提交提案保持为空。 |
| `PI_COMMIT_MAP_REDUCE` | 不区分大小写的 `false` 为大 diff 禁用 map-reduce 分析。 |
| `DEBUG` | 任意非空值打印完整的提交生成错误堆栈。 |
| `PI_AUTO_QA` | 自动工具问题记录的最高优先级布尔覆盖;`0`/`false` 关闭,`1`/`true` 开启。 |
| `PI_AUTO_QA_PUSH` | `1`/`true` 绕过同意对话框,允许在 headless 环境中记录。 |
| `PI_AUTO_QA_PUSH_URL` | 推送端点;优先于 `dev.autoqaPush.endpoint`。 |
| `PI_AUTO_QA_PUSH_TOKEN` | 推送 bearer token;优先于 `dev.autoqaPush.token`。 |

### Codex 与流传输

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_CODEX_WEBSOCKET` | 布尔类 websocket 偏好;未设置时使用模型/目录行为。 |
| `PI_CODEX_RESPONSES_LITE` | `1`/`true` 强制 Responses Lite;`0`/`false` 强制标准 Responses;未设置时使用目录行为。 |
| `PI_OPENAI_STATEFUL` | 有状态 Responses 链式调用的布尔类覆盖。默认在 `api.openai.com` 上开启,其他地方关闭。 |
| `PI_CODEX_ZSTD` | 官方 Codex 默认开启压缩;`0`/`false` 关闭。 |
| `PI_CODEX_WEBSOCKET_IDLE_TIMEOUT_MS` | 正整数毫秒;默认 `300000`。 |
| `PI_CODEX_WEBSOCKET_FIRST_EVENT_TIMEOUT_MS` | 正整数毫秒;默认 `300000`。 |
| `PI_CODEX_WEBSOCKET_PING_INTERVAL_MS` | 正整数毫秒;默认 `10000`。 |
| `PI_CODEX_WEBSOCKET_PONG_TIMEOUT_MS` | 正整数毫秒;默认 `60000`。 |
| `PI_CODEX_WEBSOCKET_MESSAGE_QUEUE_CAPACITY` | 缓冲消息数;默认 `4096`。 |
| `PI_CODEX_WEBSOCKET_MAX_IDLE_REUSE_MS` | 最大空闲复用毫秒数;默认 `30000`。 |
| `PI_CODEX_WEBSOCKET_RETRY_BUDGET` | 非负重试次数;默认 `5`。 |
| `PI_CODEX_WEBSOCKET_RETRY_DELAY_MS` | 正整数基础退避毫秒数;默认 `500`。 |
| `PI_STREAM_FIRST_EVENT_TIMEOUT_MS` | 通用首事件超时毫秒数;`0` 禁用。 |
| `PI_STREAM_IDLE_TIMEOUT_MS` | 通用空闲超时毫秒数;`0` 禁用。 |
| `PI_OPENAI_STREAM_FIRST_EVENT_TIMEOUT_MS` | OpenAI 专属覆盖;`0` 禁用并优先于通用值。 |
| `PI_OPENAI_STREAM_IDLE_TIMEOUT_MS` | OpenAI 专属覆盖;`0` 禁用并优先于通用值。 |

### 兼容性 User-Agent

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `PI_AI_GEMINI_CLI_VERSION` | Gemini CLI user-agent 版本;默认 `0.46.0`。 |
| `PI_AI_ANTIGRAVITY_VERSION` | Antigravity hub 版本覆盖;可自动发现时自动发现,回退 `2.8.0`。 |
| `PI_AI_ANTIGRAVITY_CL` | Antigravity changelist;默认 `963137146`。 |
| `PI_AI_ANTIGRAVITY_OS` | Antigravity OS 标签;默认 `darwin`。 |
| `PI_AI_ANTIGRAVITY_ARCH` | Antigravity 架构标签;默认 `arm64`。 |
| `KIMI_CODE_OAUTH_HOST`, `KIMI_OAUTH_HOST` | Kimi OAuth 主机,按此顺序;默认 `https://auth.kimi.com`。 |
| `KIMI_CODE_BASE_URL` | Kimi 用量端点基础 URL。 |
| `SMITHERY_URL` | Smithery Web URL;默认 `https://smithery.ai`。 |
| `SMITHERY_API_URL` | Smithery API 基础地址;默认 `https://api.smithery.ai`。 |
| `SMITHERY_API_KEY` | Smithery 托管 MCP 查找 key。 |

### GitLab Duo 工作流

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `GITLAB_CLIENT_ID` | OAuth 客户端 ID;未设置时使用 omp 自带的 GitLab OAuth 应用 ID。 |
| `GITLAB_REDIRECT_URI` | 精确的 HTTP(S) 回调 URI。未设置时使用 `http://localhost:8080/callback`,并回退随机端口。 |
| `GITLAB_DUO_NAMESPACE_ID` | 工作流命名空间覆盖;显式运行时配置优先。 |
| `GITLAB_DUO_PROJECT_ID` | 项目 ID 覆盖;优先于 `GITLAB_DUO_PROJECT_PATH`。 |
| `GITLAB_DUO_PROJECT_PATH` | 未设置项目 ID 时的项目路径覆盖。 |
| `GITLAB_DUO_WORKFLOW_DEFINITION` | 工作流定义;默认 `ambient`。 |
| `GITLAB_DUO_WORKFLOW_TRACE` | 恰好为 `1` 追加工作流跟踪事件。 |
| `GITLAB_DUO_WORKFLOW_TRACE_FILE` | 跟踪 JSONL 路径;留空使用包的 `.tmp/gitlab-duo-workflow-trace.log`。 |

### OpenTelemetry 导出

只有配置了至少一个信号端点时,OMP 才会启动 OTLP 导出。

| 变量 | 可接受的值与默认含义 |
| --- | --- |
| `OTEL_SDK_DISABLED` | 不区分大小写的 `true` 禁用初始化。 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 通用 OTLP 端点回退。 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | 按信号的端点;各自优先于通用端点。 |
| `OTEL_TRACES_EXPORTER`, `OTEL_LOGS_EXPORTER`, `OTEL_METRICS_EXPORTER` | 包含 `none` 的列表会禁用对应信号。 |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | 通用协议。仅支持 `http/protobuf`;其他显式值会禁用导出。 |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`, `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`, `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL` | 按信号的协议;各自优先于通用协议。 |
| `OTEL_SERVICE_NAME` | 服务名资源属性。 |
| `OTEL_RESOURCE_ATTRIBUTES` | 标准逗号分隔的 OpenTelemetry 资源属性。 |
| `OTEL_LOG_LEVEL` | 导出的最小 omp 日志级别。 |
| `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT` | `summary` 捕获摘要;`true`、`1`、`yes` 或 `full` 捕获完整消息内容;其他任何值都不捕获。这可能暴露提示词与响应。 |

## 故障排查

**`.env` 中的某个值似乎被忽略了**

- 先检查启动 shell:已存在的非空值优先于所有 `.env` 文件。
- 确认文件位于上方列出的启动目录、活动 profile 目录、配置根目录或 home 位置。
- 重启 omp。值只在启动时加载一次。
- 记住命名 profile 使用 `~/.omp/profiles/<name>/...`,并忽略 `PI_CODING_AGENT_DIR`。

**YAML 设置与环境变量不一致**

阅读该变量的对应行。有些环境值是显式覆盖(`PI_TINY_DEVICE`、Hindsight 变量),有些是回退值(`LITELLM_BASE_URL`),有些会被 CLI 标志取代(`PI_SLOW_MODEL`)。用 `omp config get <setting>` 检查 YAML;在 shell 中用 `env | sort` 检查继承的环境值。

**认证仍然失败**

对于受支持的 OAuth Provider,优先使用 `/login`。否则请核对上面精确的 Provider 专属名称、去掉空白,并确保没有在需要 `COPILOT_GITHUB_TOKEN` 之类 Provider 专属 token 的地方使用 `GITHUB_TOKEN` 之类的通用 key。

**机密被提交或打印**

立即吊销并轮换它。仅从最新文件删除是不够的,因为它仍留在历史与日志中。让携带凭据的 `.env` 文件远离版本控制,并限制其权限,例如 `chmod 600 ~/.omp/.env`。
