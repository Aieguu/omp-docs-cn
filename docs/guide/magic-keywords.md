# 魔法关键词

魔法关键词是可选的、单轮次生效的捷径。当你想让 omp 改变它对**这条提示词**的处理方式，而又不想开启一个持久化模式时，把一个可识别的独立单词放进普通提示词里即可。

从你需要的行为出发：

```
ultrathink about the failure modes before changing this public API

orchestrate the migration across the server, client, and tests

workflowz perform an adversarial review of authentication, authorization, and session handling
```

这个词仍然是你可见消息的一部分。在终端编辑器中，当编辑器获得焦点时，omp 会用一个流动的渐变高亮可识别的词；发送后的消息则使用静态渐变。这只是一种识别提示，并不代表该关键词的行为已启用，也不代表其所需的工具可用。

## 选择关键词

| 关键词 | 何时使用…… | 可以期待什么 |
| --- | --- | --- |
| `ultrathink` | 一个决策、诊断或有风险的改动值得格外仔细的推理。 | omp 会要求一种谨慎的多步骤处理方式。如果自动思考已启用，这一轮还会使用当前模型所支持的最高推理力度。 |
| `orchestrate` | 一个大型任务包含可以并行推进的独立工作。 | omp 会对任务划分范围，把适合的独立部分委派给子代理，整合结果，并验证工作。 |
| `workflowz` | 宽泛的研究、审查、迁移或对抗性分析，适合显式、确定性的多代理工作流。 | omp 会构建一个包含并行与分阶段子代理工作的结构化工作流，然后综合结果。 |

这些词只是引导执行；它们不保证某种特定答案或固定数量的工作者。一个很小或紧密耦合的请求可能几乎没有可并行的工作。`workflowz` 是更明确的工作流构建选项；`orchestrate` 是通用的委派选项。

## 作用范围：一条已提交的提示词

关键词只影响其所在的、已提交的用户消息对应的那一轮。它不会成为会话状态，也不会延续到下一条提示词。

```
orchestrate inspect the three independent packages and fix their failing builds
```

这个编排请求只作用于该轮次，包括 omp 为完成它而执行的工作。之后一条类似“现在更新发布说明”的提示词就是普通提示词，除非你再次包含关键词。一条提示词中的多个已启用关键词可以同时生效，尽管组合使用可能徒增成本而无益于结果；通常选择最贴合的那一个即可。

## 精确匹配规则

匹配区分大小写，并刻意排除类代码上下文。请使用精确的小写拼写，并作为独立的散文词语使用。

**会匹配：**

```
Please ultrathink before choosing a migration strategy.
"orchestrate" the independent investigations.
Can you workflowz, then summarize the strongest evidence?
```

句末标点和引号可以紧贴这个词。

**不会匹配：**

```
Ultrathink about this                 # wrong case
orchestrated this migration           # part of another word
my_orchestrate_helper                 # identifier
orchestrate.ts                         # file name
foo::orchestrate                      # symbol reference
orchestrate()                          # call syntax
plans/orchestrate/checklist            # path
`workflowz` this review                # inline code
```

字母、数字、下划线、斜杠、反斜杠、连字符、文件扩展名后缀、`::` 以及紧邻的调用括号都会把这个词绑定成类代码的 token。行内代码、围栏代码块以及 HTML/XML 注释、标签或元素中的出现会被忽略。这样你就可以讨论某个符号或粘贴代码，而不会意外引导这一轮。

如果你需要提及这个词而不触发它，可以把它放进行内代码或围栏代码块、改变大小写，或在提交前禁用该关键词。

## 前提条件与回退行为

-   `ultrathink` 不需要子代理工具。它的自动思考覆盖仅在思考被设为自动时才起作用；否则当前选择的思考级别保持不变。不同模型支持的推理力度不同，因此“最高”指的是当前激活模型所支持的最高值。
-   `orchestrate` 要求子代理 task 能力处于激活状态。没有它，就不会添加编排行为；可见的提示词仍会正常提交。
-   `workflowz` 要求子代理 task 能力与持久化 evaluation 能力同时处于激活状态。任一不可用时，都不会添加工作流行为；可见的提示词仍会正常提交。

计划模式、工具配置或其他会话控制可能使这些能力不可用。当 `orchestrate` 或 `workflowz` 看起来毫无效果时，检查 `/tools`。由于高亮识别独立于能力检查，着色的词仍可能出现。

## 启用或禁用关键词

下面四个设置默认都是 `true`。在终端 UI 中，打开 `/settings`，然后进入 **Interaction → Magic Keywords**。主开关 **Magic Keywords** 控制所有关键词；三个关键词开关分别控制它们各自。

你也可以在 shell 中做同样的修改：

```
# Disable all keyword behavior
omp config set magicKeywords.enabled false

# Disable one behavior while leaving the others available
omp config set magicKeywords.ultrathink false
omp config set magicKeywords.orchestrate false
omp config set magicKeywords.workflow false

# Re-enable them
omp config set magicKeywords.enabled true
omp config set magicKeywords.ultrathink true
omp config set magicKeywords.orchestrate true
omp config set magicKeywords.workflow true
```

尽管提示词中的词是 `workflowz`，设置名却是 `magicKeywords.workflow`。运行 `omp config list` 并检查 `magicKeywords.*` 的值，以确认生效的配置。配置的作用域与优先级请参见[设置](./settings.md)。

关闭全局开关会停止编辑器中的动画，但被识别的词在编辑器和已发送消息中可能仍保持静态着色。单个关键词的开关并不控制高亮。因此，请通过 `/settings` 或 `omp config list` 来确认启用状态，而不要只看颜色。

## 成本与并行

魔法关键词不会创建单独的计费模式，但可能增加用量：

-   当自动思考选择模型支持的最大推理力度时，`ultrathink` 可能消耗更多推理 token。
-   `orchestrate` 和 `workflowz` 可能并发运行多个子代理。并行执行可以缩短总耗时，但每个工作者都会消耗模型与工具容量，因此总用量可能明显高于单代理轮次。
-   更多的工作者并不自动更好。给出相互独立的交付物、边界和一个具体的验收检查，并行工作才有价值而不是重复劳动。

用 `/usage` 或 `omp stats` 检查用量，不要想当然地认为更快挂钟完成就一定花费更少。

## 故障排除

### 这个词没有被高亮

检查小写拼写及其边界。去掉代码格式化、路径或扩展名、标识符字符、`::` 或紧邻的括号。高亮是终端 UI 的一种辅助提示；不要在 one-shot 或协议输出中依赖它。

### 这个词被高亮了，但行为没有变化

检查 **Interaction → Magic Keywords** 或 `omp config list`。全局开关与对应的单个关键词开关必须都处于开启状态。对于 `orchestrate`，在 `/tools` 中确认 task 能力；对于 `workflowz`，确认 task 与 evaluation 两个能力。仅有高亮不能证明行为已被注入。

### `ultrathink` 没有改变显示的思考级别

它的最大力度覆盖仅在自动思考激活时生效，并且受限于当前模型支持的级别。在手动选择了思考级别时，它仍会引导这一轮更加谨慎，但不会替换你的选择。

### 运行的 agent 太多，或用量高于预期

使用更聚焦的提示词，点名真正独立的切片，或者对顺序执行或很小的任务省略关键词。如果你希望提及关键词时保持普通散文，同时保留其他捷径，可以禁用那一个关键词。
