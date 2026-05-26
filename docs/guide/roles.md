# 模型角色

## 四种角色

角色是 omp 在特定时刻调用的命名槽位。为每个角色指定一个模型，Agent 即可自动选择正确的模型，无需额外询问。

`main`

默认模型。用于所有未被其他角色覆盖的回合——常规实现工作、交互式聊天、工具调用。

`smol`

快速且经济。用于标题生成、分类、重试摘要消息等广度优先于深度的场景。建议指定 haiku/mini/nano 级别的模型。

`slow`

深度推理。用于架构决策、棘手调试等一次错误代价远高于额外开销的场景。建议指定 Opus 级或 Codex 级别的模型。

`plan`

用于 [plan 模式](./overview.md)——`/plan` 回合和计划审查阶段。

## 配置角色

在 `~/.omp/agent/config.yml` 中设置默认值（参阅 [设置](./settings.md)）：

```
modelRoles:
  main: claude-sonnet-4-6
  smol: anthropic/claude-haiku-4-5
  slow: gpt-5.3-codex:high
  plan: claude-opus-4-6:high
```

值可以是规范 ID（`claude-sonnet-4-6`）或显式的 `provider/model` 选择器。尾部的 `:level` 指定思考级别——`off`、`minimal`、`low`、`medium`、`high`、`xhigh`。

## 启动时覆盖

每个角色都有对应的命令行参数和环境变量，可在会话级别覆盖已配置的默认值。

| 角色 | 参数 | 环境变量 |
| --- | --- | --- |
| `main` | `--model <id>` | `PI_MODEL` |
| `smol` | `--smol <id>` | `PI_SMOL_MODEL` |
| `slow` | `--slow <id>` | `PI_SLOW_MODEL` |
| `plan` | `--plan <id>` | `PI_PLAN_MODEL` |

```
omp --slow gpt-5.3-codex:xhigh --smol claude-haiku-4-5
```

## 使用 Ctrl+P 实时切换

在会话中，Ctrl+P 可在模型 ID 列表中循环切换 main 槽位。默认列表为已配置的角色（`slow` → `main` → `smol`）。通过 `--models` 可指定自定义列表：

```
omp --models sonnet,haiku:high
```

每次按下切换到下一个 ID。模式支持模糊匹配和通配符——`--models "github-copilot/*,*sonnet*"` 同样有效。Shift+Ctrl+P 反向循环；Alt+P 打开一次性选择器，不会回写到 `modelRoles`。

> 循环切换仅影响当前会话的活动模型。编辑 `config.yml` 可更改持久化默认值。

登录相关操作请参阅 [Provider](./providers.md)，为角色添加可指向的自定义 ID 请参阅 [自定义模型与 Provider](./custom-models.md)。
