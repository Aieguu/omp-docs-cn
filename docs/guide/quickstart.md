# 快速上手

## 安装

omp 以 Bun 可运行包和预构建二进制文件两种形式发布。选择下面任一方式，最终都会在你的 `PATH` 上生成一个 `omp` 可执行文件。

| 方式 | 命令 | 适用场景 |
| --- | --- | --- |
| Bun | `bun install -g @oh-my-pi/pi-coding-agent` | 你已有 Bun >= 1.3.14。 |
| 安装脚本 | `curl -fsSL https://raw.githubusercontent.com/can1357/oh-my-pi/main/scripts/install.sh \| sh` | 其他情况。优先使用 Bun，不可用时使用预构建二进制。Windows：将对应的 `install.ps1` 管道到 `iex`。 |
| mise | `mise use -g github:can1357/oh-my-pi` | 按项目锁定版本。 |

安装脚本接受 `--source`（强制使用 Bun）、`--binary`（强制使用预构建）和 `--ref <tag|branch|commit>` 用于版本锁定。设置 `PI_INSTALL_DIR` 可覆盖安装目录。

### 验证安装

```
omp --version           # PATH 上的二进制版本
omp config path         # 当前 agent 目录（包含 config.yml）
omp -p 'hello'          # 发送一次 one-shot prompt 进行往返测试
```

升级命令、频道锁定和离线二进制，请参阅 [CLI 参考](../reference/cli.md)。

## 终端设置

omp 使用 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/)，因此可以区分 Shift+Enter 和 Enter，并可靠识别 Alt 组合键。**Kitty** 和 **iTerm2** 无需配置即可使用。**Ghostty** 需要在 `~/.config/ghostty/config` 中添加两个键绑定：

```
keybind = alt+backspace=text:\x1b\x7f
keybind = shift+enter=text:\n
```

**wezterm** 需要在 `~/.wezterm.lua` 中设置 `config.enable_kitty_keyboard = true`。**Windows Terminal** 不支持该协议；请使用 Ctrl+Enter 代替 Shift+Enter 换行。

## 身份验证

有两种方式接入 Provider：启动前设置环境变量，或在 TUI 内使用 `/login` 进行 OAuth 认证。完整 Provider 列表请参阅 [Providers](./providers.md)。

### 方式一 — 环境变量

使用 Anthropic 最快的上手方式：

```
export ANTHROPIC_API_KEY=sk-ant-...
omp
```

其他常见密钥：`OPENAI_API_KEY`、`GEMINI_API_KEY`、`XAI_API_KEY`、`GROQ_API_KEY`、`MISTRAL_API_KEY`、`OPENROUTER_API_KEY`、`ZAI_API_KEY`。完整映射请参阅 [环境变量](../reference/env.md)。

### 方式二 — `/login`

对于 Claude Pro/Max、ChatGPT Plus/Pro、GitHub Copilot、Cursor、Z.AI 及其他订阅制 Provider，启动 omp 后在内部完成认证：

```
omp
/login
```

你将看到一个按字母排序的选择器。`/login` 追加凭据，不会覆盖；`/logout` 清除所选 Provider。对于同一 Provider，已保存的 API key 优先于 OAuth。所有凭据存储在 `~/.omp/agent/agent.db` 中——迁移机器时请备份该文件。

## 第一次对话

在任意项目目录下运行 `omp`：

```
omp
```

首次启动会创建 `~/.omp/agent/`，检测终端的亮/暗模式和 Kitty 支持，并渲染欢迎面板。当前工作目录成为项目根目录；`AGENTS.md` 和规则文件从该位置发现。输入 prompt 开始：

```
summarise src/main.ts
```

Agent 选择工具，TUI 将调用渲染为紧凑卡片，响应流式返回。Ctrl+O 展开卡片查看完整工具输出。

One-shot 模式（无 TUI，单轮后退出）：

```
omp -p "list .ts files in src/"
```

## 后续阅读

- [使用 omp](./using.md) — 编辑器、消息队列、模式。
- [键绑定](./keybindings.md) — 日常使用的快捷键。
- [Slash 命令](./slash-commands.md) — 聊天内参考。
- [会话](./sessions.md) — 恢复、分叉、分支。
- [Plan 模式](./plan.md) — 大规模变更前的规划。
