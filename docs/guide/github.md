# GitHub

## 用提示词操作 GitHub

用 omp 来调查 issue、审阅 pull request、搜索仓库、创建或更新 PR 分支，以及监视 GitHub Actions，而无需把全部内容复制进对话。omp 使用 GitHub CLI（`gh`），因此它看到的仓库与权限，和你已登录的 GitHub 账号一致。

先安装并认证 `gh`，再启用 GitHub 能力：

```
gh auth login
gh auth status
omp config set github.enabled true
```

你也可以在 omp 会话中打开 `/settings`，开启 **Tools → Available Tools → GitHub CLI**。`github.enabled` 默认关闭。如果你是在一个已经运行的会话里启用它，而该能力仍然不可用，请新建一个会话后再试。

然后直接提出你想要的结果：

> 审阅 PR #482。总结行为变化，指出有风险的代码路径，并点名缺失的测试。不要 checkout 它，也不要改动任何东西。

omp 会展示它读取到的 GitHub 数据、链接回来源条目，并在执行某项 GitHub 操作前请求相应的审批。它不会在 `~/.omp` 中单独保存 GitHub token；认证仍由 `gh` 管理。

## 常见工作流

若你希望简短的 issue 或 PR 编号指代当前仓库，就在 `origin` 指向 GitHub 的 checkout 中运行 omp。在 checkout 之外，请在请求中点名仓库，例如 `owner/repo`。

### 调查 issue

让 omp 读取某个 issue 及其讨论、把它与代码联系起来，或与相关的报告做对比：

> 读取 issue #731，在此 checkout 中追踪受影响的代码，并解释最可能的根本原因。先不要改动文件。

> 找出 `acme/payments` 中最近两周内更新过的开放 `bug` issue。把重复项分组，并推荐三个影响最大的修复。

内置的 GitHub 能力可以读取和搜索 issue，但不提供专门的 issue 创建、编辑、评论或关闭操作。如果 omp 为这类写操作提出了一条独立的、基于 shell 的 `gh` 命令，那么该命令受你平时的 shell 审批策略约束。

### 审阅 pull request

审阅可以全程留在远端进行：omp 读取 PR 的元数据、讨论、变更文件列表，以及单个文件的 diff 或完整 diff。

> 审阅 PR #482，无需 checkout。重点关注认证回归、不安全的错误处理，以及测试是否覆盖了失败路径。

> 对比 PR #482 与 #497。解释哪种做法能更好地保全公共 API，并说明原因。

如果 pull request 位于另一个仓库，请表述明确：

> 审阅 `acme/widgets` 的 PR 482，并总结尚未解决的审阅意见。

### 在隔离的 worktree 中处理 PR

当确实需要在本地执行或编辑时，让 omp checkout 该 PR。GitHub 集成会创建一个专用的 git worktree，而不是切换或覆盖你当前的工作树。它会在结果中报告该 worktree 的路径。

> 在一个专用 worktree 中 checkout `acme/widgets` 的 PR 482，运行针对性的测试，修复失败的 redirect 测试，并把 diff 展示给我。先不要 commit 或 push。

> 提交已批准的改动，把它们推回 PR 482 的源分支，然后监视它的 CI。

PR 分支按 `pr-<number>` 命名。worktree 通常位于 `~/.omp/wt` 下；`OMP_WORKTREE_DIR` 会覆盖该位置，其次才是 `worktree.base` 设置。已有的匹配 worktree 会被复用。如果本地某个 `pr-<number>` 分支指向不同的提交，checkout 会停下来而不是重置它，除非你明确授权一次强制重置。

push 被刻意地加以约束：omp 只能对先前通过其 PR checkout 工作流获取过的分支使用 GitHub 的 PR push 工作流。这样可以保留 PR 的 head 仓库、分支与 fork 元数据，并防止某个任意的本地分支被误当成 PR 分支。当 PR 作者禁用了 maintainer 编辑、或你的 GitHub 账号缺少相应权限时，push 仍可能失败。

### 打开一个 pull request

在你审阅并提交改动之后，让 omp 从当前分支创建一个 PR：

> 从当前分支创建一个指向 `main` 的 draft PR。根据这些提交填充标题与正文，加上 `bug` 标签，并请求 `octocat` 审阅。把 URL 展示给我。

或者由你亲自提供文案：

> 打开一个标题为“Fix login redirect after SSO”的 PR，附上一份简洁的摘要与测试计划。目标分支设为 `main`，并保持为 draft。

创建 PR 属于远端写操作，按常规审批策略需要执行审批。

### 搜索 GitHub

omp 可以搜索 issue、pull request、代码、提交与仓库。用日常语言说明范围与过滤条件；当你已经知道 GitHub 搜索限定符时，它们也同样好用。

> 在本仓库中搜索 2026-07-01 以来创建、提及 token rotation 的开放 PR。

> 在整个 `acme` 组织范围内搜索对 `legacyAuthenticate(` 的调用，并列出涉及的仓库与路径。

> 找出 `acme` 组织中上个月 push 过、且提及 WebAuthn 的 Rust 仓库。

省略范围时，issue、PR、代码与提交的搜索默认落在当前 GitHub checkout 中。除非你的请求带上了 `org:`、`user:` 或类似的 GitHub 限定符，否则仓库搜索是全局的。搜索结果简洁且设了上限，所以请让 omp 收窄查询，而不是期待一份穷举式导出。

### 监视 GitHub Actions

让 omp 跟踪与当前 `HEAD` 关联的所有 workflow 运行，或者直接给它一个运行 URL：

> 监视当前 HEAD 的 GitHub Actions。如果有 job 失败，总结失败原因，并告诉我完整日志保存在哪里。

> 监视 `https://github.com/acme/widgets/actions/runs/123456789`，直到它结束。

结果会随 job 运行而更新。失败的 job 会连同日志末尾一起被快速上报；完整的失败 job 日志会保存为会话工件（artifact），并在回复中被引用。监视当前提交时，omp 会等待所有发现的 workflow，并在宣布成功前多做一次额外检查，这样就不会漏掉稍晚才启动的 workflow。

## 把 GitHub 引用粘贴到提示词中

`pr://` 与 `issue://` 是可选的、面向用户的引用。当裸数字有歧义、或你想查看某个特定视图时，把它们粘贴进提示词即可。你无需亲自调用读取文件的命令。

| 引用 | 含义 |
| --- | --- |
| `issue://731` | 当前 checkout 的 GitHub 仓库中的 issue 731，含评论。 |
| `issue://acme/widgets/731` | 完全限定的 issue。 |
| `issue://731?comments=0` | 不含讨论线程的 issue。 |
| `pr://482` | 当前仓库中的 PR 482，含评论与审阅。 |
| `pr://acme/widgets/482` | 完全限定的 PR。 |
| `pr://482/diff` | 变更文件列表。 |
| `pr://482/diff/3` | 列表中第三个文件的 diff；索引从 1 开始。 |
| `pr://482/diff/all` | 完整的统一 diff。 |
| `issue://?state=open&label=bug&limit=20` | 当前仓库中最近匹配的 issue。 |
| `pr://acme/widgets?state=merged&author=octocat&limit=20` | 指定仓库中匹配的 PR。 |

列表形式的引用默认返回开放条目，最多 30 条结果。`limit` 必须是正数，上限为 100。issue 列表接受 `open`、`closed` 或 `all`；PR 列表还接受 `merged`。列表可按一个 `author` 和一个 `label` 过滤。

示例：

> 解释 `pr://acme/widgets/482/diff/all` 对用户可见的影响，并指出迁移风险。

> 对照当前代码，对 `issue://?state=open&label=regression&limit=20` 做一次分类处理。

在交互式编辑器中，输入独立的 `#482` 会同时给出 PR 与 issue 的补全，因为 GitHub 共用同一套编号空间。输入 `pr #482` 或 `issue #482` 可以限定补全方向。

这些引用经由 omp 的 GitHub 后端读取支持来工作，不依赖总开关 `github.enabled`。它们仍然要求 `gh` 已安装、已认证，并能访问该仓库。

## 审批、隔离与缓存数据

GitHub 访问遵循三条可见的边界：

*   **GitHub 权限：** omp 只能访问当前 `gh` 账号有权访问的内容。它无法绕过组织 SSO、仓库权限、分支保护或 fork 限制。
*   **操作审批：** 仓库读取、搜索与 Actions 监视会请求读取审批；PR 创建、checkout 与 push 会请求执行审批。你当前所在的审批模式决定 omp 是否停下来等待确认。
*   **本地隔离：** PR checkout 会创建或复用专用的 worktree。它不会切换你当前工作树里的分支。checkout 会改变本地 git 状态；PR 创建与 push 会改变 GitHub。

单个 issue 与 PR 视图以及 PR diff 默认缓存在 `~/.omp/cache/github-cache.db`。缓存中可能含有私有 issue 的正文、评论、审阅、审阅评论与 diff。各行依据当前 GitHub 凭据的指纹彼此隔开，但该数据库仍是本机上的敏感数据，应像你的其余账号缓存一样加以保护。

新条目会在 5 分钟内被直接复用。更旧的条目会在 omp 于后台刷新它们的同时被返回，而超过 7 天的条目会被丢弃。若要避免 GitHub 视图被持久缓存：

```
omp config set github.cache.enabled false
```

## 设置参考

在 `gh` 认证之后，默认值即可正常工作，只是总体的 GitHub 能力需要被启用。

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `github.enabled` | `false` | 启用 GitHub 的仓库、文件、搜索、PR worktree/push/create 与 Actions 工作流。 |
| `github.cache.enabled` | `true` | 在本地缓存渲染后的单 issue、单 PR 与 PR diff 视图。 |
| `github.cache.softTtlSec` | `300` | 缓存视图无需网络刷新即可被返回的时长。 |
| `github.cache.hardTtlSec` | `604800` | 缓存视图被保留的最大时限。 |
| `worktree.base` | 未设置 | omp 管理的 worktree 的基准位置；未设置时通常解析为 `~/.omp/wt`。`OMP_WORKTREE_DIR` 优先。 |

用 `omp config get <setting>` 查看生效值，或参见[设置](./settings.md)了解配置文件与优先级。

## 故障排查

**GitHub workflow 不可用。** 运行 `gh --version`。当 `gh` 不在 `PATH` 中时，该能力不会被暴露。然后确认 `omp config get github.enabled` 输出 `true`；如果你是在会话开始之后才启用它，请新建一个 omp 会话。

**认证失败。** 运行 `gh auth status`，必要时再运行 `gh auth login`。对于私有仓库或组织仓库，请确认所选账号有权访问，且任何必需的 SSO 授权都处于激活状态。

**omp 无法确定仓库。** 请在带 GitHub remote 的 git checkout 中启动 omp，或在请求中包含 `owner/repo`。当有多个仓库牵扯其中时，请优先使用 `pr://acme/widgets/482` 这样的完全限定引用。

**PR 或 issue 视图显得陈旧。** 视图可能来自本地缓存。经由 omp 的近期写入会使相关缓存视图失效，但在其它地方产生的改动仍可能保鲜到 5 分钟软 TTL 的期满。在刷新后重试、调低 `github.cache.softTtlSec`，或在每次读取都必须命中 GitHub 时禁用缓存。

**PR checkout 拒绝已存在的分支。** 本地某个 `pr-<number>` 分支已经指向别处。在授权强制重置之前，请让 omp 解释这一不匹配之处；如果该分支中含有你需要的工作，就不要强制重置它。

**push 被拒绝。** 请确认 omp 最初是把该 PR checkout 进了它专用的 worktree，你的账号可以更新该 PR 的 head 分支，并且 fork 的 maintainer 编辑是被允许的。分支保护与必需的审阅仍然适用。

**看不到 Actions 运行。** 请确保提交已 push，且请求的仓库与分支正确。如果你知道该运行，请直接粘贴它的完整 GitHub Actions URL，而不是让 omp 从本地 `HEAD` 去推断。
