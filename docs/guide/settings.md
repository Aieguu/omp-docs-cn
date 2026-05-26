# 设置

## 配置文件位置

持久化设置保存在 `~/.omp/agent/config.yml` 中（可通过 `PI_CODING_AGENT_DIR` 覆盖父目录，或通过 `PI_CONFIG_DIR` 重命名配置根目录）。该文件是纯 YAML 树；缺失的键会回退到内置默认值。

三种编辑方式：

- 在会话中使用 `/settings` — 菜单驱动，保存时自动校验。
- 在 Shell 中使用 `omp config <action>` — 脚本化编辑，参见 [CLI 参考](../reference/cli.md)。
- 使用文本编辑器 — 值在下次加载时校验；无效的键保留先前值。

```
omp config list                            # the full tree
omp config get modelRoles.default          # one key
omp config set theme.dark catppuccin-macchiato
omp config reset theme.dark                # back to schema default
omp config path                            # print the active config.yml path
```

## 优先级

从高到低：

1. CLI 标志（`--slow`、`--no-pty`、`--api-key` 等）
2. 环境变量（`PI_SLOW_MODEL`、`ANTHROPIC_API_KEY` 等）
3. `~/.omp/agent/config.yml`
4. 内置默认值

通过 `/login` 保存的 OAuth 凭据存储在与 `config.yml` 同目录的 `agent.db` 中，并遵循相同的查找顺序：数据库中的 Token 优先于同一 Provider 的环境变量。

## 顶层键

| 键 | 控制内容 |
| --- | --- |
| `theme` | 终端配色方案。`theme.dark` / `theme.light` 指定内置或用户自定义配色。 |
| `modelRoles` | 角色 → 模型映射（`default`、`smol`、`slow`、`plan`、`commit`）。参见 [模型角色](./roles.md)。 |
| `steeringMode` | 排队引导消息的排空方式：`one-at-a-time`（默认）或 `all`。 |
| `followUpMode` | 轮次 yield 后排队后续消息的排空方式：`one-at-a-time`（默认）或 `all`。 |
| `interruptMode` | `immediate`（默认）会中断正在执行的工具调用以处理引导消息；`wait` 会延迟到工具调用返回后。 |
| `tools.discoveryMode` | 磁盘上的工具是自动注册还是需要显式允许列表。 |
| `debug.enabled` | 显示 `debug` 工具和 DAP 相关流程。默认关闭。 |
| `extensions` | 自动发现之外的显式 Extension 路径。 |
| `skills` | 每个 Skill 的启用/禁用映射。 |
| `images.autoResize` | 发送前自动缩小附带的图片。默认开启。 |
| `searxng` | 自托管网络搜索端点：`endpoint`、`token`、`basicUsername`、`basicPassword`。 |

上表列出的是大多数用户会用到的键；`omp config list` 会打印 Schema 所知的全部配置，包括 Provider 相关的子树和 TUI 内部配置。

快捷键重映射不在此处——它们单独存储在 `~/.omp/agent/keybindings.json` 中。参见 [快捷键](./keybindings.md#自定义按键绑定)。

## 常用配置项

### 为每个角色选择默认模型

角色名称是稳定的；根据当前 Provider 的目录分配具体模型 ID。`omp --list-models` 可导出每个角色当前可解析的模型。

```yaml
# ~/.omp/agent/config.yml
modelRoles:
  default: anthropic/claude-sonnet-4-5
  smol:    anthropic/claude-haiku-4-5
  slow:    anthropic/claude-opus-4-6:high
  plan:    openai/gpt-5.3-codex:high
  commit:  anthropic/claude-haiku-4-5
```

`commit` 角色驱动 `/commit` 流水线；当提交消息质量下降时可升级到更强的模型，或降低到更便宜的模型用于嘈杂的仓库。

### 调优消息队列

当你在 Agent 工作时输入内容会发生什么：参见 [使用 omp](./using.md) 了解完整的时间线。

```yaml
steeringMode:  one-at-a-time   # or: all
followUpMode:  one-at-a-time   # or: all
interruptMode: immediate       # or: wait
```

### 启用调试工具

DAP 集成和 `debug` 工具会一起显示。默认关闭以保持工具面板的专注性。

```yaml
debug:
  enabled: true
```

### 选择配色方案

```yaml
theme:
  dark:  catppuccin-macchiato
  light: solarized-light
```

## 安全编辑

> 格式错误的 `config.yml` 会阻止启动。手动编辑后务必使用 `omp config list` 校验；如果 Schema 拒绝了某个键，程序会在覆盖文件内容之前以非零退出码退出。
