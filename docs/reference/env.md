# 环境变量速查

本页只列常用和高影响变量。完整上游参考见 `docs/environment-variables.md`。

## 加载顺序

```text
process env
  -> $PWD/.env
  -> ~/.omp/agent/.env
  -> ~/.omp/.env
  -> ~/.env
```

已存在的 key 不会被后续 `.env` 覆盖。`.env` 中的 `OMP_*` 会镜像为对应 `PI_*`。

## Provider API keys

| 变量 | 用途 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI / OpenAI-compatible。 |
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic OAuth，优先于 API key。 |
| `ANTHROPIC_API_KEY` | Anthropic API key。 |
| `GEMINI_API_KEY` | Google Gemini。 |
| `GOOGLE_API_KEY` | Gemini image fallback。 |
| `GROQ_API_KEY` | Groq。 |
| `CEREBRAS_API_KEY` | Cerebras。 |
| `FIREWORKS_API_KEY` | Fireworks。 |
| `TOGETHER_API_KEY` | Together。 |
| `HUGGINGFACE_HUB_TOKEN` / `HF_TOKEN` | Hugging Face。 |
| `OPENROUTER_API_KEY` | OpenRouter。 |
| `MISTRAL_API_KEY` | Mistral。 |
| `XAI_API_KEY` | xAI。 |
| `ZAI_API_KEY` | Z.AI / GLM，也用于 z.ai search。 |
| `MOONSHOT_API_KEY` | Moonshot / Kimi 相关。 |
| `QWEN_OAUTH_TOKEN` / `QWEN_PORTAL_API_KEY` | Qwen Portal。 |
| `CURSOR_ACCESS_TOKEN` | Cursor Provider。 |
| `GITLAB_TOKEN` | GitLab Duo。 |
| `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | GitHub Copilot / GitHub API fallback。 |

## Auth broker

| 变量 | 用途 |
| --- | --- |
| `OMP_AUTH_BROKER_URL` | 启用远端 credential broker。 |
| `OMP_AUTH_BROKER_TOKEN` | 调用 broker 的 bearer token。 |

## Web search

| 变量 | 用途 |
| --- | --- |
| `EXA_API_KEY` | Exa。 |
| `BRAVE_API_KEY` | Brave。 |
| `PERPLEXITY_API_KEY` / `PERPLEXITY_COOKIES` | Perplexity。 |
| `TAVILY_API_KEY` | Tavily。 |
| `KAGI_API_KEY` | Kagi。 |
| `JINA_API_KEY` | Jina。 |
| `PARALLEL_API_KEY` | Parallel。 |
| `SEARXNG_ENDPOINT` | 自托管 SearXNG endpoint。 |
| `SEARXNG_TOKEN` | SearXNG bearer token。 |

## 本地模型

| 变量 | 默认值 |
| --- | --- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` |
| `LLAMA_CPP_BASE_URL` | `http://127.0.0.1:8080` |
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234/v1` |

## 运行时行为

| 变量 | 行为 |
| --- | --- |
| `PI_SMOL_MODEL` | 临时覆盖 `smol` 角色。 |
| `PI_SLOW_MODEL` | 临时覆盖 `slow` 角色。 |
| `PI_PLAN_MODEL` | 临时覆盖 `plan` 角色。 |
| `PI_NO_TITLE` | 禁用首次用户消息的自动标题。 |
| `PI_TASK_MAX_OUTPUT_BYTES` | 子代理最大捕获输出字节数。 |
| `PI_TASK_MAX_OUTPUT_LINES` | 子代理最大捕获输出行数。 |
| `PI_TIMING` | 打印启动 / 运行 timing tree。 |
| `PI_DISABLE_LSPMUX` | 禁用 lspmux 集成。 |
| `PUPPETEER_EXECUTABLE_PATH` | Browser 工具 Chromium 路径。 |
| `PI_EDIT_VARIANT` | 强制 edit 工具变体。 |
| `PI_NO_PTY` | 禁用 bash 交互 PTY。 |

## Python / eval

| 变量 | 行为 |
| --- | --- |
| `PI_PY` | `0`/`bash`=只用 JS，`1`/`py`=只用 Python，`mix`/`both`=两者。 |
| `PI_PYTHON_SKIP_CHECK` | 跳过 Python 可用性检查。 |
| `PI_PYTHON_IPC_TRACE` | 记录 Python runner NDJSON IPC。 |
| `VIRTUAL_ENV` | Python runtime venv 优先路径。 |

## Shell

| 变量 | 行为 |
| --- | --- |
| `PI_BASH_NO_CI` | 不自动注入 `CI=true`。 |
| `PI_BASH_NO_LOGIN` | shell 使用 `-c` 而非 login shell。 |
| `PI_SHELL_PREFIX` | 命令前缀 wrapper。 |
| `VISUAL` / `EDITOR` | 外部编辑器选择。 |

## TUI

| 变量 | 行为 |
| --- | --- |
| `PI_NOTIFICATIONS` | `off` / `0` / `false` 关闭桌面通知。 |
| `PI_TUI_WRITE_LOG` | 记录 TUI 写入日志。 |
| `PI_HARDWARE_CURSOR` | 启用硬件 cursor。 |
| `PI_FORCE_IMAGE_PROTOCOL` | 强制 kitty / iterm / sixel / none。 |

## 不要提交的变量

不要把以下内容写入仓库：

- 所有 `*_API_KEY`、`*_TOKEN`。
- OAuth access / refresh token。
- `AWS_*`、`GOOGLE_APPLICATION_CREDENTIALS`。
- mTLS 私钥、私有 CA。
- Search provider token。
