# 创建提交

## 何时使用 `omp commit`

当改动已经就绪，而划分提交边界、撰写有用的 Conventional Commit 消息比最终的 Git 命令本身更需要斟酌时，就使用 `omp commit`。默认流程可以把相关的改动放在一起，把不相关的文件或 hunk 拆分为原子提交，给相互依赖的提交排序，并更新附近的 changelog。

你需要：

*   一个包含待提交改动的 Git 仓库；
*   已配置 Git 的作者姓名与邮箱；
*   omp 中有一个已认证、可用的模型；以及
*   仓库中的 commit hook 均处于可用状态。

使用 `--push` 时，当前分支还必须有可用的上游，除非你的 Git 配置会自动提供。

## 先预览

先暂存你希望 omp 考虑的确切范围，检查一下，然后运行 dry run：

```
git add src/widget.ts test/widget.test.ts
git status --short
omp commit --dry-run
```

预览会打印生成的消息，或一份带编号的拆分计划，其中包含每个提交的消息以及所选的文件或 hunk。它不会创建提交、推送，也不会修改 changelog。

`--dry-run` 仍可能改变 Git 索引：如果索引为空，`omp commit` 会在分析前执行相当于 `git add -A` 的操作。为了最安全的预览，请先自行暂存目标文件。如果你一开始面对的是空索引，事后可用 `git status --short` 检查。

## 最短的成功流程

审阅预览之后，创建提交：

```
omp commit
```

只有在每个提交都成功后才推送：

```
omp commit --push
```

单提交提案无需额外确认即可直接提交。交互式拆分提案则会要求你在更改 Git 历史之前确认完整计划。输入 `y` 或 `yes` 以外的任何内容都会中止拆分。在非交互式 shell 中，有效的拆分计划不会弹出该确认，而是直接执行。dry run 永远不会请求确认。

`--push` 不会增加额外的确认。如果没有可提交的改动，`omp commit --push` 仍会尝试推送已有的本地提交；而裸的 `omp commit` 会报告没有可提交的内容。

## 哪些改动会被纳入

索引定义了边界：

*   只要已有内容被暂存，omp 就只考虑这些已暂存的改动。未暂存和未跟踪的工作不参与该流程。
*   如果什么都没有暂存，omp 会像 `git add -A` 那样，暂存所有已跟踪文件的修改与删除，以及未跟踪且未被忽略的文件。
*   被 Git 忽略的文件始终被排除。
*   已识别的依赖锁文件不参与语义分析，以免生成内容制造出错误的提交边界。它们仍会被提交：拆分计划在可能时会把锁文件归入包含其对应 manifest 的提交，否则归入最后一个提交。

默认流程可以在文件或 hunk 边界处切分改动。每个已暂存的改动在拆分计划中必须恰好出现一次，且一个文件不能被分配给多个提交。依赖关系决定提交顺序；无效依赖与循环依赖会在创建任何提交之前被拒绝。这意味着，一棵混杂着多个不相关任务的脏工作树可能变成多个有序提交，而不是一个包罗万象的大提交。

如果这不是你想要的结果，就缩小暂存范围并重新预览：

```
git reset
git add src/widget.ts test/widget.test.ts
omp commit --dry-run
```

这里的 `git reset` 只是取消暂存，并不会丢弃工作区的修改。

## 消息与校验

生成的标题遵循 Conventional Commit 形式：

`fix(parser): handled empty token streams`。

支持的类型包括 `feat`、`fix`、`refactor`、`perf`、`docs`、`test`、`build`、`ci`、`chore`、`style` 与 `revert`。可选的 scope 会被校验；摘要做规范化处理以去除重复的类型前缀，长度不超过 72 个字符，并且必须以过去式动词开头。针对类型的检查会拒绝明显不匹配的提案，例如声明 `docs` 却没有文档文件，或声明 `test` 却没有测试文件。消息正文（若存在）是一份列出重要细节的简短要点列表。无效的提案不会被执行。

提交前会显示诸如措辞含糊、细节列表过长或 `perf` 类型证据不足之类的警告；它们本身不会阻止有效的提案。

## Changelog 更新

除非设置了 `--no-changelog`，否则 omp 会从每个被改动的文件向上查找最近的 `CHANGELOG.md`，并在仓库根目录停止。已处于暂存集合中的 changelog 文件不会触发另一次目标查找。对每个检测到且可解析的 changelog，omp 会提出面向用户的条目并合并进未发布（unreleased）小节，同时避免重复条目，然后暂存更新后的 changelog。

在拆分流程中，生成的 changelog 文件会放入最后一个提交。changelog 更新会在交互式拆分确认之前应用，因此如果你拒绝该确认，即使没有创建任何提交，changelog 也可能已被修改并处于暂存状态。请检查 `git status --short`，视情况保留、取消暂存或还原该文件。

预览会执行 changelog 分析，但不会写入文件。当仓库不使用这种格式，或你想亲自编辑发布说明时，跳过所有自动的 changelog 检测与更新：

```
omp commit --dry-run --no-changelog
omp commit --no-changelog
```

## 上下文、模型与旧版流程

用 `--context`（或 `-c`）补充 diff 无法体现的简明信息：

```
omp commit --dry-run --context "This fixes #418 and preserves the old wire format"
```

用 `--model`（或 `-m`）为本次运行选择主模型：

```
omp commit --model anthropic/claude-opus-4-5
```

未指定 `--model` 时，omp 会先解析已配置的 `commit` 模型角色，再按常规的角色回退顺序处理。当前默认流程在 `smol` 角色可用时会将其用于提交 agent，并以所选的主模型作为回退。模型选择器可以使用与 omp 其他地方相同的 Provider、模型与思考级别语法。

默认采用的是上文描述的 agentic 流程：它可以查看单个文件和 hunk，产出一个提交或经过校验、按依赖排序的拆分，并在 agent 失败时回退为一次机械式的单个提交。只有当你确实需要旧的确定性编排时才使用 `--legacy`：

```
omp commit --dry-run --legacy
omp commit --legacy
```

旧版流程只创建一个由模型生成的提交，没有原子拆分评审，在模型生成失败时也没有机械式回退。它仍然遵循相同的暂存改动、changelog、hook、dry-run 与推送规则。

## 失败与安全恢复

每个生成的提交都会正常执行 Git hook。拒绝提交的 `pre-commit` 或 `commit-msg` hook 会打印 hook 自身的消息，并使 `omp commit` 以非零状态码退出。请修复报告的问题而不是绕过 hook，然后在重试前检查仓库状态：

```
git status --short
git log -5 --oneline
```

单个提交失败时，原本要提交的改动仍然可用，且通常仍处于暂存状态。拆分失败时，失败前已完成的提交保留在历史中；当前失败的那一组仍处于暂存状态，后续各组则保留在工作区中。omp 会报告已创建多少个提交，并确认没有任何改动丢失。不要盲目地重新执行最初的完整流程。先修复 hook 或文件，提交或取消暂存当前这一组，然后再次预览剩余工作：

```
git status --short
omp commit --dry-run
omp commit
```

如果已暂存的大文件或二进制 diff 无法安全切分，omp 会在创建拆分提交之前中止，并建议单独提交该大文件。缩小暂存范围，先提交该文件，再暂存并预览其余内容。

默认流程中模型或 agent 失败时，可能会创建一个机械式的单个兜底提交，同时仍以非零状态码退出。因此，**非零退出并不总是意味着没有创建提交**。请检查 `git log` 和 `git status`，审阅兜底提交的消息与内容，如果它不合适，就按你平时的非破坏性 Git 恢复流程对其 amend 或撤销。旧版流程在模型生成失败时则以非零状态码退出，且不会创建兜底提交。

只有在所有请求的提交都创建完毕之后才会推送。如果远程拒绝了推送或不存在上游，本地提交会保持完好，omp 以非零状态码退出。修复上游或远程状态，然后直接推送：

```
git push --set-upstream origin HEAD
```

或者，等分支有了可用的上游之后，让干净工作树路径重试这些已有提交：

```
omp commit --push
```

在拒绝拆分、hook 失败、出现兜底提交或推送失败之后，再次运行 `omp commit` 前，请始终以 `git status` 和 `git log` 的输出为准。避免使用 `git reset --hard`：以上任何失败路径都不需要丢弃工作区的修改。

## 选项

| 选项 | 效果 |
| --- | --- |
| `--dry-run` | 生成消息或拆分计划，但不提交、不写 changelog、也不推送。当索引起初为空时，可能会暂存所有改动。 |
| `--push` | 在成功创建提交后推送；当没有新内容可提交时，推送已有的提交。 |
| `--no-changelog` | 禁用 changelog 检测与更新。 |
| `--context <text>`、`-c <text>` | 为消息、拆分与 changelog 决策补充本次运行特有的意图信息。 |
| `--model <selector>`、`-m <selector>` | 覆盖本次运行的主模型选择。 |
| `--legacy` | 使用旧的单提交确定性流水线。 |
| `--help`、`-h` | 显示当前命令的帮助。 |
