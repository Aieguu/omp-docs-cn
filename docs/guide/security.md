# 安全扫描

## 决定要审查什么

当你想要以漏洞为中心审查一个仓库、一个敏感目录、一个未提交的检出，或两个 Git 修订之间的改动时，使用 omp 原生的安全扫描。它适合在发布之前、认证或授权改动之后、解析器与网络边界附近使用，也可以作为对高风险 diff 的第二轮检查。它寻找可能的攻击者可控路径与具体影响；它不是通用的风格审查、合规证书，也不是不存在漏洞的证明。

安全扫描默认关闭，因为启用它会把仓库内容发送给当前模型背后的 Provider、发起额外的模型请求、消耗配额，并生成可能包含敏感源码细节的报告。只为获准用于此用途的仓库与 Provider 开启它。

最安全的首次运行是：先做一个狭窄、明确的计划，然后单独启动：

```
/security plan --path src/auth --exclude src/auth/fixtures --knowledge-base SECURITY.md
/security scan secplan_…
```

第一条命令在不开始模型审查的情况下检查并冻结范围。阅读返回的计划 ID 与指纹，然后把那个确切的计划 ID 传给第二条命令。对于整仓库审查，`/security scan` 是单命令捷径：它执行预检并立即开始。

你也可以用自然语言让 omp 执行，例如：“Plan an OMP-native security review of `src/auth`, excluding generated fixtures, and stop before starting it.”。当你需要确定性的 plan、operation 或 scan ID 时，请优先使用 slash 命令。

## 启用并登录

打开 `/settings`，进入 **Tools → Available Tools → Security**，并将其打开。对于脚本化或下次启动时生效的配置：

```
omp config set security.enabled true
```

`~/.omp/agent/config.yml` 中的等价条目是：

```
security:
  enabled: true
```

原生预检还要求同时满足：

-   在 Git 仓库内运行 omp；
-   用 `/model` 选择一个活动模型；
-   为该模型的 Provider 存有 **OAuth** 登录。

来自环境变量、`models.yml`、`--api-key` 或通过登录流程保存的 API key 不足以进行原生扫描。请选择支持 OAuth 的 Provider 路线并使用 `/login <provider>`。例如，ChatGPT 订阅模型使用 `openai-codex`，而不是基于 API key 的 `openai` 路线。

当活动 Provider 存在多个 OAuth 账户时，在规划之前先选定目标账户：

```
/session pin
/session pin 2
```

第一条命令列出当前 Provider 的账户；第二条把显示的账户号固定到本会话。安全预检随后会固定底层持久化凭据行及其账户或工作区身份。对于已经知道持久化凭据 ID 的自动化场景，还可以使用 `--credential ID` 计划选项；它不是 `/session pin` 显示的序号位置。

## 选择一个目标

所有 `--path` 与 `--exclude` 值都相对 Git 仓库根目录解析，即使 omp 是在子目录中启动的。两条选项都可以重复多次以指定多个路径。路径必须存在并解析到仓库内部；排除优先于包含。

| 意图 | 命令 | 审查内容 |
| --- | --- | --- |
| 仓库快照 | `/security plan` | 当前仓库整体。这是默认值。 |
| 一个或多个路径 | `/security plan --path src/auth --path src/session` | 仅被点名的文件或目录，减去排除项。此模式至少需要一个 `--path`。 |
| 修订范围 | `/security plan --diff origin/main HEAD` | 解析出的 base 到 head 的 Git diff，对照解析出的 head 的临时分离检出进行检查。 |
| 工作检出 | `/security plan --working-tree` | 记录为 working-tree 审查的当前检出，包括范围内的已跟踪与未跟踪内容。这不是仅改动块的 diff。 |

仓库、修订 diff、working-tree 三种意图只能选其一。`--path` 与 `--exclude` 可以收窄 diff 或 working-tree 扫描：

```
/security plan --diff v2.4.0 HEAD --path packages/server --exclude packages/server/generated
/security plan --working-tree --path src --exclude dist
```

仓库、路径与 working-tree 计划会对范围内的已跟踪与未跟踪文件内容、可执行位、符号链接目标以及当前 `HEAD`（或未诞生的仓库状态）做指纹。ref 计划会把两个名字都解析为提交 ID，并对它们的树 diff 做指纹。因此，被删除或改动的文件会使旧计划过期，而不是静默改变其含义。

`--path` 与 `--exclude` 是审查与发布范围，不是保密沙箱。原生审查者可以检查周边仓库代码来验证控制流，ref 审查也会收到 diff 上下文。不要在一个包含所选 Provider 无权处理的材料的检出中运行扫描。

## 添加指导并选择输出目录

重复 `--knowledge-base FILE` 可以把安全策略、威胁模型或架构笔记固定到计划上。每个文件都从仓库根目录解析，并按其规范化路径、大小与 SHA-256 摘要固定。更改任何一个都需要新计划。同样要把这些文件视为绑定 Provider 的扫描输入。

不带 `--output` 时，omp 会在本项目的安全状态中分配一个唯一的私有目录。要把初始结果包写到别处，请选择被扫描仓库之外的一个空目录：

```
/security plan --path src/auth --output /tmp/acme-auth-review
```

输出目录必须有一个已存在的父目录、一个规范的非符号链接身份，且不能位于仓库内部。除非你明确允许归档，非空目标会被拒绝：

```
/security plan --output /tmp/acme-review --archive-existing
```

扫描开始时，omp 会把已存在的目录重命名为相邻的 `.archive-<scan-id>` 路径，并创建一个新的目标。在 POSIX 系统上，生成的目录权限加固为 `0700`，文件为 `0600`。

## 预检冻结了什么

`/security plan` 持久化一个不可变的计划并返回其 ID 与指纹。它固定：

-   规范化的仓库根、目标类型、归一化的包含/排除范围以及目标快照；
-   ref 扫描解析出的 base 与 head 提交；
-   活动 Provider、模型、思考级别、确切的 OAuth 凭据以及记录的账户/工作区身份；
-   每个知识库文件的身份；
-   输出与归档策略；
-   相关的安全设置以及带版本号的原生审查工作流。

只凭 ID 即可启动一个已有计划：

```
/security scan secplan_…
```

启动时会重新计算指纹。如果代码、refs、范围输入、知识库、输出状态、设置或内置工作流发生了变化，omp 会以 stale-plan 错误拒绝。请重新运行 `/security plan`；不要尝试复用旧 ID。预检时选择的模型与账户会保持固定，即使主会话后来更换了模型。

## 跟进后台扫描

成功启动会立即打印 scan ID（`secscan_…`）与 operation ID。审查作为可见的后台作业继续，主会话无需静默等待。进度依次经过：

```
queued → preparing → reviewing → publishing → completed
```

该作业还会报告面向用户的里程碑，例如准备扫描、与安全工作者一起审查、发布发现数量。检查所有已知操作或某个确切操作：

```
/security status
/security status <operation-id>
```

操作快照包括其阶段、时间戳、plan 与 scan ID、当前发现数量，以及可用的会话文件或错误。其他终态阶段是 `partial`、`cancelled` 和 `failed`。

取消原生后台工作：

```
/security cancel <operation-id>
```

取消是协作式的。请求成功意味着已请求停止，而不是清理已经完成；请检查状态直到它到达 `cancelled`。已完成或其他终态的操作不可取消。

原生扫描会话被限制为只读的仓库搜索、只读的代码智能以及内置的安全审查工作者。扫描期间扩展、MCP 服务器、代理间聊天、shell 执行、模型回退与账户轮换全部禁用。它不会编辑被审查的源码树。

## 检查发现与工件

结果按项目存储，不在仓库之间全局混用。从这些命令开始：

```
/security scans
/security show <scan-id>
/security show security://scans/<scan-id>/findings
/security show security://scans/<scan-id>/findings/<finding-id>
```

`security://` 命名空间不可变且只读。`/security show` 可以渲染这些项目资源：

| 资源 | 内容 |
| --- | --- |
| `security://scans/<scan-id>/manifest` | 公开的扫描清单与不可变计划。 |
| `security://scans/<scan-id>/findings` | 发现的 ID、严重度、标题与规则。 |
| `security://scans/<scan-id>/findings/<finding-id>` | 位置、证据、修复建议与运维处置。 |
| `security://scans/<scan-id>/coverage` | 已审查的表面、排除项、延后的工作、未决问题与完整性。 |
| `security://scans/<scan-id>/report` | Markdown 审查报告（当发布完成时）。 |
| `security://scans/<scan-id>/sarif` | SARIF 2.1 结果（当可用时）。 |
| `security://scans/<scan-id>/provenance` | 脱敏的生产者与运行溯源。 |

一次已完成的原生输出目录包含 `scan.json`、`findings.json`、`report.md`、`results.sarif` 和脱敏的 `provenance.json`。规范的项目存储仍是实时记录。后续的验证或处置变更会更新该记录及其 SARIF，而不是原始的 Markdown 叙述或已写出的外部输出目录；需要最新的工件时请再次导出。

## 验证与处置发现

验证与处置回答的是不同的问题：

-   **验证**问的是该技术论断是否可复现且具有安全相关性。`/security validate` 让当前 omp 会话在不修改源码的情况下检查被引用的代码，然后记录 `validated`、`rejected`、`partial` 或 `error`，并附带摘要与支持证据。发现起初是 `unvalidated`。
-   **处置**记录你的处理决定：`open`、`false_positive`、`accepted_risk`、`fixed` 或 `wont_fix`。

使用 scan/finding 对或确切的 finding URI 进行验证：

```
/security validate <scan-id> <finding-id>
/security validate security://scans/<scan-id>/findings/<finding-id>
```

把结果当作模型辅助的验证，而不是自动批准。在接受一个实质性结论之前，先阅读被引用的代码与证据。

单独记录运维决定：

```
/security disposition <scan-id> <finding-id> false_positive "Input cannot cross the authenticated boundary"
/security disposition <scan-id> <finding-id> accepted_risk "Mitigated by the isolated deployment profile"
/security disposition <scan-id> <finding-id> fixed "Patched and covered by the archive traversal regression test"
/security disposition <scan-id> <finding-id> open
```

每个非 `open` 处置都需要理由。把发现改回 `open` 会清除其之前的理由。

## 比较、导入与导出

修复完成后，对等价范围再运行一次扫描并比较谱系：

```
/security compare <before-scan-id> <after-scan-id>
```

结果会统计未变化、新引入与已解决的发现，并给出它们匹配的 ID。after-scan 必须是 `completed`；partial、cancelled 或 failed 的扫描无法证明某个早期发现已被解决。在把结果当作发布门禁之前，同时比较覆盖率与数量。

把一个 SARIF 文件或 Codex Security 结果包目录导入当前项目的规范存储：

```
/security import artifacts/results.sarif
/security import /tmp/codex-security-bundle
```

导入的路径与发现会对照当前仓库进行验证。用 `/security scans` 列出新分配的 scan ID。

把当前规范状态导出为 JSON 包、SARIF 或 Markdown 报告：

```
/security export <scan-id> --output artifacts/security-bundle.json --format bundle
/security export <scan-id> --output artifacts/results.sarif --format sarif
/security export <scan-id> --output artifacts/security-report.md --format report
```

`bundle` 是默认格式。当前的导入命令接受 SARIF 文件与 Codex Security 包目录；它不会重新导入 omp 的单文件规范 JSON 导出。当该扫描没有对应工件时，报告或 SARIF 导出会明确失败。导出的文件在 POSIX 上使用私有文件权限，但 omp 不会加固已存在的父目录——请自行选择并保护目标位置。

## 原生审查与 Codex Security 云

这是两个独立的产品，绝不会互相回退。

|  | Omp 原生 | Codex Security 云 |
| --- | --- | --- |
| 执行 | 一个受限的后台 omp 会话审查本地 Git 检出或分离的 ref 目标。 | ChatGPT 的 Codex Security 控制平面扫描其配置的仓库与环境。 |
| 认证 | 活动 Provider 的 OAuth，在预检时固定。 | 一个 `openai-codex` ChatGPT OAuth 账户。这不是公共的 OpenAI API。 |
| 范围 | 来自 `/security plan` 或 `/security scan` 的仓库/路径/ref/working-tree 选项。 | 在云服务中配置的仓库、环境与 lookback。 |
| 计费与配额 | 请求计入所选模型/Provider 账户。 | 启动会消耗该账户单独的 Codex Security 云扫描配额。 |
| 本地结果 | 直接发布进 omp 的项目存储。 | 经过显式的 pull 与导入后才成为本地结果。 |

云操作是显式的：

```
/security cloud scans
/security cloud start --repo-id <repository-id> --repo-url https://github.com/owner/repo --environment <environment-id> --lookback 30
/security cloud status <configuration-id>
/security cloud pull <configuration-id>
```

无限云 lookback 使用 `--lookback all`。只有在需要显式选择某个已知的 `openai-codex` 凭据时，才给云命令加 `--credential <durable-id>`。`/security cloud scans` 列出所选账户可见的配置，包括仓库与环境 ID、状态、进度，以及服务报告时的剩余配额。

云 pull 会拉取带有归因的发现，把它们转换为 omp 的规范格式，生成报告与 SARIF，并存储一次已完成的导入扫描。除非当前 Git 项目有一个 `origin`、其规范化仓库身份与云配置 URL 匹配，否则它会以失败收场。导入的云覆盖率被标记为 `unknown`，因为云发现 API 不提供覆盖率回执。原生的 `/security cancel` 不会取消云工作；目前没有 `/security cloud cancel` 命令。

## 隐私、凭据与恢复

-   **Provider 边界：**原生审查会把提示词与被检查的仓库材料发送给活动模型的 Provider。云命令会把仓库配置发送给 ChatGPT 的 Codex Security 服务，由该服务执行远程扫描。请选择已获授权处理该仓库的账户与服务。
-   **凭据边界：**计划存储的是一个 OAuth 行及其记录身份的引用，不是在同级账户之间轮换的许可。刷新保持在那一行上。如果凭据消失、身份变化、过期到无法刷新，或固定的模型不可用，扫描会失败而不是回退。登录或固定目标账户，选择一个可用模型，然后创建新计划。
-   **工件边界：**发现、报告、SARIF、覆盖率与溯源可能暴露路径、脆弱流程和修复细节。默认状态与生成文件获得受限的 POSIX 权限，但它们不能替代加密存储、谨慎的备份与访问控制。关闭该功能不会删除已存储的扫描或导出的文件。
-   **重启：**进程重启无法恢复正在运行的原生审查。恢复时，omp 会把持久化的 `planned` 或 `running` 扫描记录标记为 `failed` 并附带中断错误，同时清理临时的 ref-diff 检出。检查 `/security status` 或 `/security scans`，然后创建并启动新计划。
-   **部分或失败的发布：**没有完成规范发布的扫描是 `partial`；取消与执行错误作为它们自己的终态记录存储。这样的扫描可能没有报告或 SARIF。检查状态错误，修复认证/模型/输出条件，然后重跑，而不是把它们当作已解决的证明来比较。
-   **已完成但缺少外部文件：**即使后来的输出刷新失败，规范结果可能已经安全地存在于项目存储中。用 `/security show` 检查它，并用 `/security export` 写出一份新副本。

`security.enabled` 是当前唯一的持久化安全设置。目标、知识库、模型/账户选择与输出策略都是按计划生效的。当你不再希望 `/security` 与 `security://` 可用时，在 `/settings` 中或用 `omp config set security.enabled false` 再次禁用该功能；禁用可用性会保留已有数据。
