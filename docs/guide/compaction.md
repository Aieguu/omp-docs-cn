# 压缩

长时间的会话最终积累的文本会超过模型一次能考虑的范围。omp 通过压缩较旧的上下文、同时保留最近的对话来让工作持续推进。你通常无需做任何事：自动压缩默认处于启用状态。

先从下面的命令开始：

```
/context
```

这会显示当前激活模型的上下文窗口已使用了多少，以及在自动维护之前还剩多少空间。除非 omp 丢失了某个重要细节、上下文被臃肿的输出占据，或者你想自行决定保留哪些内容，否则照常继续工作。

## 自动压缩会做什么

当上下文接近当前模型的限制时，omp 会先移除过期的文件读取、空的搜索以及其他可以安全省略的大块结果。随后，它会按顺序尝试已配置的维护方法。默认顺序为：

1.   provider 原生的服务端压缩——当当前路由支持时；
2.   **snapcompact**——将较旧的历史归档为可供具备视觉能力的模型使用的密集图像；
3.   结构化的 **handoff** 摘要；
4.   **shake**——不发起摘要请求，直接移除可恢复的命令、搜索和文件输出内容；
5.   **soft** 压缩——用模型对较旧的历史做摘要。

当某个方法不可用或失败时，会继续尝试下一个。因此，默认顺序无需针对模型做专门配置，即可同时适用于纯文本模型与具备视觉能力的模型。

无论哪种方法成功，当前模型都会保留对话的最近尾部，并收到一份替换较旧上下文的精简版本。较旧轮次中的原文措辞不再位于模型的实时窗口中，但常规压缩不会删除原始的会话记录。

自动维护可能发生在以下时机：

*   在一条成功的响应使用量跨过阈值之后；
*   在包含许多命令或文件读取的长轮次中，于两次模型请求之间；
*   在出现上下文溢出或不完整输出的响应之后，随后进行重试之前；
*   空闲期间——但仅在明确启用了空闲压缩时。

默认情况下，omp 可以在临近阈值时预先准备摘要，从而让可见的停顿更小。跨过阈值的维护完成后，它会自动继续工作。溢出和不完整输出的恢复则会改为重试被打断的工作。

### 你会看到什么

TUI 会显示类似 `Auto server compaction…`、`Auto-snapcompact…`、`Auto-handoff…` 或 `Auto-shake…` 的状态。按 `Esc` 即可取消。压缩运行期间输入的文字会一直等待，直到维护结束。

当某个摘要方法成功后，转录会围绕一条细窄的分隔线重建，例如 `soft-compacted`、`remote-compacted` 或 `handed-off`，通常还伴随诸如 `256K→20K` 的 token 缩减。压缩前的历史默认会被折叠。按 `Ctrl+O` 可在分隔线处展开摘要。

自动 shake 则会报告 `Auto-shake completed`，并将符合条件的大段区域替换为简短占位符。当 `compaction.autoContinue: true`（默认值）时，由阈值触发的维护会继续执行，而无需等待下一条提示。

## 选择手动恢复路径

请选择与问题匹配的、破坏性最小的命令：

| 情形 | 命令 | 可见结果 |
| --- | --- | --- |
| 会话状态良好，但你想腾出更多空间，或想突出某些决定 | `/compact [focus]` | 较旧的上下文会变成一份精简的摘要/归档，出现一条压缩分隔线，然后 omp 等待你的下一条指令。 |
| 下一阶段需要一份关于目标、决定、进展和下一步的结构化说明 | `/handoff [focus]` | omp 会显示 `Generating handoff…`，然后用交接文档替换较旧的实时上下文，并报告 `Context handed off and compacted in place`。 |
| 大量命令输出、文件内容、生成的代码块、图像或已保存的推理内容挤占了对话 | `/shake [elide \| images \| thinking]` | 符合条件的大段内容会被替换为简短占位符，无需摘要请求；详见下文。 |
| 一切正常 | 无需操作 | 自动维护会在所配置的阈值处运行。 |

### `/compact`：常规的手动选择

运行 `/compact` 立即压缩，它使用第一个可用的已配置手动方法：

```
/compact
```

当较旧的上下文中包含多条线索、而其中某条最为重要时，可添加聚焦说明：

```
/compact Preserve the API decisions, unresolved test failure, and exact next steps. Treat benchmark experiments as disposable.
```

你还可以在不改动设置的情况下选择一次性方法：

| 语法 | 使用时机 |
| --- | --- |
| `/compact soft [focus]` | 你想要一份常规的、由模型撰写的摘要，并可选地引导它。 |
| `/compact remote [focus]` | 在可用时，你想要 provider 原生的、兼容 OpenAI 的压缩；它会回退到 soft 压缩。 |
| `/compact snapcompact` | 你想要使用具备视觉能力的模型进行本地图像归档，且不发起摘要请求。它不接受 focus 文本。 |

即使自动压缩被禁用，手动 `/compact` 依然可用。如果当前有响应正在运行，该命令会在压缩前中止该响应。操作期间 TUI 会显示 `Compacting context… (esc to cancel)`；成功后，分隔线与降低的上下文用量即可确认结果。

### `/handoff`：保留结构化的项目状态

当一份泛泛的对话摘要过于松散时，请使用 `/handoff`——例如在从调研转入实现之前，或当一个长任务包含许多决定与依赖时：

```
/handoff Focus on the accepted design, files already changed, verification still needed, and known risks.
```

尽管名称如此，这个手动命令目前是**就地压缩当前会话**。它不会开启后继会话，默认也不会保存 Markdown 交接文件。运行 `/handoff` 之前，请先等待当前响应结束，或中止它。交接文档包含的内容以及自动交接行为，参见 [Handoff](./handoff.md)。

### `/shake`：不做摘要直接移除大块内容

`/shake` 默认使用 `elide`：

```
/shake
```

它会将符合条件的命令、搜索和文件读取输出，以及大型的围栏代码块或类 XML 块替换为简短占位符。在持久化的会话中，omp 在可能时还会把移除的区域保存为会话工件；占位符中包含 `artifact://…` 恢复引用。如果某个被移除的结果之后变得重要，可以让 omp 从该引用恢复指定的区域。

针对性的变体更具破坏性：

| 命令 | 移除内容 | 恢复方式 |
| --- | --- | --- |
| `/shake elide` | 符合条件的大块结果与大段代码块 | 当会话可以持久化工件时，原始区域会保存为工件。 |
| `/shake images` | 会话中的图像块 | 不会创建恢复工件。 |
| `/shake thinking` | 已保存的推理块 | 不会创建恢复工件。 |

仅在相关内容已不再需要时，才使用图像或推理内容的移除。像 `Nothing to shake`、`No images found` 或 `No thinking blocks found` 这样的结果是一次成功的空操作，而非错误。

## 配置

默认值适用于大多数用户。可以通过 `/settings`、诸如 `omp config set` 之类的 shell 命令，或 `~/.omp/agent/config.yml` 中的 YAML 来修改（已有的 `config.yaml` 同样会被采用）。项目级覆盖可以放在 `<project>/.omp/config.yml` 中。

例如，以下配置在保持常规自动行为的同时，加入了空闲时的维护：

```
compaction:
  enabled: true
  idleEnabled: true
  idleThresholdTokens: 200000
  idleTimeoutSeconds: 300
```

从 shell 校验生效值：

```
omp config get compaction.enabled
omp config get compaction.methodOrder
omp config get compaction.thresholdPercent
```

在会话内运行 `/context` 可核对最终阈值与可用余量。

### 设置参考

| 设置 | 默认值 | 作用 |
| --- | --- | --- |
| `compaction.enabled` | `true` | 启用自动维护。设为 false 时，手动 `/compact`、`/handoff` 和 `/shake` 仍然可用。 |
| `compaction.methodOrder` | `[remote, snapcompact, handoff, shake, soft]` | 有序的自动回退列表。支持的值有 `remote`、`snapcompact`、`handoff`、`shake` 和 `soft`。 |
| `compaction.thresholdTokens` | `-1` | 大于零时为固定触发值。它优先于 `thresholdPercent`。 |
| `compaction.thresholdPercent` | `-1` | 大于零时为百分比触发值。`-1` 表示使用基于预留空间的自动大小。数值会被限制在 1–99% 之间。 |
| `compaction.reserveTokens` | 未设置 | 基于预留空间计算大小时使用的余量。未设置时，omp 通常预留 16,384 token 与模型窗口的 15% 中的较大者；较小的窗口会回退到按比例预留。 |
| `compaction.keepRecentTokens` | `20000` | 摘要式压缩后，按原文保留的近期对话的目标量。 |
| `compaction.midTurnEnabled` | `true` | 允许在涉及许多命令或文件读取的长轮次中的安全边界处进行维护。 |
| `compaction.asyncEnabled` | `true` | 在临近阈值时预先准备符合条件的摘要，以减少压缩提交时的停顿。 |
| `compaction.autoContinue` | `true` | 在轮次结束后的阈值维护之后自动继续。若希望脚本化或无头运行在此处停止，可设为 false。 |
| `compaction.idleEnabled` | `false` | 允许在会话空闲期间进行维护。 |
| `compaction.idleThresholdTokens` | `200000` | 触发空闲维护所需的最小上下文大小。 |
| `compaction.idleTimeoutSeconds` | `300` | 判定是否维护前的空闲时长。 |
| `compaction.handoffSaveToDisk` | `false` | 将**自动**交接生成的文档保存到磁盘。它不会让手动 `/handoff` 保存文件。 |
| `compaction.supersedeReads` | `true` | 在缓存条件允许时，同一文件被再次读取后，省去其较旧的副本。 |
| `compaction.dropUseless` | `true` | 省去不带任何有用上下文的已消耗输出，例如空的搜索或超时的等待。 |
| `compaction.remoteEndpoint` | 未设置 | 使用自定义的、兼容 OpenAI 的远程压缩端点。大多数用户应保持未设置。 |
| `compaction.remoteStreamingV2Enabled` | `true` | 在兼容的路由上使用流式远程压缩。 |
| `compaction.v2RetainedMessageBudget` | `64000` | 限制流式远程压缩保留的近期消息预算。 |

`display.collapseCompacted` 是一个相关的外观设置。它默认为 `true`，会把压缩前的历史从实时转录中隐藏，同时让摘要分隔线保持可见。若你更喜欢将完整存储的转录内联显示，可将其设为 `false`。

## 故障排查

### 自动压缩没有运行

1.   运行 `/context`。维护并不会仅仅因为会话显得很长就运行；估算的用量必须跨过解析后的阈值。
2.   检查 `omp config get compaction.enabled` 与 `omp config get compaction.methodOrder`。
3.   如果你期待的是空闲维护，请记住 `compaction.idleEnabled` 默认为 `false`，且会话必须超过 `idleThresholdTokens` 至少 `idleTimeoutSeconds`。
4.   如果某个方法不可用，让回退列表继续下去即可。例如，纯文本模型无法使用 snapcompact，但仍可继续使用 handoff、shake 或 soft 压缩。

### `/compact` 提示会话过小或已经压缩过

`Nothing to compact (session too small)` 表示没有足够多的较旧上下文可供替换。`Already compacted` 表示在最近一次边界之后没有新增多少实质历史。继续工作并稍后再试即可；无需任何恢复操作。

### Snapcompact 失败

Snapcompact 需要一个具备视觉能力的当前模型，以及其内置图像字体能够表示的文本。如需可预测的文本摘要，请使用 `/compact soft`。当当前 provider 支持服务端压缩时，`/compact remote` 是另一个选项。

### 上下文仍然过大

运行 `/context` 来判断是消息还是大段的过往结果占据主导。大段输出请先使用 `/shake`；当对话本身很大时，使用 `/compact soft`。如果反复出现这种情况，可降低 `compaction.thresholdPercent`、减小 `compaction.keepRecentTokens`，或选择上下文窗口更大的模型，而不是坐等溢出。

### 某个重要的旧细节丢失了

在压缩分隔线上按 `Ctrl+O` 查看生成的摘要。常规压缩会保留底层的会话历史，因此请使用[会话树](./sessions.md)从更早的点回看或分叉。对于以后的手动压缩，请加入明确的聚焦说明，或使用 `/handoff` 以获得更结构化的延续。由 `/shake images` 或 `/shake thinking` 移除的内容不会保存在恢复工件中。

## 相关

*   [Handoff](./handoff.md) —— 结构化的延续摘要与自动交接行为。
*   [Sessions](./sessions.md) —— 已保存的历史、恢复、分支与会话树。
*   [Settings](./settings.md) —— 配置文件、优先级、`/settings` 与 `omp config`。
*   [Memory](./memory.md) —— 跨会话的持久事实；与上下文压缩相互独立。
