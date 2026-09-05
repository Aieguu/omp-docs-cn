# 会话格式

omp 将会话保存为换行分隔的 JSON（JSONL）：每个物理行一个 JSON 对象。在审计一段对话、编写导出器、在不同机器之间迁移会话，或修复损坏的文件时，你都可能会接触到它。

最安全的第一步是只读检查：先在 omp 数据目录下找到会话，然后在做任何变换之前复制 JSONL 文件：

```
find ~/.omp/agent/sessions -name '*.jsonl' -print
jq -c . ~/.omp/agent/sessions/<project>/<session>.jsonl
```

在默认安装中，根目录是 `~/.omp/agent/sessions`。XDG 或 agent 目录配置可以重新定位它。项目目录名是实现细节；应通过查找来发现文件，而不是拼出路径。普通的交互式文件名是 `<filesystem-safe-timestamp>_<session-id>.jsonl`。子代理会话也可能出现在父会话的同级工件目录之下。

把活动中的文件当作日志来对待：不加锁地读取，容忍末尾可能的不完整行，并在轮次结束后重试该行。要制作持久的归档或进行迁移，先关闭持有它的 omp 进程，再把 JSONL 连同 blob 存储一起复制（见[可移植性与脱敏](#可移植性与脱敏)）。omp 运行期间不要原地编辑会话。虽然大多数记录是追加写入的，但 omp 可能在迁移或维护期间重写文件，而且它那固定宽度的 title 记录会被有意地原地更新。

面向用户的恢复、分叉和分享工作流，请参见 [会话](../guide/sessions.md)。

## 物理文件布局

新建的版本 3 文件通常具有以下顺序：

1.   一个可选的固定宽度 `title` 记录（当前 omp 会写入它）；
2.   恰好一个 `session` header；
3.   零个或多个树条目。

每个对象占据一行。空白行或格式错误的行不属于该格式。omp 的读取器会跳过格式错误的记录，但一次可写的恢复操作以后可能会在不含这些记录的情况下重写文件，所以要修复一份副本，而不要依赖那种恢复行为。

### 可变的 title 记录

物理上的第一行是 256 个 UTF-8 字节（含换行符）。填充位于 JSON 字符串内部，因此它依然是合法的 JSON：下面示例中的 `pad` 值为了便于阅读已被缩短。

```
{"type":"title","v":1,"title":"refactor importer","source":"user","updatedAt":"2026-05-14T10:14:22.000Z","pad":"                                  "}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `"title"` | 物理 title 槽位的判别字段。 |
| `v` | `1` | title 记录自身的格式版本，独立于会话 schema 版本。 |
| `title` | string | 当前标题；可以为空，也可能被截断以适配该槽位。 |
| `source` | `"auto"` 或 `"user"` | 由 omp 还是用户选定。 |
| `updatedAt` | string | ISO 8601 更新时间。 |
| `pad` | string | 用于让记录恰好保持 256 字节的空格填充。忽略它。 |

旧版文件可以直接以 `session` header 开头。解析器应当同时通过 `type: "title"` 与 `v: 1` 识别 title 记录，把它从逻辑条目流中移除，并将其 `title` 和 `source` 覆盖到 header 元数据上。不要假定第一个物理对象就是 header。

## 会话 header（版本 3）

当前逻辑格式版本是 **3**。第一个逻辑对象是：

```
{"type":"session","version":3,"id":"019700f1-1a2b-7c3d-8e4f-aabbccddeeff","timestamp":"2026-05-14T10:12:03.000Z","cwd":"/Users/me/src/api","additionalDirectories":["/Users/me/src/shared"],"title":"refactor importer","titleSource":"user"}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `"session"` | header 判别字段。 |
| `version` | `number?` | schema 版本。缺失表示版本 1；当前写入方输出 `3`。 |
| `id` | string | 会话身份。当前写入方使用 UUIDv7；请把它当作不透明值。 |
| `timestamp` | string | ISO 8601 创建时间。 |
| `cwd` | string | 保存时的绝对主工作目录。 |
| `additionalDirectories` | `string[]?` | 多根工作区中额外的绝对根目录。 |
| `title` | `string?` | header 标题，逻辑上会被已识别的物理 title 记录覆盖。 |
| `titleSource` | `"auto"` 或 `"user"` | header 标题的来源。 |
| `parentSession` | `string?` | 仅用于谱系：完整分叉的来源会话 ID，或复制到新文件的分支的来源 JSONL 路径。 |
| `previousSessionFiles` | `string[]?` | 成功移动后记录的先前绝对 JSONL 位置。 |
| `providerPromptCacheKey` | `string?` | 不透明的 provider 回放/缓存身份。保留它，但不要解读或生成它。 |

版本 1 没有 `version` 字段，是线性的。加载它会分配条目 ID 与父链接。版本 2 已经有树形信封；版本 3 在迁移期间重命名了旧的 `hookMessage` 角色。omp 会在内存中迁移旧文件，并可能在下次可写操作时重写它们。只有当你的集成无法保留未知数据时，才应拒绝未来的版本；否则请保留未知字段与记录。

## 树条目信封与分支

header 之后的每个逻辑对象都是一个带有如下公共信封的条目：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | string | 条目判别字段。 |
| `id` | string | 条目身份。通常是 8 字符的十六进制 ID，但冲突回退与导入的数据意味着解析器必须把它当作不透明的非空字符串。 |
| `parentId` | string \| null | 该分支上的前一条目；`null` 表示根路径的开端。 |
| `timestamp` | string | ISO 8601 持久化时间。这与消息级的时间戳不同，后者以 Unix 毫秒为单位。 |

数组顺序即日志顺序，而不是摊平后的对话。先构建 `id → entry` 映射，再构建 `parentId → children` 映射。分支是指从选定的叶子(节点)出发，沿 `parentId` 追溯到 `null`、再反转结果所得的祖先链。同一父条目的多个子条目互为兄弟分支。

该文件**不会**持久化单独的 active-leaf（活动叶子）字段。加载时，omp 起初根据文件顺序从最后一个逻辑条目推导出叶子；交互式树导航只能在内存中选择另一个叶子。下一条追加的条目会把所选条目作为其父条目，然后自己成为最后一条记录。因此：

*   不要仅凭时间戳推断当前分支；
*   不要假定每条记录都属于同一份线性对话记录；
*   检测重复 ID、缺失父条目、自链接以及更长的环；
*   往返处理时保持文件顺序，因为它提供了初始叶子。

`parentSession` 关联文件，而 `parentId` 关联单个文件内的条目。两者都不保证被引用的来源仍然存在。

## 消息条目

消息条目包裹一条持久化的 agent 消息：

```
{"type":"message","id":"1f9d2a0b","parentId":null,"timestamp":"2026-05-14T10:12:05.000Z","message":{"role":"user","content":[{"type":"text","text":"refactor the importer to stream"}],"timestamp":1778753525000}}
{"type":"message","id":"1f9d2b0c","parentId":"1f9d2a0b","timestamp":"2026-05-14T10:12:06.000Z","message":{"role":"assistant","content":[{"type":"text","text":"Reading the file first."},{"type":"toolCall","id":"toolu_01","name":"read","arguments":{"path":"src/importer.ts"}}],"api":"anthropic-messages","provider":"anthropic","model":"claude-opus-4-6","usage":{"input":1200,"output":45,"cacheRead":0,"cacheWrite":0,"totalTokens":1245,"cost":{"input":0.01,"output":0.01,"cacheRead":0,"cacheWrite":0,"total":0.02}},"stopReason":"toolUse","timestamp":1778753526000}}
{"type":"message","id":"1f9d2c0d","parentId":"1f9d2b0c","timestamp":"2026-05-14T10:12:07.000Z","message":{"role":"toolResult","toolCallId":"toolu_01","toolName":"read","content":[{"type":"text","text":"file contents"}],"isError":false,"timestamp":1778753527000}}
```

### 消息角色

| 角色 | 必需结构 | 常见的可选持久化数据 |
| --- | --- | --- |
| `user` | `content: string \| (text \| image)[]`、`timestamp: number` | `synthetic`、`steering`、`attribution`、不透明的 `providerPayload` |
| `developer` | 与 user 相同的 content 和 timestamp 结构 | `attribution`、不透明的 `providerPayload` |
| `assistant` | `content: block[]`、`api`、`provider`、`model`、`usage`、`stopReason`、`timestamp: number` | 响应/错误 ID 与详情、耗时/TTFT、上下文快照、重试恢复、被禁用的功能、不透明的 `providerPayload` |
| `toolResult` | `toolCallId`、`toolName`、`content: (text \| image)[]`、`isError`、`timestamp: number` | `details`、`attribution`、`prunedAt`、`useless`、provider 元数据 |

当前 `stopReason` 的取值有 `stop`、`length`、`toolUse`、`error` 和 `aborted`。assistant 的 `usage`、错误元数据、provider 载荷、签名以及工具 `details` 会随 provider 和工具而变化。保留未知字段；只需一份对话记录的消费方可以忽略它们。

### 内容块

| `type` | 使用位置 | 核心字段 |
| --- | --- | --- |
| `text` | user、developer、assistant、tool result | `text: string`；可选的、不透明的 `textSignature` |
| `image` | user、developer、assistant、tool result | `data: string`、`mimeType: string`；可选的 `detail`、provider 文件引用或 URL |
| `thinking` | assistant | `thinking: string`；可选的、不透明的 `thinkingSignature` 和 `itemId` |
| `redactedThinking` | assistant | 不透明的 `data: string` |
| `toolCall` | assistant | `id: string`、`name: string`、`arguments: object`；可选的签名、意图、raw/provider 元数据 |
| `fallback` | assistant | provider 特定的 `{ from: { model }, to: { model } }` 边界 |
| `anthropicServerTool` | assistant | 不透明的、provider 原生的 `block`，为回放而保留 |

通过 `message.toolCallId === block.id` 把 `toolResult` 消息与 `toolCall` 块配对；在分支路径上，仅仅相邻并不足够。悬空的调用可能是正在进行的调用、被打断的轮次，或者结果只存在于某个兄弟分支上的调用。

消息内容可能包含密钥、源代码文本、命令输出、图像、已签名的推理内容以及 provider 的回放载荷。它不是一份经过净化的对话记录。

## 非消息条目类型

这些条目都包含公共的树信封。

| 类型 | 持久化的载荷与含义 |
| --- | --- |
| `thinking_level_change` | `thinkingLevel?: string \| null`、`configured?: string \| null`。选定路径上的最新取值会影响之后的轮次。 |
| `model_change` | `model: "provider/model"`、可选的 `role`、可选的 `resolvedModelIsFallback`。`role` 默认为 `default`；`fallback` 是临时的重试角色。 |
| `service_tier_change` | `serviceTier: object \| null`。保留 provider 家族的映射；不要假定只有一个标量层级。 |
| `mode_change` | `mode: string`（`none` 表示退出某个模式）、可选的、模式特定的 `data`。 |
| `compaction` | `summary`、`firstKeptEntryId`、`tokensBefore`；可选的 `shortSummary`、`tokensAfter`、`method`、回放标记、`details`、`preserveData`、`fromExtension`、`warning`。它记录一次上下文重写；不会删除更早的日志条目。 |
| `branch_summary` | `fromId`、`summary`；可选的 `details`、`fromExtension`。它总结一条已放弃的路径，而且它本身是新路径上的子条目。 |
| `reset_boundary` | 无载荷。`/clear` 把它作为重建活动上下文时的持久化边界，而完整的持久化历史仍可供对话记录导出使用。 |
| `label` | `targetId`、`label?: string`。非空的 label 会设置/替换目标的 label；label 缺失则移除它。按文件顺序解析 label。 |
| `title_change` | `title`、可选的 `previousTitle`、`source: "auto" \| "user"`、可选的 `trigger`。只追加的审计历史；物理 title 记录会高效地提供当前标题。 |
| `ttsr_injection` | `injectedRules: string[]`。针对选定路径的持久化规则登记。 |
| `credential_pin` | `provider`、`hash`。这是用于回放亲和性的化名凭据/范围摘要——它不是密钥，也不是匿名的。 |
| `session_init` | 子代理回放/调试元数据：`systemPrompt`、`task`、`tools`，再加上可选的 agent/model、schema、工具限制、spawn、read-summary 和 advisor 字段。它可能包含高度敏感的提示词和任务。 |

有些条目会影响重建的模型上下文（`message`、压缩与分支总结、重置、模式/模型/思考级别变更）；其他条目则只是元数据。那是运行时策略，而不是对每个持久化对象都会原样出现在可见对话记录中的承诺。

## 扩展拥有的条目

扩展有两种公共的持久化形态：

```
{"type":"custom","id":"a1b2c3d4","parentId":"1f9d2c0d","timestamp":"2026-05-14T10:12:08.000Z","customType":"com.example.review-state","data":{"approved":true}}
{"type":"custom_message","id":"b2c3d4e5","parentId":"a1b2c3d4","timestamp":"2026-05-14T10:12:09.000Z","customType":"com.example.policy","content":"Use the approved migration plan.","display":true,"details":{"policyVersion":2},"attribution":"agent"}
```

*   `custom` 带有 `customType: string` 和可选的 JSON `data`。它持久化扩展状态，不进入模型上下文。
*   `custom_message` 带有 `customType`、`content: string | (text | image)[]`、`display: boolean`、可选的 JSON `details`，以及可选的 `attribution: "user" | "agent"`。它确实参与模型上下文；`display` 控制 TUI 是否渲染它。

为 `customType` 做命名空间划分（例如使用反转域名），在 `data` 或 `details` 内部对你的载荷做版本化，并容忍你不理解的版本。第三方解析器应当保留未知的条目类型，而不应把当前内置的类型列表当作穷尽的。

## 持久化限制与 sidecar blob

JSONL 是一份持久化的回放日志，并不总是运行时对象的逐字节转储：

*   超过 500,000 字符的大多数字符串会被截断，并附上持久化提示；
*   当截断会破坏回放时，已签名/已加密/provider 原生的回放块会保持原样；
*   临时的 `jsonlEvents` 数据会被移除；
*   足够大的图像载荷会从 `image.data`（以及某些嵌套的图像字段）外部化为 `blob:sha256:<64-lowercase-hex>` 引用。

Blob 字节存放在 omp 的 blob 存储中，通常是 `~/.omp/agent/blobs/<sha256>`。哈希基于原始二进制字节。因此，一份独立的 JSONL 副本即使能被正确解析，也可能不完整。请保留整个 blob 存储，或复制每个被引用的、无扩展名的哈希文件。应当拒绝格式错误的 blob 引用，而不是把其后缀解释为路径。

## 可移植性与脱敏

要进行忠实的迁移：

1.   停止或分离正在写入该会话的进程；
2.   复制 JSONL，不改变记录顺序或不透明字段；
3.   复制被引用的 blob；
4.   决定 `cwd`、`additionalDirectories`、`parentSession` 和 `previousSessionFiles` 中的绝对路径是否应该被重新映射；
5.   先从新位置打开副本并校验其树结构，再删除源文件。

文件名中的会话 ID 通常与 `header.id` 一致，但导入方应当校验，而不是仅凭文件名推导身份。`parentSession` 和先前的文件路径是来源信息，移动之后可能仍是过时的。

在分享之前，假定以下所有位置都存在敏感数据：

*   user/developer 消息、工具参数、工具结果和自定义条目；
*   assistant 的思考内容、脱敏/加密块、provider 载荷和错误文本；
*   `session_init` 的系统提示词和任务；
*   绝对路径和标题；
*   图像 blob 以及 provider 原生的文件/响应标识符；
*   `credential_pin.hash`——当其输入可被猜测时，它可以被关联起来。

脱敏可能使已签名的推理内容、加密的回放历史、工具调用/结果配对、压缩引用或 blob 哈希失效。当不需要回放时，导出一份刻意有损的对话记录。如果回放很重要，就在副本上进行结构性脱敏：保留 ID 与父链接，在合适之处移除整对敏感块，并预期 provider 的缓存/回放元数据会变得不可用。

## 校验与故障排查

一个实用的校验器应当报告问题，而不是静默修复：

1.   每个非空白的物理行都是一个 JSON 对象；
2.   可选的第一个对象是一条合法的 `title` v1 记录；
3.   第一个逻辑对象是 `type: "session"`，且带有字符串 `id`；
4.   版本受支持（缺失表示旧版 v1；当前为 3）；
5.   此后的每个对象都有字符串 `type`、字符串 `id`、字符串 `timestamp`，以及为字符串或 `null` 的 `parentId`；
6.   条目 ID 唯一，且每个非 `null` 的父条目都能解析；
7.   父条目遍历在无环的情况下终止；
8.   被引用的 `firstKeptEntryId`、`targetId` 和工具调用 ID 在其语义要求之处都能解析；
9.   每个规范的 blob 引用都有对应的哈希文件；
10.   最后一条逻辑记录被记录为默认的恢复叶子。

有用的只读检查：

```
# Parse every physical record and show its discriminator.
jq -r '.type' session.jsonl

# Keep file order while inspecting tree links.
jq -c 'select(.id and has("parentId")) | {type,id,parentId,timestamp}' session.jsonl

# List external blob references conservatively.
grep -o 'blob:sha256:[a-f0-9]\{64\}' session.jsonl | sort -u
```

如果 jq 只在一个活动会话的最后一行上失败，等待写入方完成后重试。如果 omp 报告格式错误的记录，保留原始文件，找出有问题的物理行，并修复副本。如果会话在意外分支上打开，检查最后一条逻辑条目及其祖先链。如果迁移后图像缺失，恢复被引用的 blob 哈希。如果旧文件在恢复后发生变化，那可能是正常的版本/title 槽位迁移，而不是 JSONL 严格只追加的证据。

## 持久化数据与运行时状态

已持久化且可重建的：

*   header/工作区元数据与文件谱系；
*   有序的条目树、消息、label、重置边界、总结和扩展记录；
*   每条分支上记录下来的 model、模式、思考级别、层级、凭据亲和性、用量和 provider 回放元数据；
*   由最后一条逻辑记录隐含的默认叶子。

不作为稳定的文件格式状态来表示的：

*   已被交互式选择、但尚未引起任何追加的叶子；
*   进行中的流式增量、待处理的工具执行状态、队列、锁以及已打开的写入句柄；
*   精确生成的模型上下文或可见的 TUI 对话记录（两者都按当前运行时策略重建）；
*   实时的认证密钥、provider 连接、扩展代码、工具实现和当前配置；
*   关于不透明 provider 元数据在另一个账户、provider 或 omp 版本下仍然可用的保证。

集成方应当解析持久化的树与声明的载荷，保留它们不理解的内容，并避免把保存下来的文件当作序列化后的会话管理器进程。
