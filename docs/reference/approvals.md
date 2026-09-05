# 工具审批

## 选择审批策略

工具审批保护了「模型提议某个动作」与「omp 使用你账户的访问权限执行该动作」之间的边界。它们对变更、命令执行、浏览器或桌面控制以及委派的工作最有用。它们并不会让模型的输出变得可信，也不会把被允许的命令隔离在沙箱中。

内置默认值为 **`yolo`**。对于交互式编码会话，更安全的起点是 **`write`**：

```
# ~/.omp/agent/config.yml
tools:
  approvalMode: write
```

你也可以在 `/settings` 中选择**工具审批**。模式名称描述了无需提示即可运行的「最高能力层级」：

| 模式 | 立即运行 | 提示 |
| --- | --- | --- |
| `always-ask` | 只读调用 | 工作区/会话写入与可执行操作 |
| `write` | 只读调用与工作区/会话写入 | 可执行操作，如 `bash`、`eval`、浏览器控制与 `task` |
| `yolo` | 读取、写入与可执行调用 | 仅凭层级不会触发任何提示 |

尽管名称如此，`always-ask` 并不会对普通的读取操作提问。未知或格式错误的自定义工具声明会被视为可执行，也就是保守的层级。MCP 服务端工具通常是 write 层级。

对于一次性会话，使用启动标志；它会覆盖配置但不保存：

```
omp --approval-mode always-ask
omp --approval-mode write "fix the failing test"
omp --approval-mode yolo "apply the reviewed migration"

# Aliases that force yolo for this process
omp --auto-approve "run the release script"
omp --yolo "run the release script"
```

## 推荐配置

### 交互式工作

当你希望常规的读取与编辑顺畅进行、但仍想检查命令与其他宽泛的执行时，使用 `write`。当每次变更都应经过人类判断这道边界时，使用 `always-ask`。

```
tools:
  approvalMode: write
  approval:
    eval: prompt
    computer: prompt
```

### 无人值守的自动化

当没有挂接交互式审批 UI 时，提示无人应答。请显式使用 `yolo` 模式，然后对任务不应动用的能力设置 `deny` 或 `prompt`。在真正无头的任务中，优先使用 `deny`：`prompt` 策略会让调用失败，而不是永远等待。

```
# ci-approvals.yml
tools:
  approvalMode: yolo
  approval:
    computer: deny
    browser: deny
    eval: deny
```

```
omp --config ./ci-approvals.yml --print "update generated files and report the diff"
```

请把这当作权限设计，而不仅仅是关闭提示。在适当受限的账户或容器中运行自动化，只授予它需要的工具。

### ACP 客户端

ACP 使用相同的全局、项目、overlay 与运行时设置。审批请求由 ACP 客户端呈现：文件系统与 shell 能力在可用时使用客户端的权限请求，而其他 omp 提示在受支持时使用表单采集。拒绝、取消或一个不受支持的必需提示都会中止调用。

schema 默认值为 `yolo`，但一个其他方面均为默认的 ACP 会话仍然会为 `bash`、`edit`、`delete` 和 `move` 保留客户端的权限闸门。如果客户端要无人值守运行，请显式开启：

```
omp acp --approval-mode yolo
# equivalent:
omp acp --yolo
```

显式配置 `tools.approvalMode: yolo` 也会跳过该 ACP 闸门，除非某个按工具设置的策略为 `prompt` 或 `deny`。ACP 在 `session/new`、`session/load` 或 `session/resume` 中没有按会话的审批字段；请启动单独的 `omp acp` 进程，或为它提供一个针对会话的 `--config` overlay。客户端设置请参阅 [ACP](../guide/acp.md)。

## 覆盖单项能力

`tools.approval` 是一个以工具或已挂载能力名称为键的映射。每个取值可以是：

*   `allow` —— 若无更强的工具策略另有要求，则在没有该模式层级提示的情况下运行；
*   `prompt` —— 在交互式会话中询问，除非更强的工具策略已经决定了该调用；
*   `deny` —— 在执行前拦截；它总是胜过 allow/prompt 的决定。

覆盖项在每个模式中都生效，因此它们可以放宽 `always-ask` 或收紧 `yolo`：

```
tools:
  approvalMode: write
  approval:
    bash: prompt
    read: allow
    eval: deny
    computer: deny
    mcp__filesystem__delete: deny
```

请使用待处理/已完成的调用中或[工具](../guide/tools.md)里显示的精确工具名称。对于已挂载的 `xd://` 能力，会先检查它自身的策略；如果不存在，则回退到外层 `write` 策略。无效的策略字符串会被忽略，因此只使用 `allow`、`prompt` 或 `deny`，并用以下命令审计生效的 YAML：

```
omp config get tools.approvalMode
omp config get tools.approval
```

对于命令级别的 shell 规则，使用有序的 `bash.patterns`；最先匹配的规则生效。`deny` 与 `prompt` 规则可以命中复合命令中匹配的片段，而 `allow` 必须匹配完整且非复合的命令。

```
tools:
  approvalMode: yolo
  approval:
    eval: deny       # bash rules do not cover a shell spawned through eval

bash:
  patterns:
    - match: "git status*"
      approval: allow
    - match: "rm -rf *"
      approval: deny
    - match: "*deploy*"
      approval: prompt
```

`bash.patterns` 规则只约束 `bash` 工具。如果 `eval` 可能启动一个 shell，请如上所示单独为 `eval` 设闸。

## 审批提示的含义

提示由实际要执行的调用构建，前提是任何扩展已修订其输入。它会提供**批准**与**拒绝**两个选项，并显示：

*   `Allow tool: <name>`；
*   相关的 MCP 来源；
*   提供的策略或安全原因；
*   工具专属的细节，如命令、路径、代码、浏览器操作或子代理任务分配。

过长的细节会在显示时被截断。请阅读目标、作用范围与取值，而不要仅凭工具名称批准。审批只针对该调用；它并不是「后续调用会带有相同参数」的长期承诺。

## omp 如何做出决策

对于每个调用，omp 会先向工具询问它的能力层级以及任何依赖参数的政策，然后将其与你的配置结合：

1.   工具声明的 `deny` 优先。
2.   你按能力设置的 `deny` 其次。
3.   工具声明的安全策略可以显式 allow 或 prompt。在非 yolo 模式中，除非工具显式允许，否则安全覆盖会触发提示。
4.   当更强的工具策略没有决定该调用时，你有效的 `allow` 或 `prompt` 生效。
5.   否则，模式会把调用的 `read`、`write` 或 `exec` 层级与上面的模式表进行比较。

在 `yolo` 模式下，裸的工具安全覆盖本身不会触发提示，但显式的工具 `prompt`、你的 `prompt`、任一种 `deny` 以及 Provider 的安全检查仍然生效。这一区别解释了为什么对同一工具的两个调用可能表现不同：参数可以选择不同的层级或策略。例如，`bash` 能识别一小类关键形态，如对绝对路径的递归销毁、远程拉取后执行、主机关机以及写入敏感账户文件。这个内置检查在非 yolo 模式中会强制提示，但它只是一个裸覆盖，所以 `yolo` 会跳过它。若要在 `yolo` 下让某条边界绝对生效，请配置 `bash.patterns``deny` 或按工具设置 `deny`；在需要交互式复核的地方使用 `prompt`。

工具与扩展的强制逻辑独立于模式计算。扩展可能拦截某个调用，工具可能拒绝不安全或无效的输入，操作系统或 Provider 可能拒绝授予权限，运行时错误也可能中止一个已被批准的动作。工具作者可以声明这些边界；参见[自定义工具](../guide/custom-tools.md)。

## 计算机与 Provider 安全

`computer` 能力默认是禁用的。启用后，声明了 `read_only: true` 的调用属于 read 层级；带变更、缺失或格式错误的声明则属于 exec 层级。它的审批提示会标注只读调用并显示提交的代码。声明负责选择闸门——它不是「任意代码无害」的静态证明。

源自 Provider 的 computer 调用也可能带有待处理的安全检查。这些检查**始终要求交互式确认**，即使在 `yolo` 下、`computer: allow` 下或外层已挂载能力的调度获批后也是如此。提示会列出 Provider 的检查代码、消息与脱敏数据。在没有交互式 UI 时，omp 会按「默认关闭」处理。

即使获批之后，具有现实影响的动作也可能为了「风险点」确认而停下，除非你的直接请求已经授权了确切的目标、作用范围与取值。网页或桌面上的文本是不可信的，不能授予该授权。`yolo` 会移除 omp 常规的层级提示；它不会覆盖 Provider 的检查、工具或扩展的拒绝、直接用户授权规则、操作系统权限或服务端的防护措施。

## 无头会话与子代理

无头会话无法满足必需的 omp 提示。该调用会以 `requires approval but no interactive UI available` 失败；Provider 的安全检查会报告它们自己的「默认关闭」错误。请更改模式、添加范围狭小的 `allow`，或通过交互式 UI 运行——不要仅仅为了隐藏错误而添加宽泛的权限。

子代理同样是无头的。它们以 `yolo` 的方式运行常规的层级决策，因为父 `task` 调用的审批就是它们的授权边界。你的 `tools.approval` 映射仍会被继承：`deny` 会拦截，`allow` 会运行，而 `prompt` 无人应答，因此会拒绝该子代理调用。在批准之前，请复核父任务的指派与隔离选择。

## 优先级与审计

从最强的配置层到最弱的，审批设置按如下顺序解析：

1.   运行时标志（`--approval-mode`、`--auto-approve`、`--yolo`）；
2.   后面的 `--config` overlay，然后是更早的 overlay；
3.   项目配置（`.omp/config.yml` 优先于旧的 `.omp/settings.json`）；
4.   全局的 `~/.omp/agent/config.yml`；
5.   内置默认值。

映射是深度合并的，因此项目可以只添加一条 `tools.approval` 条目而不抹掉不相关的全局条目。像 `bash.patterns` 这样的数组会被更高层整体替换。所有配置位置的说明见[设置](../guide/settings.md)。

要审计一个意外结果：

1.   在相同的工作目录下运行 `omp config get tools.approvalMode` 和 `omp config get tools.approval`。
2.   检查启动标志和每个 `--config` 文件；运行时标志优先，后面的 overlay 优先。
3.   匹配精确的工具/能力名称，并检查提示或错误中的任何 `Reason:`。
4.   对于 `bash`，检查最先匹配的 `bash.patterns` 规则；然后检查该操作是否实际改用了 `eval`。
5.   判断结果究竟来自用户策略、工具/扩展策略、ACP 权限、Provider 的安全检查，还是缺少交互式 UI。

如果某个调用在 `always-ask` 或 `write` 中意外触发提示，可能是它的参数把它提升到了 `write` 或 `exec`，也可能有显式的 prompt/安全覆盖在生效。如果某个调用在 `yolo` 中意外运行，请记住层级提示是被有意跳过的；请添加 `tools.approval.<name>: prompt` 或 `deny`。如果某个调用在每个模式下都被拒绝，请仅在合适时移除或修改那条精确的用户 `deny`——`yolo` 无法击败权威的工具或 Provider 边界。
