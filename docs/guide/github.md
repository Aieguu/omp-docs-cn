# GitHub

## 认证

所有操作底层都通过 `gh` 执行。使用 `gh auth login` 登录一次，agent 即可继承相同的凭据——`~/.omp/` 中没有 GitHub 专用配置。

## pr:// 和 issue:// URL

PR、issue 和 diff 可作为虚拟 markdown 文件寻址。agent 不需要学习新的 GitHub API；它通过打开本地文件的同一 [`read`](./files.md) 工具读取 URL。读取使用软 TTL 和硬 TTL 缓存（`github.cache.softTtlSec`、`github.cache.hardTtlSec`），因此在会话中重复读取同一项目不会再次访问网络。

| URL | 返回内容 |
| --- | --- |
| `issue://N` | 会话默认仓库的单个 issue——标题、作者、标签、正文、线程化评论。 |
| `issue://owner/repo/N` | 跨仓库的完全限定单个 issue。 |
| `issue://N?comments=0` | 不含讨论线程的 issue 正文。 |
| `pr://N` | 单个 PR 视图；页面指向对应的 diff URL。 |
| `pr://N/diff` | PR 的变更文件列表，每行指向 `pr://N/diff/<i>`。 |
| `pr://N/diff/all` | 完整的统一 diff，可按 hashline 锚定，agent 可通过锚点引用某个 hunk。 |
| `pr://N/diff/3` | 单个文件的 diff（从 1 开始计数）。 |
| `pr://`、`issue://` | 默认仓库中的最近项目；支持 `?state=open|closed|merged|all`、`?author=`、`?label=`、`?limit=`。 |

```
# 读取 PR 并浏览其 diff
read pr://1234
read pr://1234/diff
read pr://1234/diff/2

# 列出当前仓库中最近的开放 bug
read issue://?state=open&label=bug&limit=20
```

## github 工具

一个基于操作的分发器，处理读取之外的所有操作。通过 `op` 选择操作；每个操作使用参数的子集。

| op | 功能 |
| --- | --- |
| `repo_view` | 仓库元数据。可选 `repo` 和 `branch`。 |
| `pr_create` | 创建 PR。提供 `title`（和可选的 `body`）或设置 `fill: true` 从提交自动填充。接受 `base`、`head`、`draft`、`reviewer[]`、`assignee[]`、`label[]`。 |
| `pr_checkout` | 将一个或多个 PR 检出到专用的 git worktree 中。`pr` 可以是数字、URL、分支名或这些的数组。 |
| `pr_push` | 将已检出的 PR 分支推回其来源。要求分支是通过 `pr_checkout` 获取的。 |
| `search_issues` | GitHub issue 搜索语法。默认 `repo` 为当前检出。 |
| `search_prs` | GitHub PR 搜索语法。 |
| `search_code` | GitHub 代码搜索语法。不支持日期过滤。 |
| `search_commits` | 跨 GitHub 的提交搜索。`dateField` 被忽略；始终使用 `committer-date`。 |
| `search_repos` | 仓库搜索。使用 `org:` 或 `language:` 等查询限定符代替 `repo`。 |
| `run_watch` | 监视 Actions 运行。省略 `run` 可监视当前 HEAD 提交的每个运行。在检测到第一个任务失败时快速失败，并将尾部日志保存为会话产物。 |

搜索操作接受 `since` 和 `until`，可以是相对时间（`3d`、`12h`、`2w`、`1mo`）或 ISO 日期。两者都设置时，限定符变成范围。

### 读取 PR

最快的路径是 URL 协议——无需检出、无需 shell：

```
read pr://1234              # 元数据 + 评论
read pr://1234/diff         # 文件列表
read pr://1234/diff/all     # 完整统一 diff
```

如果你想在本地运行 PR，使用[子 agent](./subagents.md)的配套工具 `pr_checkout` 的 worktree 工作流：

```
github op=pr_checkout pr=1234
# cd 进入 worktree，运行测试，编辑，然后：
github op=pr_push
```

### 创建 PR

```
github op=pr_create \
  title="Fix login redirect after SSO" \
  body="Resolves #1198. Adds a regression test." \
  base=main \
  reviewer=["octocat","myorg/team-auth"] \
  label=["bug"]

# 或从提交日志自动填充
github op=pr_create fill=true draft=true
```
