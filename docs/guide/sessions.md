# 会话

会话是磁盘上 `~/.omp/agent/sessions/` 下的仅追加树结构，按工作目录分组，因此两个项目不会共享历史记录。每一轮对话是一个带有父指针的节点；分支操作移动叶子节点并从该处追加，因此原始时间线始终保留在文件中。有关磁盘上的数据格式，请参阅 [Session format](../reference/session-format.md)。

> 会话 ID 是 Snowflake 风格的十六进制，不是 UUID。它们按时间排序，因此 6 字符前缀如 `1f9d2a` 就足以标识一个会话。

## 恢复会话

四个参数覆盖常见场景：

```
omp -c                       # continue most recent in this cwd
omp -r                       # open a picker scoped to this project
omp -r 1f9d2a                # resume by id prefix
omp --resume ./session.jsonl # resume an explicit file
omp --no-session             # ephemeral; nothing written to disk
```

`-c` 优先使用每个终端的面包屑记录，因此同一目录下的分屏和 `tmux` 窗口不会互相干扰。如果面包屑记录缺失，则回退到当前目录中最新的会话，然后重新开始。

`-r <prefix>` 先在当前项目中查找 ID，再全局查找。如果匹配项在其他位置，omp 会先提示再将其分叉到当前目录，而不是静默切换目录。`--session` 是 `--resume` 的别名。

`--fork <id|path>` 将会话恢复到一个全新的文件中，并带有 `parentSession` 血统标记，原始文件保持不变。适用于脚本或一次性运行：

```
omp --fork 1f9d2a             # fork by id prefix
omp --fork ./session.jsonl    # fork from an explicit file
```

> `--no-session` 以临时模式运行：不会持久化任何内容，且 `/fork`、`/export` 和 `/share` 在该次运行中被禁用。配合 `-p` 使用可实现不在磁盘上留下痕迹的一次性管道。

完整参数参考：[CLI reference](../reference/cli.md)。

## 浏览会话树（`/tree`）

`/tree` 是原地导航器。它将叶子指针移动到当前文件中任何较早的消息——不会创建新文件，也不会分叉——这在某一轮对话走偏或你需要跳过一段冗长的工具调用时非常有用。

```
● 1f9d2a  user      "rewrite the importer to stream"
└─● 1f9d2b  assistant tool: read src/importer.ts
  ├─● 1f9d2c  assistant edit src/importer.ts          ← current leaf
  │ └─● 1f9d2d  user      "add a test for the stream path"
  └─● 1f9d2e  assistant edit src/importer.ts (alt)    ← branch B
    └─◆ 1f9d2f  [labeled: pre-refactor checkpoint]
```

- 输入文字可模糊搜索消息；←/→ 翻页浏览结果。
- Ctrl+O 循环切换过滤器：_default_ → _no-tools_ → _user-only_ → _labeled-only_ → _all_。
- Shift+L 为高亮条目添加标签。带标签的条目会在选择器中显示，并且在压缩后仍然保留，因此它们是"稍后回到这里"标记的理想工具。

## 分支 vs 分叉

`/branch` 留在同一个文件中，从之前的消息开始一个新线程——相同的 ID 空间，新的叶子节点：

```
/branch                       # message selector opens; pick where to branch
```

`/fork` 将历史记录克隆到所选消息为止，生成一个带有 `parentSession` 血统标记的全新文件。原始文件保持不变——当你想尝试不同的方法而不污染时间线时非常有用：

```
/fork                         # pick a message; opens a new file
```

> 当你希望一个文件作为某次探索的规范记录时，选择 `/branch`。当替代方案可能被放弃且你不希望它干扰父会话的 `/tree` 视图时，选择 `/fork`。

## 压缩（`/compact`）

`/compact` 将活动分支的较旧部分进行摘要，并用单个摘要条目替换；较近的轮次保持原文。可以传入一个焦点来引导摘要的方向，例如 `/compact Focus on the API changes`。磁盘上的文件不受影响——`/tree` 仍然可以回溯到压缩前的历史。自动触发器、配置以及三种计划模式审批路径请参阅 [Memory & compaction](./memory.md) 页面。

## 内部浏览

进入会话后，一些斜杠命令可以在不离开 TUI 的情况下完成日常管理操作。

| 命令 | 功能 |
| --- | --- |
| `/resume` | 打开当前项目的会话选择器。 |
| `/session info` | 打印 ID、路径、父级血统和统计信息。 |
| `/session delete` | 删除当前文件并返回选择器。 |
| `/new` | 在不影响当前会话的情况下启动新会话。 |
| `/drop` | 删除当前会话并启动新会话。 |
| `/rename <title>` | 设置选择器中显示的人类可读标签。 |
| `/move <path>` | 将会话重新绑定到不同的工作目录。 |

完整的斜杠命令清单和快捷键：[Slash commands](./slash-commands.md)。

## 导出

`/export [path]` 将当前会话写入一个自包含的 HTML 渲染——包括头部、条目、系统提示词、工具模式——并在浏览器中打开它。`omp --export <session.jsonl> [output]` 可以在不启动交互式会话的情况下完成相同操作，适合批量渲染归档文件。

`/dump` 将纯文本记录复制到剪贴板：系统提示词、活动模型、工具定义、每条消息和工具结果。`/copy` 针对更小的片段——`/copy last`（默认）复制最后一条代理消息，`/copy code` 复制最后一个代码块，`/copy all` 复制该消息中的所有代码块，`/copy cmd` 复制代理最后运行的 bash 或 python 命令。

## 分享

`/share` 导出为临时 HTML，然后运行位于 `~/.omp/agent/share.{ts,js,mjs}` 的自定义分享处理程序（如果存在）。如果没有处理程序，则回退到通过 `gh` 创建秘密 GitHub gist，并通过 `gistpreview.github.io` 打开结果。

> 自定义处理程序的失败_不会_回退到 gist——gist 路径仅在没有配置处理程序时运行。如果你的处理程序抛出异常，`/share` 会报告错误并停止。

### 自定义分享处理程序

在 `~/.omp/agent/share.ts`（或 `.js` / `.mjs`）放置一个默认导出的函数，`/share` 将调用它而非 gist 回退。签名如下：

```
// ~/.omp/agent/share.ts
export type CustomShareFn = (
  htmlPath: string,
) => Promise<{ url?: string; message?: string } | string | undefined>;
```

返回字符串（或 `{ url }`）时，omp 会在浏览器中打开并复制到剪贴板。返回 `undefined` 时，omp 假设你的处理程序已自行完成交互。

### 示例：上传到 S3

```
// ~/.omp/agent/share.ts
import { execFileSync } from "node:child_process";
import { basename } from "node:path";

const BUCKET = "s3://my-team-omp-shares";
const PUBLIC_BASE = "https://shares.my-team.dev";

export default async function share(htmlPath: string) {
  const key = `${Date.now()}-${basename(htmlPath)}`;
  execFileSync("aws", ["s3", "cp", htmlPath, `${BUCKET}/${key}`, "--acl", "public-read"], {
    stdio: "inherit",
  });
  const url = `${PUBLIC_BASE}/${key}`;
  return { url, message: `Uploaded ${key} (${BUCKET})` };
}
```

## 交接给队友

使用 `/handoff [focus]` 干净地结束当前轮次：它会写入一份结构化的收尾摘要，涵盖状态、待处理事项和后续步骤。接收者先阅读该条目，就能确切知道你在何处停下的，无需滚动整个记录。

然后选择一种传输方式：

**Gist（默认）**

`/share` 渲染为 HTML 并通过 `gh` 作为秘密 gist 上传。如果 `gh` 已完成身份验证则无需额外设置。

**自定义处理程序**

在 `~/.omp/agent/share.{ts,js,mjs}` 放置一个默认导出，`/share` 将通过它路由。

**原始文件**

如需完全可编辑的交接，直接发送 `~/.omp/agent/sessions/<cwd-hash>/<id>.jsonl` 中的 JSONL 文件。接收者恢复该文件：

```
omp --resume ./handoff.jsonl
```

> JSONL 文件是规范记录；HTML 只是一种渲染。如果你希望接收者继续迭代，发送 JSONL。HTML 用于只读审阅。

## 用法示例

### 断连后重新连接

SSH 会话在对话中途断开。代理仍在写入——`-c` 会选择当前目录中最近的会话并回放正在流式传输的尾部：

```
ssh box
cd ~/work/api
omp -c          # streams the in-flight assistant turn from where it left off
```

### 重构前快照

你即将进行一项高风险操作。标记当前叶子节点以便稍后返回：

```
/tree                       # opens navigator at the current leaf
# highlight the last user turn, press Shift+L
> pre-refactor              # label the bookmark
# Esc back to the prompt; do the risky thing.
# Later, if it goes sideways:
/tree                       # filter to labeled-only with Ctrl+O, find "pre-refactor"
/branch                     # branches from the bookmark, original timeline preserved
```

### 分叉以尝试不同方法

从最后一个用户轮次分叉，切换模型，给它十轮对话，如果效果不佳则放弃：

```
/fork                       # pick the last user turn; opens a new file
/model                      # switch to the model you want to evaluate
> redo this using streams instead of buffers
# If it works:  /handoff and /share the new file.
# If it doesn't: omp -r  → pick the original session, keep going.
```

### 交接前强制聚焦压缩

```
/compact Focus on the importer streaming bug and the fix in src/importer.ts
/handoff The streaming importer now copes with empty rows; remaining work is the test for the partial-flush path.
```

有关压缩何时自动触发，请参阅 [Memory & compaction](./memory.md)；有关磁盘上的 JSONL 格式，请参阅 [Session format](../reference/session-format.md)。
