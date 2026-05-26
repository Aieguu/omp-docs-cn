# 环境变量

## 解析顺序

omp 通过分层 `.env` 链解析环境变量。第一个定义某 key 的来源生效：

1. 已有的进程环境。
2. `$PWD/.env` — omp 启动目录中的项目 `.env`。
3. `~/.omp/agent/.env` — 或 `$PI_CODING_AGENT_DIR/.env` / `$PI_CONFIG_DIR/agent/.env`（如已设置）。
4. `~/.omp/.env` — 遵循 `PI_CONFIG_DIR`。
5. `~/.env` — 用户 home 目录下的 `.env`。

在每个 `.env` 文件中，写为 `OMP_FOO` 的 key 会镜像为 `PI_FOO`，因此 `OMP_*` 时代的旧配置无需重命名即可继续工作。`~/.omp/agent/config.yml` 中的设置覆盖内置默认值；CLI flag 覆盖两者。flag 列表详见 [CLI 参考](./cli.md)。

> 环境变量在启动时读取。编辑 `~/.env` 或项目 `.env` 后，需重启 omp。

> 所有以 `_API_KEY`、`_TOKEN` 或 `_OAUTH_TOKEN` 结尾的值都应视为密钥。永远不要提交 `.env` 文件；永远不要将它们粘贴到聊天记录中。任何包含凭据的 `.env` 文件应执行 `chmod 600`。

## .env 文件格式

每行一个 `KEY=value`，`#` 为注释，值中的空格或 shell 元字符建议加引号。不支持插值，不需要 `export` 关键字。

```
# ~/.omp/.env — applies to every project
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PI_SLOW_MODEL="openai/gpt-5.3-codex:high"
PI_NO_PTY=1
```

## 运行时调谐

最常用的选项。每个都有更高优先级的 CLI flag 或 settings key；环境变量是为 shell 会话或 CI 任务设置的最低摩擦方式。

| 变量 | 作用 |
| --- | --- |
| `PI_CODING_AGENT_DIR` | 将 agent 数据目录从 `~/.omp/agent` 移走——适用于共享机器或隔离 profile。 |
| `PI_CONFIG_DIR` | 重命名 `$HOME` 下的配置根目录（默认 `.omp`）。Agent 目录变为 `~/<PI_CONFIG_DIR>/agent`，除非同时设置了 `PI_CODING_AGENT_DIR`。 |
| `PI_PACKAGE_DIR` | 将包资源解析（文档、示例、changelog）指向自定义安装路径——适用于 Nix/Guix。 |
| `PI_SMOL_MODEL` | 固定本次会话的 smol 角色。CLI `--smol` 优先。 |
| `PI_SLOW_MODEL` | 固定 slow/推理角色。CLI `--slow` 优先。 |
| `PI_PLAN_MODEL` | 固定 plan 角色。CLI `--plan` 优先。 |
| `PI_NO_PTY` | 设为 `1` 禁用 bash 工具的 PTY 路径。等同于 `--no-pty`。 |
| `PI_PY` | 控制 `eval` 工具的 Python 后端：`0`/`bash` = 仅 JS，`1`/`py` = 仅 Python，`mix`/`both` = 两者皆用。 |
| `PI_JS` | `PI_PY` 的对应项，控制 `eval` 的 JavaScript 后端。 |
| `PI_HL_SEP` | 覆盖 hashline-edit 载荷分隔符（单字符；默认 `~`）。 |
| `OMP_GITHUB_CACHE_DB` | 覆盖 `pr://` 和 `issue://` 的 SQLite 缓存文件。默认 `~/.omp/cache/github-cache.db`。 |
| `OMP_AUTORESEARCH_DB_DIR` | 覆盖 autoresearch SQLite 数据库所在目录。 |
| `VISUAL`、`EDITOR` | 首选外部编辑器和回退，供 Ctrl+G 使用。 |
| `PUPPETEER_EXECUTABLE_PATH` | 指定 browser 工具启动的 Chromium 二进制文件。 |

## Provider 凭据

每个要使用的 provider 对应一个 key。对于 Anthropic、OpenAI Codex、GitHub Copilot、Kimi、Cursor 和 Qwen Portal，交互式 `/login` 会将 OAuth 凭据写入 `~/.omp/agent/agent.db`，通常比管理 API key 更方便。完整的 OAuth 矩阵和登录流程详见 [Providers](../guide/providers.md)。

| Provider | 环境变量 | 说明 |
| --- | --- | --- |
| Anthropic | `ANTHROPIC_OAUTH_TOKEN`、`ANTHROPIC_API_KEY` | OAuth token 优先于 API key。 |
| Anthropic Foundry | `ANTHROPIC_FOUNDRY_API_KEY` | 当 `CLAUDE_CODE_USE_FOUNDRY` 开启时使用。 |
| OpenAI | `OPENAI_API_KEY` | 同时用于 OpenAI Responses 和 Codex 解析。 |
| OpenAI Codex | `OPENAI_CODEX_OAUTH_TOKEN` | 推荐通过 `/login` 使用 OAuth。 |
| Google (Gemini) | `GEMINI_API_KEY` | 图片工具回退到 `GOOGLE_API_KEY`。 |
| Google Vertex | `GOOGLE_CLOUD_API_KEY` | 否则使用 ADC + project/location；见下方云 provider。 |
| Amazon Bedrock | 多个 | 见下方云 provider。 |
| Azure OpenAI | `AZURE_OPENAI_API_KEY` | 见下方云 provider。 |
| Groq | `GROQ_API_KEY` |  |
| Cerebras | `CEREBRAS_API_KEY` |  |
| Fireworks | `FIREWORKS_API_KEY` |  |
| Together | `TOGETHER_API_KEY` |  |
| Hugging Face | `HUGGINGFACE_HUB_TOKEN` → `HF_TOKEN` | 第一个非空值生效。 |
| Synthetic | `SYNTHETIC_API_KEY` |  |
| NVIDIA | `NVIDIA_API_KEY` |  |
| NanoGPT | `NANO_GPT_API_KEY` |  |
| Venice | `VENICE_API_KEY` | 允许未认证访问。 |
| LiteLLM | `LITELLM_API_KEY` | OpenAI 兼容的 LiteLLM 代理。 |
| LM Studio | `LM_STUDIO_API_KEY` _(可选)_ | 本地服务器通常无需认证。 |
| Ollama | `OLLAMA_API_KEY` _(可选)_ |  |
| Ollama Cloud | `OLLAMA_CLOUD_API_KEY` |  |
| llama.cpp | `LLAMA_CPP_API_KEY` _(可选)_ |  |
| vLLM | `VLLM_API_KEY` | 无认证的本地服务器可填任意非空值。 |
| Xiaomi MiMo | `XIAOMI_API_KEY` |  |
| Moonshot | `MOONSHOT_API_KEY` |  |
| Kimi Code | `KIMI_API_KEY` | 推荐通过 `/login` 使用 OAuth。 |
| xAI | `XAI_API_KEY` |  |
| OpenRouter | `OPENROUTER_API_KEY` | 通过 OpenRouter 路由时图片工具也会使用。 |
| Mistral | `MISTRAL_API_KEY` |  |
| Z.AI | `ZAI_API_KEY` | 同时驱动 z.ai 网络搜索 provider。 |
| MiniMax | `MINIMAX_API_KEY` |  |
| MiniMax Code | `MINIMAX_CODE_API_KEY` |  |
| MiniMax Code CN | `MINIMAX_CODE_CN_API_KEY` |  |
| OpenCode Go / Zen | `OPENCODE_API_KEY` | 两个路由共享同一 key。 |
| Qianfan | `QIANFAN_API_KEY` |  |
| Qwen Portal | `QWEN_OAUTH_TOKEN` → `QWEN_PORTAL_API_KEY` | OAuth token 优先。 |
| Cursor | `CURSOR_ACCESS_TOKEN` | 推荐通过 `/login` 使用 OAuth。 |
| ZenMux | `ZENMUX_API_KEY` | 覆盖 ZenMux 的 OpenAI 和 Anthropic 兼容路由。 |
| DeepSeek | `DEEPSEEK_API_KEY` |  |
| Kilo Gateway | `KILO_API_KEY` | 允许未认证访问。 |
| Alibaba Coding Plan | `ALIBABA_CODING_PLAN_API_KEY` |  |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | 也接受 `VERCEL_AI_GATEWAY_API_KEY` 用于 catalog 发现。 |
| Cloudflare AI Gateway | `CLOUDFLARE_AI_GATEWAY_API_KEY` | Base URL 形式 `https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/anthropic`。 |
| GitLab Duo | `GITLAB_TOKEN` |  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN` → `GH_TOKEN` → `GITHUB_TOKEN` | 第一个非空值生效。 |
| Auth broker (远程) | `OMP_AUTH_BROKER_URL`、`OMP_AUTH_BROKER_TOKEN` | 将 omp 指向远端凭据保险库，替代 `~/.omp/agent/agent.db`。URL 启用 broker 模式；token 认证客户端。详见 [Providers](../guide/providers.md)。 |

## 云 Provider

### Anthropic Foundry 与 mTLS

当你的组织通过需要自定义头或客户端证书的 Azure Foundry 或企业网关代理 Anthropic 时使用。设置 `CLAUDE_CODE_USE_FOUNDRY` 会将 Anthropic provider 切换为 Foundry 模式，影响流式传输和搜索。

| 变量 | 行为 |
| --- | --- |
| `CLAUDE_CODE_USE_FOUNDRY` | 布尔开关（`1`、`true`、`yes`、`on`）。 |
| `FOUNDRY_BASE_URL` | Foundry 模式下的 Anthropic 端点 base URL。 |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry 模式请求的 Bearer token。 |
| `ANTHROPIC_CUSTOM_HEADERS` | 额外头字段，`name: value` 格式，逗号或换行分隔。 |
| `NODE_EXTRA_CA_CERTS` | 额外 CA 链——PEM 文件路径或内联 PEM（支持转义 `\n`）。 |
| `CLAUDE_CODE_CLIENT_CERT`、`CLAUDE_CODE_CLIENT_KEY` | mTLS 客户端证书和对应私钥（必须成对）。 |

启用 Foundry 后 Anthropic 的解析顺序变为 `ANTHROPIC_FOUNDRY_API_KEY` → `ANTHROPIC_OAUTH_TOKEN` → `ANTHROPIC_API_KEY`；否则为 OAuth token 然后 API key。

### Amazon Bedrock

Region 解析顺序：`options.region` → `AWS_REGION` → `AWS_DEFAULT_REGION` → `us-east-1`。

| 变量 | 行为 |
| --- | --- |
| `AWS_REGION`、`AWS_DEFAULT_REGION` | 主 region，然后回退。 |
| `AWS_PROFILE` | 命名 profile 认证路径。 |
| `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | 纯 IAM key。 |
| `AWS_BEARER_TOKEN_BEDROCK` | Bedrock API key（bearer token）认证。 |
| `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`、`AWS_CONTAINER_CREDENTIALS_FULL_URI` | ECS 任务凭据。 |
| `AWS_WEB_IDENTITY_TOKEN_FILE` + `AWS_ROLE_ARN` | IRSA / web-identity 认证。 |
| `AWS_BEDROCK_SKIP_AUTH` | 设为 `1` 时注入虚拟凭据，适用于代理或无认证场景。 |
| `AWS_BEDROCK_FORCE_HTTP1` | 设为 `1` 时强制使用 Node HTTP/1 请求处理器。 |
| `HTTPS_PROXY`、`HTTP_PROXY`、`ALL_PROXY`、`NO_PROXY` | 将 Bedrock 运行时和 AWS SSO 调用通过代理路由（仅 HTTP/1）。 |

### Azure OpenAI Responses

Base URL 解析顺序：选项 → `AZURE_OPENAI_BASE_URL` → `AZURE_OPENAI_RESOURCE_NAME` → 模型默认值。

| 变量 | 行为 |
| --- | --- |
| `AZURE_OPENAI_API_KEY` | 除非通过选项传入 API key，否则必填。 |
| `AZURE_OPENAI_API_VERSION` | 默认 `v1`。 |
| `AZURE_OPENAI_BASE_URL` | 直接覆盖 base URL。 |
| `AZURE_OPENAI_RESOURCE_NAME` | 构建为 `https://<resource>.openai.azure.com/openai/v1`。 |
| `AZURE_OPENAI_DEPLOYMENT_NAME_MAP` | 映射字符串：`modelId=deployment,modelB=deploymentB`。 |

### Google Vertex AI

| 变量 | 行为 |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT`、`GCLOUD_PROJECT` | 项目 ID，然后回退。 |
| `GOOGLE_CLOUD_LOCATION` | Region；ADC 认证必需（无默认值）。 |
| `GOOGLE_CLOUD_API_KEY` | 直接 Vertex API key 认证；跳过 ADC。 |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC JSON 路径；回退到 `~/.config/gcloud/application_default_credentials.json`。 |
| `GOOGLE_CLOUD_PROJECT_ID` | 仅供 OAuth 登录辅助——Gemini CLI 项目发现使用。 |

## 网络搜索

内置网络搜索 provider 的凭据和端点覆盖。部分 key（如 Z.AI、Anthropic search）也会被对应的 model provider 读取。

| 变量 | 使用者 |
| --- | --- |
| `EXA_API_KEY` | Exa 搜索和 Exa MCP 工具。 |
| `BRAVE_API_KEY` | Brave 搜索。 |
| `PERPLEXITY_API_KEY` | Perplexity API key 模式。 |
| `PERPLEXITY_COOKIES` | Perplexity cookie 认证模式。 |
| `TAVILY_API_KEY` | Tavily。 |
| `KAGI_API_KEY` | Kagi。 |
| `JINA_API_KEY` | Jina。 |
| `PARALLEL_API_KEY` | Parallel。 |
| `ANTHROPIC_SEARCH_API_KEY`、`ANTHROPIC_SEARCH_BASE_URL`、`ANTHROPIC_SEARCH_MODEL` | Anthropic 网络搜索后端覆盖。默认模型：`claude-haiku-4-5`。 |
| `ANTHROPIC_BASE_URL` | 搜索回退路径使用的通用 Anthropic base URL。 |
| `MOONSHOT_SEARCH_API_KEY` / `KIMI_SEARCH_API_KEY` | Kimi / Moonshot 搜索 provider。 |
| `MOONSHOT_SEARCH_BASE_URL` / `KIMI_SEARCH_BASE_URL` | Kimi / Moonshot 搜索端点覆盖。 |
| `PI_CODEX_WEB_SEARCH_MODEL` | Codex 搜索 provider 模型覆盖。 |
| `SEARXNG_ENDPOINT`、`SEARXNG_TOKEN` | SearXNG 端点和可选的 bearer token。 |
| `SEARXNG_BASIC_USERNAME`、`SEARXNG_BASIC_PASSWORD` | SearXNG HTTP Basic 认证。 |
| `PI_AUTH_NO_BORROW` | 禁用 Perplexity 登录使用的 macOS 原生应用 token 借用路径。 |

## Eval 与 Python 内核

| 变量 | 行为 |
| --- | --- |
| `PI_PY` | 后端门控（见 _运行时调谐_）。 |
| `PI_JS` | JavaScript 后端的对应门控。 |
| `PI_PYTHON_SKIP_CHECK` | 跳过 Python 可用性探测（runner 仍按需启动）。 |
| `PI_PYTHON_INTEGRATION` | 设为 `1` 启用针对真实 Python 安装的集成测试。 |
| `PI_PYTHON_IPC_TRACE` | 设为 `1` 记录与 Python runner 交换的 NDJSON 帧。 |
| `VIRTUAL_ENV` | Python 运行时解析的最高优先级 venv 路径。 |

当 `BUN_ENV=test` 或 `NODE_ENV=test` 时，Python 可用性检查视为通过且跳过预热。Python runner 会从子进程环境中剥离常见的 API key 变量，仅转发 `LC_`、`XDG_` 和 `PI_` 前缀及一组安全基础变量。

## 子 Agent 限制

| 变量 | 行为 |
| --- | --- |
| `PI_TASK_MAX_OUTPUT_BYTES` | 每个子 agent 的最大捕获输出字节数（默认 `500000`）。 |
| `PI_TASK_MAX_OUTPUT_LINES` | 每个子 agent 的最大捕获输出行数（默认 `5000`）。 |
| `PI_BLOCKED_AGENT` | 在 task 工具中阻止特定子 agent 类型。 |
| `PI_SUBPROCESS_CMD` | 覆盖子 agent 生成命令（绕过 `omp` / `omp.cmd` 查找）。 |

## 行为开关

| 变量 | 行为 |
| --- | --- |
| `PI_NO_TITLE` | 跳过首条用户消息的自动生成会话标题。 |
| `NULL_PROMPT` | 设为 `true` 时系统 prompt 构建器返回空字符串。用于调试或运行原始模型。 |
| `PI_EDIT_VARIANT` | 强制使用指定 edit 工具变体：`patch`、`replace`、`hashline`、`atom`、`vim`、`apply_patch`。 |
| `PI_CACHE_RETENTION` | 设为 `long` 启用长 prompt 缓存保留（支持 Anthropic、OpenAI Responses、Bedrock）。 |
| `PI_DISABLE_LSPMUX` | 设为 `1` 禁用 lspmux 集成并强制直接启动 LSP 服务器。 |
| `PI_RPC_EMIT_TITLE` | 在 RPC 模式下发送 title 事件。 |

## 性能与调试

| 变量 | 行为 |
| --- | --- |
| `PI_TIMING` | 任何非空值在会话结束后将累计的启动/工具计时打印到 stderr。`x` 打印后以状态 0 退出；`full` 追加每个模块加载跨度。在 `-p` 打印模式下每个 prompt 被标记为 `print:prompt:initial` / `print:prompt:next`。 |
| `DEBUG_CURSOR` | Cursor provider 调试日志；`2`/`verbose` 输出载荷片段。 |
| `DEBUG_CURSOR_LOG` | 可选的 JSONL 日志文件路径，用于 Cursor 调试流。 |
| `PI_CODEX_DEBUG` | OpenAI Codex provider 调试日志。 |
| `PI_CODEX_WEBSOCKET`、`PI_CODEX_WEBSOCKET_V2` | 为 Codex provider 切换 WebSocket 传输。 |
| `PI_CODEX_WEBSOCKET_IDLE_TIMEOUT_MS` | 覆盖空闲超时（默认 `300000`）。 |
| `PI_CODEX_WEBSOCKET_RETRY_BUDGET` | 覆盖重试预算（默认 `5`）。 |
| `PI_CODEX_WEBSOCKET_RETRY_DELAY_MS` | 覆盖基础退避（默认 `500`）。 |
| `PI_OPENAI_STREAM_IDLE_TIMEOUT_MS` | 覆盖 OpenAI 流空闲超时。 |
| `PI_AI_GEMINI_CLI_VERSION` | 覆盖 Gemini CLI user-agent 版本标签。 |

## 本地服务器发现

| 变量 | 默认值 |
| --- | --- |
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234/v1` |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` |
| `LLAMA_CPP_BASE_URL` | `http://127.0.0.1:8080` |
| `KIMI_CODE_OAUTH_HOST` → `KIMI_OAUTH_HOST` | OAuth host 覆盖；默认 `https://auth.kimi.com`。 |
| `KIMI_CODE_BASE_URL` | Kimi 使用端点 base URL。 |
| `SMITHERY_URL`、`SMITHERY_API_URL` | Smithery web（`https://smithery.ai`）和 API（`https://api.smithery.ai`）base URL。 |

## Shell 执行

bash 工具运行命令时如何封装用户的 shell。每个 `PI_*` key 都有对应的 `CLAUDE_*` 旧别名仍然有效。

| 变量 | 行为 |
| --- | --- |
| `PI_BASH_NO_CI` | 禁止自动向生成的 shell 注入 `CI=true`。 |
| `PI_BASH_NO_LOGIN` | 取消 login shell 模式——shell 参数变为 `['-c']` 而非 `['-l','-c']`。 |
| `PI_SHELL_PREFIX` | 可选的命令前缀包装器，应用于每次 shell 调用。 |
| `CLAUDE_BASH_NO_CI`、`CLAUDE_BASH_NO_LOGIN`、`CLAUDE_CODE_SHELL_PREFIX` | 上述三个的旧别名。 |
| `PI_NO_PTY` | 禁用 bash 工具的 PTY 路径（也被 `--no-pty` 内部设置）。 |

## TUI 运行时

终端侧调谐选项。大多数可自动检测；仅在默认值异常时手动设置。

| 变量 | 行为 |
| --- | --- |
| `PI_NOTIFICATIONS` | `off` / `0` / `false` 禁用桌面通知。 |
| `PI_FORCE_IMAGE_PROTOCOL` | 强制使用终端图片协议：`kitty`、`iterm2`/`iterm`、`sixel`、`none`。 |
| `PI_ALLOW_SIXEL_PASSTHROUGH` | 当 `PI_FORCE_IMAGE_PROTOCOL=sixel` 时允许 SIXEL 透传。 |
| `PI_HARDWARE_CURSOR` | 设为 `1` 启用硬件 cursor 模式。 |
| `PI_CLEAR_ON_SHRINK` | 设为 `1` 在内容缩小时清除空行。 |
| `PI_TUI_WRITE_LOG` | 将所有 TUI 写入记录到文件。 |
| `PI_DEBUG_REDRAW` | 启用重绘调试日志。 |
| `PI_TUI_DEBUG` | 启用深度 TUI 调试转储路径。 |

## 提交流水线

`/commit` slash 命令及底层 commit agent 遵循以下开关。主要用于提交流水线自身的开发调试。

| 变量 | 行为 |
| --- | --- |
| `PI_COMMIT_TEST_FALLBACK` | 设为 `true` 强制使用启发式回退路径而非询问 agent。 |
| `PI_COMMIT_NO_FALLBACK` | 设为 `true` 当 agent 未产出建议时留空（不回退）。 |
| `PI_COMMIT_MAP_REDUCE` | 设为 `false` 禁用大 diff 的 map-reduce 分析路径。 |
| `DEBUG` | 设置后 commit agent 失败时打印完整错误栈。 |
