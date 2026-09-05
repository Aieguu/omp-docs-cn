# Advisor 模型

## 增加第二双眼睛

advisor 是一个独立的模型，会在会话推进的过程中评审主 agent 的工作。它可以在主 agent 仍有机会纠正方向时，指出被遗漏的需求、有风险的 API、薄弱的验证或不必要的复杂性。在耗时较长或高风险的大型改动、不熟悉的代码仓库、涉及安全的工作，或任何独立评审比极致速度更有价值的场合，都可以启用一个。

这个取舍是真实的：advisor 会发起自己的模型请求，使用自己的上下文，并被单独计费。更大的模型可能捕捉到更细微的问题，但成本也更高；多个 advisor 会让这种用量成倍增加。评审通常发生在后台，但一条重要的批注可能引发更多的主 agent 工作，而可选的补追（catch-up）设置会带来延迟。对于例行的编辑，请关闭它，或选择一个快速、低成本的评审者。

最小且持久的配置是在 [`~/.omp/agent/config.yml`](./settings.md) 中加入两个条目：

```
modelRoles:
  advisor: anthropic/claude-sonnet-4-5:medium

advisor:
  enabled: true
```

可以使用你安装中任何可用的模型选择器。编辑文件后重启 omp，或开启一个新的会话，然后检查它：

```
/advisor status
```

如果没有 `WATCHDOG.yml` 名册，omp 会使用 `modelRoles.advisor` 创建一个默认 advisor。如果该角色无法解析到某个可用且已认证的模型，那么这个功能虽已配置，却无法运行。

## 会话期间会发生什么

advisor 会跟随新的用户提示词、主 agent 的回复、推理过程与工具活动。它的默认工具让它能够阅读和搜索项目，因此它可以核实各种断言，而不只是审阅文字本身。它不会批准主 agent 的操作，它的建议也并非自动正确：主 agent 会被指示把每条批注与你的请求放在一起权衡，而不是盲目遵从。

被采纳的批注会以三种严重级别之一明确显示在会话中：

| 严重级别 | 含义 | omp 会做什么 |
| --- | --- | --- |
| `nit` | 清理、简化或低风险的边界情况。 | 在某个安全边界处添加一条不打断流程的旁注。 |
| `concern` | 实质性风险、被遗漏的约束或很可能走错的方向。 | 可以引导仍在运行的工作；在某条回答完成之后才出现的迟到批注，会保留下来供下一个轮次查看。 |
| `blocker` | 继续下去很可能浪费工作，或产生一个残缺的结果。 | 可以中断进行中的工作，甚至在名义上已经完成的回答之后也能触发后续消息。 |

只有 `blocker` 可以中断尚未完成的评审过程。重复或无实质内容的批注会被抑制；一次中断之后，omp 通常会先让主 agent 运行若干轮次，才会允许下一个 advisor 中断。如果你有意停住 agent，advisor 的批注会保持可见，而不会意外地把它重新启动。在计划模式中，批注同样会展示给你权衡，而不是自动去引导计划。

请把批注当作有依据的评审意见，而不是新的用户指令。如果主 agent 拒绝了有用的建议，请在下一个提示词中引用那条可见的批注。如果 advisor 制造了太多噪音，请为本会话关闭它，或在 `WATCHDOG.md` 中收窄它的关注点。

## 检查并控制它

| 命令 | 结果 |
| --- | --- |
| `/advisor` | 为本会话切换所有已配置的 advisor。 |
| `/advisor on` | 为本会话启用或重建它们。这不会保存 `advisor.enabled`。 |
| `/advisor off` | 为本会话停止它们。这不会改动你的配置文件。 |
| `/advisor status` | 显示每个 advisor 的状态、模型、上下文用量、token 用量与成本。 |
| `/advisor dump` | 把一份紧凑的 advisor 转录复制到剪贴板。 |
| `/advisor dump raw` | 复制完整的诊断转储，包括指令、思考过程与工具活动。请把它当作敏感数据处理。 |
| `/advisor configure` | 打开面向项目级或用户级 `WATCHDOG.yml` 的交互式编辑器。仅限 TUI。 |

裸的 `/advisor` 是一个切换开关，而不是状态命令。会话级的切换是临时的；当你希望这个选择被持久化时，请编辑 [`config.yml`](./settings.md)。

## 为评审者提供项目特定的优先级

把只给评审者看的指引放进 `WATCHDOG.md`。这里最适合放置架构边界、危险的 API、反复出现的失败模式，以及你在改动被认定为完成之前期望看到的证据。它能在引导 advisor 的同时，不把同样的内容塞进主 agent 的常规上下文。

```
# Review priorities

Especially watch for:

- Writes that bypass the durable queue in `src/jobs/`.
- User-controlled text rendered without escaping.
- Schema changes without a backwards-compatible rollout.
- Claims of success that are not supported by a focused runtime check.
```

请把它写得足够具体，足以改变一次评审决策。像“写出好代码”这样笼统的请求只会增加成本，而几乎产生不了信号。

omp 会按下面的路径加载每一个可读的 `WATCHDOG.md`：

1.  当前生效的用户 agent 目录，通常是 `~/.omp/agent/WATCHDOG.md`；
2.  当前目录中的 `WATCHDOG.md` 与 `.omp/WATCHDOG.md`；
3.  自当前目录向上每一层父目录中的同样两个位置，直到 Git 根目录；当没有 Git 根目录时，则直到你的主目录。

用户文件是宽泛的指引。项目文件从外层目录向当前目录应用，因此更具体的指引最为突出。各文件是累积生效的，而不是由最近的文件取代其他文件。你也可以在 watchdog 文件中写一行类似 `@review/security.md` 的内容来导入另一个文件；相对路径以导入文件所在的目录为基准解析，而位于行内代码或围栏代码块内的导入保持字面原样。

## 配置多个专项 advisor

当一个评审者不够用时，使用 `WATCHDOG.yml` 或 `WATCHDOG.yaml`。该文件声明一份名册；一旦发现任何名册条目，该名册就会取代单一默认 advisor 的安排。

```
instructions: |
  Prefer fixes that preserve public APIs and keep tests focused.

advisors:
  - name: Architecture
    enabled: true
    model: anthropic/claude-sonnet-4-5:medium
    tools: [read, grep, glob]
    instructions: |
      Watch module boundaries, dependency direction, and public API growth.

  - name: Security
    enabled: true
    model: openai/gpt-5.5:high
    tools: [read, grep, glob]
    instructions: |
      Trace untrusted input through authentication, storage, and rendering.

  - name: Release
    enabled: false
    tools: []
    instructions: |
      Check migrations, compatibility, and rollback instructions.
```

| 字段 | 用途 |
| --- | --- |
| 顶层 `instructions` | 来自所有已发现名册文件的共享指引，会添加到每一个 advisor 上。 |
| `name` | 必填的显示名称。名称也用于识别条目在优先级归属上的位置；标点与空白会规范化为一个 slug。 |
| `enabled` | 每个 advisor 的开关。默认 `true`；`false` 会让该条目以“已暂停”状态保留可见。 |
| `model` | 可选的模型选择器与思考级别。省略时，该条目使用 `modelRoles.advisor`。 |
| `tools` | 可选的内置工具。省略时提供 `read`、`grep` 与 `glob`；`[]` 表示不提供调查工具。 |
| `instructions` | 该 advisor 的专业方向。它支持与 `WATCHDOG.md` 相同的 `@` 导入。 |

名册文件使用与 `WATCHDOG.md` 相同的用户、父目录、当前目录与 `.omp/` 发现位置。所有被发现的文件都会参与。共享的顶层指引会累积叠加；当两个条目规范化后同名时，更具体的项目条目会取代父目录或用户的条目。请避免在同一目录层级把同名条目定义两次，也不要同时保留 `.yml` 与 `.yaml` 两种变体——这样的结果更难推敲。无效的 YAML 或无效的 schema 会被记录到日志，该文件会被跳过，而不会破坏主会话。

### 工具授权是一道安全边界

默认的 `read`/`grep`/`glob` 授权适合评审用途。名册可以授予其他内置工具，包括 `edit`、`write`、`bash`、`eval` 或 `browser`。这些授权可以改动文件、运行命令，或通过其他服务发送数据。常规的审批与按工具（per-tool）策略仍然适用，但宽松的审批模式未必能拦住一次危险的操作。请只把会改动状态或联网的工具授予你信任的模型，并且仅在专项评审者确实需要时才这样做。

未知的工具名会被丢弃并给出警告。改动名册后，请检查 `/advisor status` 与日志，而不要想当然地认为某个拼错的工具已被授予。

## 成本、延迟与监督设置

这些可选设置位于 [`config.yml`](./settings.md)：

```
advisor:
  enabled: true
  syncBacklog: "1"
  immuneTurns: 3

tier:
  advisor: none
```

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `advisor.syncBacklog` | `off` | `off` 表示永不等待评审补追。当评审落后到这么多轮次时，`"1"`、`"3"` 或 `"5"` 会让主 agent 最多暂停 30 秒；`"1"` 最接近同步评审。请在 YAML 中给数值加引号，因为它们是枚举字符串。 |
| `advisor.immuneTurns` | `3` | 一次中断之后主 agent 的轮次数；在此期间，进一步的 concern 与 blocker 会变成不打断流程的旁注。用 `0` 获得最大监督，或用更大的值来减少反复打扰。 |
| `tier.advisor` | `none` | advisor 请求的服务档位。`inherit` 跟随主模型当前生效的 Provider 系列档位；具体的档位只在 Provider 支持它们时才生效。 |

即使启用了补追，advisor 的问题也不会让主 agent 永久停滞：补追的等待是有上限的，遇到失败就会释放。

## 一次性与无头运行

在不改动持久化设置的前提下，为某一个 print 模式进程启用评审：

```
omp -p --advisor "Audit this migration plan and report the safest rollout."
```

`--advisor` 会为该进程启用已配置的默认 advisor 或名册；它仍然需要可解析的 advisor 模型与 Provider 凭据。print 模式会在结束前等待最终评审，以免迟到的批注被静默丢弃，这可能让命令比普通的 `-p` 运行更晚结束。请在自动化中审慎地使用它，并同时把额外的模型成本与更长的完成时间计入考量。其他启动标志参见 [CLI 参考](../reference/cli.md)。

## 隐私与安全

启用 advisor 会把会话材料发送给 advisor 模型所属的 Provider。这包括你的提示词、主 agent 的输出与推理，以及相关的工具结果；调查类工具可能暴露它们读取到的任何文件。会话托管的密钥在发送给 Provider 的 advisor 消息前会被混淆处理，但这不能替代“选择有权处理该仓库的 Provider 与模型”。多 Provider 的名册可能把同一份项目上下文发送给多家厂商。

advisor 的轮次与用量会随所属会话一并记录，以便成本报告与后续检查。`/advisor dump raw` 包含的细节远多于紧凑转储；在把它粘贴到 issue 或聊天中之前，请先审阅它。关闭 advisor 会停止新的评审，但不会抹除已经记录的会话工件。

omp 会在不安全的 advisor 输出被用于分派工具或引导主 agent 之前将其拒绝。这是纵深防御，而不是授予宽泛工具的许可：请维持最小权限的名册，保留常规的审批策略，并亲自检查任何拟议的高影响改动。

## 故障排查

*   **“Advisor setting is enabled, but no model is assigned” / `no model`** —— 设置 `modelRoles.advisor`，或为每一个已启用的名册条目添加有效的 `model`。用 `/model` 与 `/login` 确认 Provider 已安装且已认证，然后依次运行 `/advisor off` 与 `/advisor on`。
*   **某个 advisor 显示为 `paused`** —— 它的名册条目是 `enabled: false`，或者该子系统在本会话中被关闭。在 `WATCHDOG.yml` 中启用该条目（或用 `/advisor configure`），然后运行 `/advisor on`。
*   **某个 advisor 显示为 `quota exhausted`** —— 其 Provider/账户在回退恢复无法继续之后触达了用量上限。修复凭据、配额或模型选择，然后切换 advisor 的关闭与开启、重新加载配置，或开启一个新会话。
*   **某个 advisor 显示为 `error`** —— 反复或持久的请求失败让该评审者停摆，以便主 agent 得以继续。检查 Provider/模型的可用性与日志，然后用 `/advisor off` 与 `/advisor on` 重建它。
*   **名册中某个成员失败，而其他成员仍在运行** —— 各条目相互独立。修复该成员的 model 或 enabled 状态即可；其余成员可以继续评审。
*   **对 `WATCHDOG.yml` 的改动没有出现** —— 检查文件名与 YAML 形态，确认 omp 运行在你预期的那棵项目树中，然后在手动编辑文件后重启 omp。通过 `/advisor configure` 保存的改动会立即生效。格式错误的文件会被跳过并在日志中报告。
*   **评审成本太高或太分心** —— 选择更便宜的模型、精简名册、保持 `syncBacklog: off`、调高 `immuneTurns`、收窄 watchdog 指引，或在例行工作中使用 `/advisor off`。
*   **迟到的 concern 没有重新启动 agent** —— 在已经完成的回答之后、在你主动中断之后，以及在计划模式中，这都符合预期。当你用一条新的提示词或“继续”快捷键继续时，那条可见的批注会被包含进去。
