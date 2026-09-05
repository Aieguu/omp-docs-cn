# 代码审查

## 在改动落地之前审查

当一项改动准备好做一次刻意的正确性检查时使用 `/review`：在打开或合并 pull request 之前、一次高风险重构之后，或者已暂存的工作值得再看一眼的时候。该命令会确定一个具体的 diff，剔除常见的生成噪声，并只报告由该 diff 引入的、有证据支持的问题。

最短的成功流程是：

```
You: /review
omp: Review Mode
     1. Review against a base branch (PR Style)
     2. Review uncommitted changes
     3. Review a specific commit
     4. Custom review instructions
You: 2. Review uncommitted changes
```

还在工作中时选择 **uncommitted changes**。在 Git 仓库中，这会一起审查已暂存与未暂存的 diff。在 Jujutsu 仓库中，它审查当前的 JJ working-copy diff。随后 omp 返回发现与总体结论；它不会编辑文件。

审查有意比 `review this` 这类开放式提示更严格。`/review` 先确立一个精确的 VCS 或 pull-request 范围，并应用一致的发现契约。一条发现必须描述一个由补丁引入的、可证明、可行动、非预期的缺陷，并指向被改动的行。审查会跨模块边界追踪被改动的值直到接收它们的处理器，同时忽略普通的风格偏好、文档吹毛求疵和既有缺陷。当你想要更宽泛的架构建议、设计批评或编辑时，开放式提示仍然有用，但它的范围和产出是你所要求的内容，而不是这个固定的补丁审查工作流。

## 选择合适的审查模式

### 将当前分支与基准分支比较

选择 **Review against a base branch (PR Style)**，相当于在本地审查一个 pull request：

```
You: /review
You: 1. Review against a base branch (PR Style)
omp: Select base branch to compare against
You: main
```

omp 会列出本地与远程 Git 分支，确定当前分支，并审查从所选基准到当前分支的三点 diff。换句话说，范围从它们的合并基开始，包含你的分支上引入的改动。这通常是在打开 PR 之前的正确模式。

如果特性分支包含无关工作，请选择更合适的基准，或者改为审查特定提交。这个选择器基于 Git；当前的 JJ 改动请使用 working-copy 模式。

### 审查已暂存与未暂存的工作

提交前检查选择 **Review uncommitted changes**：

```
You: /review
You: 2. Review uncommitted changes
```

对 Git，omp 会合并这两个范围：

-   工作树中未暂存的改动；
-   索引中已暂存的改动。

对 Jujutsu，omp 会检测仓库并使用 JJ working-copy diff，而不是 Git status 或 Git diff。无论哪种情况，审查发现都指向实际改动的文件和行。新建的未跟踪 Git 文件不会出现在 Git diff 中；如果它们属于审查范围，请在审查前添加或暂存。

### 审查一个提交

想隔离一个已完成的工作单元时，选择 **Review a specific commit**：

```
You: /review
You: 3. Review a specific commit
omp: Select commit to review
You: a13f62c Fix token refresh race
```

选择器显示最近的 20 个 Git 提交。omp 审查所选提交的补丁，而不是该提交与当前分支之间的全部改动。这适合在 cherry-pick 之前检查一个修复，或把一个可疑提交从更大的分支中分离出来。

### 审查 GitHub pull request

当 GitHub PR URL 或 `pr://` 引用最近出现在活动对话分支中时，`/review` 会在编号模式之上增加最多三个选项：

```
You: Please look at https://github.com/acme/widgets/pull/418
You: /review
omp: Review Mode
     Review PR acme/widgets#418 from conversation
     1. Review against a base branch (PR Style)
     ...
You: Review PR acme/widgets#418 from conversation
```

最近提及的 PR 排在最前，重复引用会被折叠，被放弃的对话分支中的引用不会泄漏进选择器。

要更快、更少歧义，可以在命令行上直接给出明确的 PR URL。这会绕过选择器：

```
/review https://github.com/acme/widgets/pull/418
```

你可以在 URL 后附加关注点：

```
/review https://github.com/acme/widgets/pull/418 focus on authorization boundaries
```

标准 GitHub URL 可以包含 `/files`、`/commits`、查询字符串或锚点。完全限定的内部引用也可以：

```
/review pr://acme/widgets/418/diff/all focus on migration safety
```

对于 PR 审查，omp 会抓取 PR diff，并把审查绑定到抓取的内容上。它不会静默替换成本地检出中的文件，后者可能处于不同的修订。issue URL、提交 URL、其他主机，或诸如 `pr://418` 的不完整引用不会被当作 PR 目标；在没有交互式 UI 的情况下，它会变成普通的关注点文本。

PR 审查要求 `PATH` 上有 GitHub CLI（`gh`），并且已用以能读取该仓库的账户完成认证。必要时运行 `gh auth login`。私有 PR 还需要能访问那个私有仓库。即使当前目录不是那个仓库，你也可以在 URL 中提供 `owner/repository`。

### 提供自定义关注点

当标准的 working-copy 范围正合适、但某个特定风险值得额外关注时，选择 **Custom review instructions**：

```
You: /review
You: 4. Custom review instructions
omp: Enter custom review instructions
You: Review the following:

     Trace every new queue state through serialization, restart recovery,
     and the consumer switch. Ignore naming unless it hides a correctness bug.
```

如果仓库有未提交的 Git 或 JJ 改动，omp 会包含该 diff 并把你的指令应用于它。如果没有可用的 working-copy diff，指令本身就成为审查请求，因此请明确点名文件、提交、行为或其他范围。

你也可以把关注词放在 `/review` 之后：

```
/review focus on cancellation and cleanup
```

在交互式 TUI 中，这些词会被带进你选择的任何标准模式，并且单独的自定义指令选项会被省略。这是在保留常规 VCS 范围的同时强调某个关注点的便捷方式。

好的关注文本会指名一个失效边界，而不是要求笼统的质量：

```
/review focus on backward compatibility of the persisted session format
/review focus on authorization checks after redirects
/review focus on partial writes, retries, and idempotency
```

## omp 如何定义与扩展范围

审查之前，omp 会把 unified diff 解析为被改动的文件，并统计新增与删除的行数。它把常见的低信息量文件排除在审查范围之外：

-   `package-lock.json`、`Cargo.lock`、`poetry.lock`、`flake.lock` 等锁文件；
-   压缩文件、生成文件、快照和 source map；
-   顶层 `dist/`、`build/` 或 `out/` 下的文件，以及 vendored 依赖；
-   图片、字体、PDF 和常见归档。

结果会报告被排除的路径和原因，因此过滤是可见的而不是静默的。如果所有被改动的文件都被过滤，命令会以 **No reviewable files** 停止，而不是返回一个误导性的干净结论。某个只是恰好命名为生成输出的文件，如果你确实想检查它，可能需要一次自定义的开放式审查。

审查广度随可审查 diff 的规模伸缩。当前的并发启发式是：

| 可审查改动 | 审查广度 |
| --- | --- |
| 少于 100 行改动，或至多 2 个文件 | 一次聚焦审查 |
| 少于 500 行改动 | 至多 2 个并行切片 |
| 少于 2,000 行改动 | 至多 4 个切片，大约每 3 个文件一个 |
| 少于 5,000 行改动 | 至多 8 个切片，大约每 2 个文件一个 |
| 5,000 行或以上 | 至多 16 个切片，绝不超过文件数 |

新增与删除的行都计数。相关的实现与测试文件保持在同一个连贯的审查区域内，而不是脱离上下文被评判。

对于至多 20 个可审查文件、50,000 字符的 diff，完整 diff 会被带入审查。超过任一限制时，omp 使用每文件的简短预览，并让审查直接读取分配给它的 diff 段落。这降低了提示词噪声，而不缩减预期的文件范围。对于本地审查，必要时也可能读取周边文件上下文。对于 GitHub PR，上下文保持在抓取的 PR diff 内，而不使用本地工作区文件。

这些规则让大规模审查可行，但并非万无一失。一次巨大的机械性改动，拆成几个逻辑提交可能更好审查；而一个小小的认证改动，可能值得一次非常具体的自定义关注。

## 阅读结果

一条发现包含：

-   **优先级**——紧急度与影响，从 `P0` 到 `P3`。
-   **置信度**——`0.0` 到 `1.0` 的值，估计所报缺陷为真实的可能性。
-   **标题与解释**——要做的离散修复、触发条件和影响。
-   **文件与行范围**——与被审查 diff 重叠的一小段范围。

| 优先级 | 含义 | 实际应对 |
| --- | --- | --- |
| `P0` | 普适的发布或运维阻断项，例如数据损坏或认证绕过。 | 停止发布并立即调查。 |
| `P1` | 应在下一周期修复的高影响缺陷。 | 合并前修复，除非你明确接受风险。 |
| `P2` | 中等影响的边缘情况或正确性问题。 | 计划并验证修复；合并时机按项目策略决定。 |
| `P3` | 信息性的、低影响的改进。 | 视为可选，除非它揭示了项目需求。 |

置信度不是严重度。`0.55` 的 `P0` 描述的是证据不确定的灾难性论断；`0.98` 的 `P2` 描述的是有强有力证据支持的较窄问题。在行动之前，同时验证触发条件和受影响路径。

最终结论是 **correct** 或 **incorrect**，后跟简短解释与结论置信度。**Correct** 表示在本审查契约下没有确立任何正确性缺陷或阻断项；它不担保风格、文档完整性、在所有环境下的性能，或不存在一切可能的缺陷。**Incorrect** 表示审查确立了至少一个实质性的正确性问题。发现数量也会按优先级汇总；**Findings: none** 不能替代你自己的领域特定检查。

## 把发现转化为刻意的后续动作

`/review` 是只读的。它不应用建议、不修改工作树、不运行修复，也不合并 PR。这种分离给了你一个决策点。

对每条发现：

1.   打开被引用的改动行，对照周边代码复现所述触发条件。
2.   判断发现是否成立，以及其优先级是否符合你的发布策略。
3.   让 omp 执行你想要的精确动作，引用该发现，而不是只说“全部修复”。
4.   运行相关行为或聚焦测试；如果修复规模可观，再次审查得到的补丁。

例如：

```
The P1 finding in src/auth/refresh.ts is valid. Fix the refresh race without
changing the public token API, run the focused auth test, and show me the result.
```

或者明确否决一条发现：

```
The P2 finding assumes retries can overlap, but this worker is single-flight by
contract. Confirm that invariant from the implementation and leave the code unchanged.
```

这保留了你对范围的控制，避免把一个错误或低置信度的观察变成一次自动编辑。

## 无界面使用

没有交互式 UI 时，`/review` 无法显示模式选择器。裸命令会请求对最近代码改动的一次聚焦审查，其后的词成为关注点：

```
omp -p "/review focus on authentication regressions"
```

当自动化需要确定性的远程范围时，使用明确的 GitHub PR URL：

```
omp -p "/review https://github.com/acme/widgets/pull/418 focus on API compatibility"
```

明确的合法 PR URL 在交互式与无界面使用中都会被直接抓取。没有它时，无界面模式不提供基准分支或提交选择；让周围的提示词说明要审查的最近改动，或在需要那些选择器时运行交互式 TUI。审查输出保持只读，因此 CI 脚本必须自行决定结论是否、以及如何影响其退出码或合并策略。

## 故障排除

-   **No uncommitted changes found**——Git 工作树与索引是干净的，或 JJ working-copy diff 为空。如果工作已提交，请选择基准分支或提交模式。
-   **No diff content found**——Git status 注意到了改动，但已暂存与未暂存的 unified diff 为空。常见原因是未跟踪文件；先添加或暂存它，然后重跑 `/review`。
-   **No changes between _base_ and _branch_**——确认所选基准与当前分支。比较基于合并基，选择当前分支或错误的远程分支可能产生空 diff。
-   **No git branches found**——在预期的 Git 检出内运行 omp，并确认它有分支 refs。分离的 `HEAD` 也可能让基于分支的审查产生困惑；如果那才是真实范围，请使用提交模式。
-   **No commits found**——目录不是可读的 Git 仓库，或没有历史。视情况使用 working-copy 或自定义模式。
-   **No reviewable files (all changes filtered out)**——每个 diff 路径都命中了噪声规则。这不是一次干净的审查；如果那些生成产物或二进制工件确实需要检查，请使用自定义的开放式提示。
-   **Failed to get diff / Failed to get commit**——检查仓库与所选修订仍然存在，且 Git 或 JJ 可以读取它们。解决进行中的 VCS 操作或无效 ref 后重跑。
-   **Failed to fetch PR diff**——确认 `gh` 已安装，运行 `gh auth login`，验证账户可以查看该仓库与 PR，然后重试该明确 URL。
-   **PR … has no diff content available**——PR 可能没有改动、抓取的 diff 可能不可用，或 GitHub 可能未为其内容暴露补丁文本。把它当作干净结果之前，先打开 PR 的 Files changed 视图。
-   **选择器中缺少最近的某个 PR**——只提供活动对话分支上最近的三个不同 PR 引用。把完整 URL 直接贴在 `/review` 之后以绕过检测。
-   **审查了错误的文件**——取消并重新选择范围。整个特性分支用基准分支模式，当前工作副本用未提交模式，单个提交用提交模式，远程改动用明确的 PR URL。
