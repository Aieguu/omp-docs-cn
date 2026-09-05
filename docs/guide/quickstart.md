# 快速上手

omp 在你现有的项目里工作：用自然语言描述一个改动，让 agent 检查并编辑代码，然后你审查结果、继续对话。本指南带你从安装一直走到一个可恢复的首次会话。

## 1. 安装 omp

macOS 或 Linux：

```
curl -fsSL https://omp.sh/install | sh
```

Windows 请在 PowerShell 中运行：

```
irm https://omp.sh/install.ps1 | iex
```

确认可执行文件已可用：

```
omp --version
```

如果 shell 找不到 `omp`，按安装器打印的 PATH 提示操作，然后打开一个新终端重试。

## 2. 打开你的项目

进入你想让 omp 工作的项目目录。启动 omp 的目录会成为本次会话的项目根目录。

```
cd ~/code/my-project
```

把 `~/code/my-project` 替换成你自己的项目路径。

如果你使用 API key，在启动前先在本终端导出它，例如：

```
export ANTHROPIC_API_KEY=sk-ant-...
```

如果你使用的是支持浏览器登录的订阅制 Provider，则跳过该命令；首次运行的设置向导会带你完成登录。

现在启动交互式应用：

```
omp
```

## 3. 登录并选择模型

首次启动会打开一个设置向导。

1. 在 **Set up your providers**（配置 Provider）界面保持 **Sign in**（登录）选项卡选中，选择你的 Provider 并按 Enter。完成浏览器登录后回到终端。你可以登录不止一个 Provider。
2. 如果你导出的是 API key，omp 已经可以使用它；按 Esc 离开 Provider 步骤即可。
3. 连接完 Provider 后按 Esc。
4. 在 **Choose your default model**（选择默认模型）界面输入文字搜索，从你配置的 Provider 中选择一个模型并按 Enter。omp 会为新会话保存这个选择。
5. 完成剩下的终端外观提示。每项都会在保存前预览效果。

之后的启动会直接进入提示符。OAuth 用户可以用 `/login` 重新打开登录；用 `/model` 切换当前会话的模型。

## 4. 给 omp 一个编码任务

在提示符处，用自然语言输入一个具体目标。这个例子很适合作为陌生项目的第一轮试用：

```
Inspect this project for one small bug or inconsistency that can be verified locally. Explain what you found, make the smallest safe fix, and run the most relevant check.
```

按 Enter。omp 会检查项目、以工具卡片的形式展示它的操作、在需要时编辑文件，并流式返回回答。按 Ctrl+O 展开或收起完整的工具输出。

## 5. 审查并继续

阅读最终摘要和报告的检查结果。在不离开会话的前提下要求一次有针对性的审查：

```
Show me the diff and explain each changed file. Do not make more changes.
```

然后像和同事协作一样继续跟进：

```
Looks good. Run the relevant check once more and summarize any remaining risk.
```

如果某一轮中 agent 走错了方向，按 Esc 打断它，再澄清你的要求。

## 6. 退出并恢复

按 Ctrl+D 或输入 `/exit` 退出。omp 会自动保存会话。

要续接该项目最近一次会话，回到同一个项目目录并运行：

```
omp --continue
```

对话和选定的模型会在同一项目中重新打开，你可以直接发送下一条消息。当你想从最近的会话中选择时，改用 `omp --resume`。

## 可选的下一步

首次会话不需要任何配置文件。当你想自定义 omp 时，继续阅读：

- [Provider](./providers.md) —— API key、OAuth Provider 与认证排错。
- [自定义模型与 Provider](./custom-models.md) —— 内置目录不够用时。
- [设置](./settings.md) —— 用户与项目配置。
- [使用 omp](./using.md) —— 编辑器、消息队列与日常流程。
- [会话](./sessions.md) —— 恢复、分叉与会话历史。
- [快捷键](./keybindings.md) —— 所有默认按键。
