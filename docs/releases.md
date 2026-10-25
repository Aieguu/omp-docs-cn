# 发布公告

> 归纳自 [oh-my-pi 官方 GitHub Releases](https://github.com/can1357/oh-my-pi/releases)，覆盖 v16.1.7 – v18.12.6 共 200 个版本。要点式中文总结，完整细节请查看对应官方发布页。

<details open>
<summary>v18.12.6（2026-10-21） · 2026-10-21</summary>

- 新增 ACP `_session/steering` 扩展,客户端可在回合进行中引导,也能排队 follow-up
- `/mcp reauth` 现可在 ACP、RPC 和打印模式(`omp -p`)下使用,失败时退出码为 1
- MCP 服务器连接失败不再阻断 ACP 会话启动,可通过 `/mcp reauth` 修复
- 空闲压缩不再在登录的 OpenAI Codex 账户上运行,避免丢弃未过期的提示词缓存
- `omp -p` 参数中的 `/compact`、`/handoff`、`/retry` 现在执行命令而非发给模型
- 仅注册工具/命令的扩展延迟到输入框就绪后加载,加快交互启动
- Yolo-Auto 目录更新,默认模型改为 `qwen3.8-27b`,移除已退役模型
- 修复 `/usage` 漏列无身份 OAuth 账户(如 Devin)等若干问题

</details>

<details open>
<summary>v18.12.5（2026-10-21） · 2026-10-21</summary>

- OpenAI GPT-5.6+ 现支持 12 小时提示词缓存(`cacheRetention: "long"` / `promptCache.ttl`)
- 修复个人 ChatGPT 账户 OpenAI Codex 请求全部 404 的问题
- 修复 Moonshot `kimi-k3` 缓存写入按零元计费,现按官方费率计价
- 修复 `task.enableEffort` 关闭时子代理仍按调用方 effort 生成的问题
- 修复 `omp update --check` 在 JFrog Artifactory 空 dist-tags 下失败
- 修复 macOS 后台操作焦点与 TS 风格规则报错等若干问题

</details>

<details open>
<summary>v18.12.4（2026-10-20） · 2026-10-20</summary>

- 新增 Inception 提供商原生支持(Mercury 3/2.5/2 模型),支持 `/login inception` 与 API 密钥登录
- `/review` 与 `/annotate code-review` 新增 GitLab 合并请求支持(需 `glab`)
- 新增 MCP 工具进度显示,进度更新出现在工具卡片与 Eval `mcp_progress` 状态行
- Eval `judge()`/`judge_batch()` 支持图片附件判断
- `/jobs` 新增任务树,子代理的后台作业嵌套显示在其任务之下
- Bedrock Claude 模型启用原生远程压缩
- 插件密钥设置不再对其他本地用户可读,锁文件权限收紧为仅属主
- 修复 GitLab MR 描述渲染、`/restart` 丢失活动档案等多项问题

</details>

<details open>
<summary>v18.12.3（2026-10-19） · 2026-10-19</summary>

- 新增「Ask and remember」审批模式(`tools.approvalMode: always-ask-cached`),文件读取前询问并可跨会话记住授权
- 新增 `/forget-approvals` 命令,清除已记住的文件/文件夹授权
- bash 作业新增 `proc://…/streams`,可实时查看管道输出(如命令尾部接 `tail` 的场景)
- 后台作业新增由 `widget` 模型角色设计的进度小部件,`wait` 卡片显示作业磁贴与图表
- 聚焦子代理时,`/model`、`/effort` 等命令直接切换该子代理的模型与思考级别
- `PI_REQ_DEBUG=1` 请求转储不再明文写入 API 密钥等凭证
- 修复 Google AI Studio 上 Gemma 4 系列请求全部失败的问题(改用 `thinkingLevel` 控制思考)

</details>

<details open>
<summary>v18.12.2（2026-10-18） · 2026-10-18</summary>

- `computer` 工具大改:新增 `el.selectText`、`el.type`/`el.press`、菜单项选择等后台输入能力
- 新增 `computer.backgroundFallback` 设置(`takeover`/`refuse`),无后台路径时决定是否抢占前台重试
- 电脑使用时按 Esc 停止余下回合的 computer 调用,恢复前台须等下一消息
- 新增 DeepSeek 网页搜索引擎(`web/deepseek`),复用 `DEEPSEEK_API_KEY`
- 默认 `judge` 角色改用 TypeSafe Jev 1.14 模型
- 修复自动后台模式下 bash 会话变量/函数在调用间丢失的问题
- 空闲压缩时机对齐 1 小时提示词缓存 TTL,避免摘要错过缓存上下文
- macOS 用户干预后输入不再误发,新增 `UserIntervened` 错误

</details>

<details>
<summary>v18.12.1（2026-10-17） · 2026-10-17</summary>

- Eval 中移除 `display()`,`print` 与 `console.log` 取代其作用(破坏性变更)
- 打印 DataFrame、大对象、Markdown 对象时分别以表格、JSON 树、Markdown 渲染,图片打印即附到结果
- 新增 `advisor.continueSeverity`,可设定唤醒已完成代理的最低顾问意见级别
- 代理输出最终答案后的顾问 concern 默认继续运行而非停在末尾
- 修复 TLS 代理拒绝压缩请求体导致所有请求失败的问题,现自动以未压缩重发
- 修复 tmux 下 Kitty 终端图片空白,以及 Tern 未知扩展名文件的高亮识别

</details>

<details>
<summary>v18.12.0（2026-10-17） · 2026-10-17</summary>

- 请求压缩机制调整:`PI_CODEX_ZSTD` 改为 `PI_REQUEST_COMPRESSION`,`=0` 可关闭压缩
- Anthropic 官方 API 请求体改用 gzip,GitHub Copilot 请求改用 zstd,长对话上传体积减少 60-75%
- 连接预热覆盖全部内置提供商,回合间保持连接以减少握手开销
- Claude Opus 5.5 在工具调用间回复的文本不再折叠进 Thought 块,正常显示为回复
- 新增 `statusLine.segmentOptions.pi.showProfile` 选项隐藏状态栏档案名
- 新增 `sharpshooter.minPromptLength`,可配置 Sharpshooter 提取决策的最短提示词
- `models.yml` 中自定义模型的 `contextWindow`/`maxTokens` 现优先于目录限额规则
- 修复断网/TLS 失败只显示通用 Connection error 等多项问题

</details>

<details>
<summary>v18.11.3（2026-10-16） · 2026-10-16</summary>

- 新增 `/seance` 命令与 `seance` 任务代理,可只读查阅已保存会话而不恢复它
- 新增 `prewalk.auto` 设置(`off`/`suggest`/`on`),由原生 judge 决定是否启用预走查移交
- 状态栏在品牌图标旁显示当前档案名(如 `π-work`)
- 工具审批弹窗现提供「本次批准/本会话批准/拒绝」三项选择,方向键与回车操作
- 修复 `read` 读取 RSS/Atom 订阅源每项都显示 Untitled 的问题
- 修复 Command Code 的 `z-ai/glm-5.3-flash` 请求全部失败,现路由到 chat completions
- 修复 OpenRouter Muse 模型 `/handoff` 400 报错与 OpenCode Zen 复活已退役模型

</details>

<details>
<summary>v18.11.2（2026-10-16） · 2026-10-16</summary>

- `omp auth-gateway serve` 新增 `--clients` 选项,可为每个客户端签发限定模型/账户范围的承载令牌
- 新增 `lsp.requestTimeout` 设置,配置语言服务器诊断与请求的等待时长
- TypeSafe Jev(`jev-latest` 等)新增实验性原生图片判断支持
- GPT Image 模型(`gpt-image-*` 等)独立为 `gpt-image` 家族,不再套用聊天模型规则
- 代理的 `todo` 更新随下一次工具调用一并发送,减少单独的模型回合
- 修复 GitHub Copilot 用量将 AI 积分额度误报为「Premium Requests」单位的问题
- 修复 `grep` 仅搜索直接命名文件前 4 MB 导致漏报匹配的问题
- 修复浏览器 `tab.fill` 输入日期/颜色时值错误、`uploadFile` 多场景失效等问题

</details>

<details>
<summary>v18.11.1（2026-10-15） · 2026-10-15</summary>

- /jobs 与后台任务面板新增任务树，子代理任务嵌套显示，只能取消自己的任务
- eval 的 judge()/judge_batch() 支持图片附件判定
- OpenAI Decisions、Workers AI 判定与视觉对话等新增图片输入支持
- 修复 Codex 图像生成忽略 aspect_ratio/image_size 的问题
- Claude 在 Google Vertex 的 prompt 缓存可保留 1 小时（原 5 分钟）
- Gemini 4 Argon 改用 thinkingLevel 并修复报错；移除已退役的 Gemini 3.5 Flash
- Grok 4.20 模型上下文按服务器 1M 上限修正，自动压缩按 1M 计算
- 修复 Windows Terminal 键位错乱、流式表格跳动及会话历史写盘失败等问题

</details>

<details>
<summary>v18.11.0（2026-10-14） · 2026-10-14</summary>

- Tern 新增麦克风按钮，支持录音转写与本地 Nemotron 流式听写
- 新增 SambaNova Cloud 提供商，可通过 /login sambanova 登录
- 工具审批等待期间仍可打字，发送消息即拒绝审批并引导代理
- 会话条目记录写入它的 omp 构建版本，/session 可列出
- agent frontmatter 新增 structured: true 以保留结构化任务结果
- 浏览器 ariaSnapshot 不再把密码字段值输出到模型上下文
- 修复 /new 忽略计划模式与 git 提交忽略 commit.gpgsign 签名的问题
- omp usage 中失效的 Codex 配额最多保留 24 小时

</details>

<details>
<summary>v18.10.4（2026-10-13） · 2026-10-13</summary>

- 新增 omp gc --compress 压缩闲置会话，压缩后仍可恢复与搜索
- 工具审批提示改为输入框内展示，改用 Ctrl+Enter 批准
- 扩展可观察并应答交互式计划评审（plan review）
- Devin 长上下文模型默认 272K/200K 窗口，可用 /extended-context on 切换
- Gemini 4 Argon 定价补齐，2026-12-01 起按 $4/$20 新价计费
- 修复会话在其它推理模型下 snapcompact 后 Claude 拒绝继续的问题
- 模型浏览器与 omp models --json 改按生效价格显示

</details>

<details>
<summary>v18.10.3（2026-10-12） · 2026-10-12</summary>

- 新增 omp --restore 恢复崩溃或被杀的会话及未完成的子代理
- task.agentSoftRequestBudget 可为命名子代理设置独立请求预算
- 新增 Muse Wonder 1.0 模型及未分类模型的 opt-in 思考档
- 图片数量与字节预算按官方端点区分（Anthropic 90/600、Codex 200/2000）
- 上下文 token 估算按实际计费修正：Claude 思考、GPT-5+ 改用 o200k_base
- 修复 Claude 在 Antigravity 上大图超 5 MB 报错，现自动缩放后发送

</details>

<details>
<summary>v18.10.2（2026-10-12） · 2026-10-12</summary>

- 新增 CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS 以兼容拒绝实验性 beta 的网关
- 新增 task.structured 设置；未开启时子代理改为纯文本返回结果
- 新增 /tree 分支导航，可绑定 Shift+Left/Right 在分支间跳转
- 后台 bash/eval 任务卡片实时输出，wait 单行列出任务信息
- 新增 env、du、chmod、nl 等内置 shell 命令

</details>

<details>
<summary>v18.10.1（2026-10-12） · 2026-10-12</summary>

- Tern 回答下方新增复制按钮，一键复制该回答
- 运行中代理与后台任务合并为一个计数徽标（主要为界面调整）
- /session pin 与 /usage reset 改用统一选择器，显示账户与确认条
- 修复 grep 单文件结果显示异常（主要为内部变更）

</details>

<details>
<summary>v18.10.0（2026-10-12） · 2026-10-12</summary>

- 新增 /fork，可在流式回复期间创建新 Tern 面板分叉会话
- 新增 omp session pack/unpack/moved，可迁移会话到另一台机器继续
- 新增 omp auth export/import，迁移模型登录状态
- 待处理的 ask 提问可用 Alt+H 隐藏，稍后恢复
- 本地 IPC 改用仅所有者可访问的原生传输（Windows 命名管道）
- mnemopi 嵌入模型改为跨会话共享，空闲 15 分钟自动退出
- 修复对话框或报告关闭后输入框下出现空白行的问题

</details>

<details>
<summary>v18.9.2（2026-10-11） · 2026-10-11</summary>

- 新增 OpenAI Decisions API 与 Cloudflare Workers AI 判定支持
- 新增 Cloudflare Workers AI 登录（loginCloudflareWorkersAi）
- computer 元素新增 doubleClick 操作
- 修复 models.yml 裸模型 id 误解析为本地服务，并新增端点不可达警告
- Tern 终端在 tmux 内支持原生 TSP 渲染
- 修复 /tan 分叉继承父任务子代理花费的问题（主要为内部变更）

</details>

<details>
<summary>v18.9.1（2026-10-11） · 2026-10-11</summary>

- Bedrock Converse 可关闭 thinking-binding 控制以兼容拒绝它的网关
- 修复嵌入式 shell 执行无 #! 行脚本报 Exec format error
- 修复内联图表与图片移动、隐藏后残留重叠副本的问题（主要为内部变更）

</details>

<details>
<summary>v18.9.0（2026-10-11） · 2026-10-11</summary>

- 浏览器工具可发现并操作已打开的页面，而非总是新开视图
- /settings → Context 新增 Extra Context Files，可自定义指令文件名
- 新增 composer.predictions 下一句幽灵文本预测，Tab 或方向键采纳
- 新增 retry.fallbackOn，可将模型回退限定为配额错误或非配额错误
- 新增 omp usage reset，列出并赎回已保存的 Codex、Claude 限流重置
- macOS computer 工具操作时保持屏幕唤醒，并报告锁屏或休眠状态
- 独立二进制更新改用 Stencil 服务并校验 SHA-256，补丁更小
- 修复 Gemini 思考回显、Cursor 恢复丢推理、grep 长行匹配等问题

</details>

<details>
<summary>v18.8.9（2026-10-10） · 2026-10-10</summary>

- 新增 /fork pane/window/tab，在 tmux、Zellij、Orca 等新面板打开分叉
- 扩展终端启动支持 tmux、Zellij、Herdr、CMUX
- Tern 输入栏显示 git 分支与状态，点击可进入 /git
- 表格图表增强：before/after 变化倍数、评分比例与多指标小图

</details>

<details>
<summary>v18.8.8（2026-10-10） · 2026-10-10</summary>

- 新增 /jobs kill 命令，可取消指定或全部后台任务
- 新增 omp anonymize 与 /dump anon，生成可分享的匿名会话副本
- contextFiles.extra 可加载额外上下文指令文件
- /annotate 支持用外部编辑器打开注记草稿
- /models 压缩点可设为扩展窗口，超出标准窗口时自动启用
- 提示编辑器补齐 Vim 查找、替换、括号匹配等按键
- 修复浏览器后台标签抢占选中标签与恢复会话丢失早期推理的问题

</details>

<details>
<summary>v18.8.7（2026-10-09） · 2026-10-09</summary>

- 新增 CoralBricks 提供商，支持 /login 与模型发现
- 新增 OSC 7501 程序状态上报，终端可显示工作、等待或失败状态
- /rename 新增标题卡片（图标加短码），可用 title.icons: boring 关闭
- 小众语言语法按需下载，离线时跳过并提示
- 新增 bash.gitGuard，阻止共享 checkout 上的危险 git 操作
- 新增 speech.speed 与 tts.localSpeed，调整本地 Kokoro 语音速度
- 内置 jq 升级至 jaq 3.1.1，修复 null 处理等兼容问题
- 修复浏览器下载目录错乱与 /resume 选择器闪烁的问题

</details>

<details>
<summary>v18.8.6（2026-10-08） · 2026-10-08</summary>

- 新增按会话隔离的 Git worktree 支持（`worktree.onStart`/`worktree.onExit` 设置），会话结束自动清理
- xAI 网络搜索扩展 X 帖子搜索；登录后可读取 X 帖子、话题与个人主页，替代失效的 Nitter
- 新增基于提示词缓存的对话裁剪，压缩后的历史保留在缓存回看窗口内
- 修复 Google Gemini 与 Antigravity 因工具 schema 含不支持的 JSON Schema 关键字而请求失败
- 修复多账号下鉴权代理不按所选账号配额计费、Claude 流式标记解码错误
- 修复 `/switch` 因模型速度统计含无名模型而崩溃、`lsp`/`generate_image` 读取 FIFO 等设备路径卡死
- 修复 `/wt` 移动的会话从恢复列表消失、`@advisor` 子代理误用内置 slow 模型

</details>

<details>
<summary>v18.8.5（2026-10-08） · 2026-10-08</summary>

- 新增按模型自动压缩阈值：`/models` 预览压缩点，Roles 视图用 `k` 键设置，或配置 `compaction.modelThresholds`
- 修复处于保留额度边界的账号被误判为可用、`omp token --force-refresh` 不重新签发令牌
- 修复 Cursor、GitHub Copilot 上 Claude Haiku 5.5 定价显示为 0 或未定价
- 修复 Anthropic 网络搜索不遵循自定义提供商的 OAuth 请求格式与请求头
- 修复粘贴的图片无法打开、`/usage` 误将多个 Google Antigravity 账号当作会话账号
- 修复短模型选择器丢失显式思考等级、损坏的 `plugin-overrides.json` 被静默忽略
- 记忆新增链接只指向仍有效的记忆，避免图向已失效记忆增长

</details>

<details>
<summary>v18.8.4（2026-10-08） · 2026-10-08</summary>

- 修复 Cursor 登录无法续期（约 60 天后失效），并新增已结束会话的重登提示
- 修复 Gemini、DeepSeek、Grok 输出重复代码或标记时被误判思考循环而重试
- Agent Hub 打开时保持现有代理位置不变，新代理插入合适位置
- Tern 各弹窗（BTW 历史、git 快捷键、autoresearch、计划审阅等）补充可点击的关闭或取消按钮
- 修复 Tern 中相对路径文件链接无法按会话工作目录打开的问题
- 修复 `/new` 把计划或目标模式残留到新会话；`--model` 等按 `modelProviderOrder` 选择提供商
- 修复 `omp usage` 历史读取、同邮箱账号区分、耗尽账号标签等显示问题
- 修复 Claude Haiku 5.5 在 Bedrock、Vertex 等宿主错误使用 1M 窗口与计价档位

</details>

<details>
<summary>v18.8.3（2026-10-07） · 2026-10-07</summary>

- 新增 Claude Haiku 5.5：自适应思考、图像输入、1M 上下文、128K 输出及分档定价
- 修复 OAuth 令牌刷新瞬时失败导致会话以「无 API 密钥」错误终止，现改为重试
- 修复重复打开模型选择器、模型中心或代理视图时叠出多个重复窗口

</details>

<details>
<summary>v18.8.2（2026-10-07） · 2026-10-07</summary>

- 修复长会话中大量工具截图导致 Anthropic 请求超限：实时图片按字节裁剪，可恢复的 413 会压缩旧历史
- 修复 Tern 浏览器标签页未加载完成即返回，导致首次 `observe()`/`title()` 读到空白页
- 移除 `task`、eval `agent()`、`workpool()` 的按次调用 `model` 覆盖，子代理改用配置的模型

</details>

<details>
<summary>v18.8.1（2026-10-07） · 2026-10-07</summary>

- 新增子代理 OAuth 账号池：代理及其关联任务只能使用指定账号，并提供 `omp usage accounts` 列出账号键
- 新增会话级 OAuth 账号池限制（`AuthStorage.sessions.restrict`），限制选择、回退与认证范围
- 生成的会话标题现含卡片图标与短代码（`title.icons` 可配置样式）
- 新增 `PI_NATIVES_DIR` 配置，可自定义原生插件解压目录
- 修复 `/new` 残留计划或目标模式与待办状态；`--resume <path>` 对不存在的路径报错
- 修复 `write`/`edit` 处理 FIFO、设备文件时挂起或耗尽内存；`omp gc --archive --apply` 残留孤立标题
- 修复 Codex Fast 定价按 2.5× 计入用量、GitHub Copilot 分层提示限制误用长上下文窗口

</details>

<details>
<summary>v18.8.0（2026-10-07） · 2026-10-07</summary>

- `write` 工具预览渲染：SVG 显示为图片、Mermaid 显示为图表；Tern 支持 3D 模型格式预览
- 新增 `title.icons`（Nerd Font/emoji 标题卡片）与 `title.generator`（标题生成方式）设置
- Tern 中浏览器默认以画中画打开（可用 `app.tern: false` 关闭）；`/fork` 在相邻窗格打开
- Tern 待办卡片默认显示清单并可点击标题折叠
- 修复 Gemini、DeepSeek、Grok 输出重复代码时被误判思考循环；Anthropic 工具变更后 HTTP 400
- 修复 `/new` 残留计划或目标模式、大段未闭合标签粘贴导致界面卡死
- 会话标题优先用会话自身模型生成，缺 Nerd Font 符号时仅请求 emoji

</details>

<details>
<summary>v18.7.0（2026-10-07） · 2026-10-07</summary>

- 新增 Mistral Large 4（推理、图像输入、1M 上下文）；Google Antigravity 支持 Claude Opus 5.5/Sonnet 5.5
- `read` 工具新增一等 JSON/JSONL 查询：`?q=<jq-filter>`，支持原始或紧凑输出与分页
- 新增 `/prewalk off` 取消待执行的模型交接；RPC 客户端新增登出支持
- 新增自动图表生成（`tui.autoGraph`）与代理生成的 SVG 内联渲染（`tui.renderSvg` 可关闭）
- 启用自动兑换时，临近过期的 Codex/Claude 余额重置额度可最后时刻使用
- MiniMax Token Plan 改用 Anthropic 兼容 API；GPT-6 Astra Ultrafast 按 6×/8× 官方费率计费
- 修复 `tail` 在文件大小为 64 KiB 倍数时丢内容、`sed`/`jq` 读被截断文件导致 SIGBUS

</details>

<details>
<summary>v18.6.3（2026-10-06） · 2026-10-06</summary>

- 新增 Snowflake Cortex 提供商：浏览器 OAuth 登录、流式 Claude/OpenAI 模型
- 计算机使用增强：`computer.zoom()`/窗口缩放、应用发现与启动、窗口菜单、macOS Space 助手
- 新增 `app.stt.pushToTalk` 按键（默认 Space）与 `expandThinkingBlocks` 保持思考块展开设置
- RPC 新增 `/btw` 侧边问题、`abort_and_restore_queue`、`/slow` 状态查询与模型绑定
- 修复 OpenAI/Codex 远程压缩 V2 丢弃近期消息、Anthropic 原生压缩思考块签名无效被拒
- 修复 Claude 被限速时每 10 秒重轮询用量；Muse Code 连接中断可恢复已完成回答
- 快照压缩帧数从 17 增至 26，并按实际读取的模型计价
- 恢复会话时若保存的模型不可用则报错，而非静默改用其他模型

</details>

<details>
<summary>v18.6.1（2026-10-06） · 2026-10-06</summary>

- 修复 DeepSeek 系列兼容性：保留暖会话推理上下文、正确处理不完整的 DSML 工具调用包装
- 子代理后续消息现作为后台任务显示，可等待或取消，且只投递一次
- `/switch` 自动补全改用与模型选择器一致的排序，并支持 `@role` 别名
- 修复 `pi.exec()` 中超时或信号终止的进程误报退出码 0，现返回 -1
- 修复长 `/btw` 回答被截断无法滚动，现显示在可滚动的 BTW 历史面板
- 修复 Git diff 窗格中 Space 键滚动而非暂存或取消暂存焦点代码块
- 修复含大量截图的会话中原生 OpenAI 压缩被图片体积估算误拒

</details>

<details>
<summary>v18.6.0（2026-10-03） · 2026-10-03</summary>

- 修复 Antigravity 因过期客户端版本（回退至 2.19.1）导致刷新后 Claude Opus 5.5 等模型消失
- DeepSeek 的 DSML 工具调用现可在所有宿主解析（llama.cpp、LM Studio、vLLM、自定义提供商）
- DeepSeek 输出残缺工具调用时，破损标记不再写入历史，代理会告知模型并重新询问
- 修复 DeepSeek V4 与 V4.1 Flash 模型身份缺失版本信息
- `/models` 角色视图显示当前生效的模型预设，Ctrl+←/→ 切换；选择模型后光标直达模型列表
- 修复 Windows 上 Alt+Up 等转义序列按键被当作 Esc 中断回合的问题
- 修复 Windows 上调试适配器等进程中途退出触发 EPIPE 崩溃会话

</details>

<details>
<summary>v18.5.1（2026-10-03） · 2026-10-03</summary>

- RPC 新增 GPT 实时语音会话支持，并发布机器可读 RPC 协议 schema 与 Python/Rust/Go 客户端
- Eval 新增只读 `archive` 全局对象，可浏览项目、历史会话与提示词历史（默认启用）
- 修复 OpenRouter BYOK 用量被计为免费，现计入推理成本；Claude 后台 `bash` 丢失超时
- 修复 DeepSeek/OpenAI Responses 因重放的修复参数或孤立工具结果导致请求失败或重试循环
- 本地记忆嵌入升级到 fastembed 3.0.0（Hugging Face 下载、断点续传、ARM64 支持）
- 识别 Kimi K3（`k3`/`k3-256k`）选择器；Fireworks 模型改用自有费率并更新快速模型列表
- 修复 macOS 计算机使用滚动手势、日期或时间控件输入与弹出按钮选择
- `wait` 只等待调用方自己启动的后台任务；多子代理 `task` 有一方失败时正确报告失败

</details>

<details>
<summary>v18.5.0（2026-10-03） · 2026-10-03</summary>

- 新增 `/effort [level]` 命令：不切换模型即可设置思考等级，支持选择器与补全
- 新增 `/dump all`：把主转录、LLM 请求及各子代理转录打包成 zip 并复制路径
- `task`、eval `agent()`、`workpool()` 新增按次调用的 `model` 选择器（`provider/model[:level]` 或角色别名）
- `/changelog`、`/context`、`/jobs`、`/mcp`、`/ssh` 等命令报告不再写入转录，改为独立面板或全屏页
- 欢迎横幅改为 omp logo 与版本号加提示，不再显示模型、LSP 与最近会话
- 流中 socket 断开后先在同一模型上重试一次，而非立即切换回退链
- 修复多项 Windows 问题：粘贴乱码、RPC 标准输出死锁、守护代理随进程退出、`core.autocrlf` 被忽略
- 子代理完成探测改为递增间隔（2、5、10、30 分钟后每小时），仅交互会话主代理触发

</details>

<details>
<summary>v18.4.12（2026-10-02） · 2026-10-02</summary>

- 新增 `omp auth-gateway stdio`，为外部程序提供 JSONL 常驻推理服务。
- Tern 原生编辑器中 Ctrl+Z 改为撤销上次编辑，不再挂起终端。
- 修复网页搜索停在 Perplexity 匿名注册墙，现回退到下一个提供商。
- 修复 `omp update` 在返回完整包文档的注册表上失败，改读 dist-tags 版本号。
- 修复 Windows 导入 Claude Code 会话显示编码目录名，现恢复为注册的项目路径。
- 修复守护代理卡死时 `wait`/`proc://` 超时及作业状态误报等问题。
- 修复 JS eval `wait()` 忽略位置参数超时、协作访客误报空闲等问题。

</details>

<details>
<summary>v18.4.11（2026-10-02） · 2026-10-02</summary>

- 新增 RPC 目标管理：可创建、暂停、恢复、删除目标，支持 `--goal` 启动与自动续行。
- 新增 RPC `fork` 命令：可在任意记录处分叉会话，连同产物迁移到新文件。
- 子代理新增完成度百分比估算，可用 `task.completionProbeMs` 配置轮询间隔。
- 修复自动选中的模型不支持配置的思考级别，首回合失败问题已解决。
- 修复 `read` 读取标准输入、FIFO 等非常规文件时挂起，现直接拒绝。
- 技能描述与预测数据遵循 XDG 目录并自动迁移旧数据；`~/.omp` 不再误用。
- 修复独立二进制安装下 `omp update` 找不到 GitHub 版本，改装最新发布版。

</details>

<details>
<summary>v18.4.10（2026-10-02） · 2026-10-02</summary>

- 新增顾问审查节奏与逐顾问追赶策略，支持最终产出审查与严格等待。
- 新增 `/jobs full` 显示后台作业完整命令行，普通 `/jobs` 仍截断显示。
- 工具参数 JSON 被截断或带尾随文本时不再执行，解析错误返回给模型。
- 修复空白、超长或含控制字符的工具名导致 400 错误，现从历史剔除。
- MiniMax Token Plan 等模型用量不再显示为免费，改为按量计费估价。
- 修复 Vertex 上 Sonnet 5.5/Opus 5.5 的 400 与签名思考错误。
- `ps` 内置 `-r` 改为按 CPU 占用排序，并新增 `-m` 按内存排序。
- 修复 `read`/`ida` 分析大型二进制时无限挂起，现两分钟超时并报错。

</details>

<details>
<summary>v18.4.9（2026-10-01） · 2026-10-01</summary>

- 新增 `omp gc --stale` 过期会话回收：清理孤儿标记、过期调试报告与协作副本。
- RPC 新增取消或引导单个子代理的命令，无需中止整个会话。
- RPC 新增词补全命令与可选问答对话框模式，宿主可一次提交全部答案。
- TUI 新增后台作业视图：可选中作业、查看状态与目录/PID/退出码并取消。
- eval 产物默认限制 16 MB（保留首尾），可用 `artifactMaxBytes` 调整。
- 新增 SDK 接口检查与取消后台作业；`omp predict` 对比视图改为交互式。
- 修复 NTFS 等无写时复制文件系统上 `/wt` 误标未修改文件及 Windows 粘贴延迟。
- 修复多 omp 进程会话持久化冲突，避免回合丢失或交错，必要时切换新会话文件。

</details>

<details>
<summary>v18.4.8（2026-10-01） · 2026-10-01</summary>

- 修复 Apple 芯片 macOS 27 以下启动段错误，仅 27+ 加载。
- 主题 JSON 新增可选 `terminal` 段（背景/前景/组件/ANSI 色）。
- 修复原生终端（TSP）帧因未确认的信用额度而延迟渲染的问题。

</details>

<details>
<summary>v18.4.6（2026-10-01） · 2026-10-01</summary>

- 新增实时后台作业视图与代理谱系导航，可从子代理一键返回主会话。
- Tern 重做转录导航：Esc-Esc 逐轮分支回退，图片用内置查看器打开。
- 状态栏拆分显示本会话与子代理花费，并与 Agent Hub 合计一致。
- 新增 Claude 提示缓存预热：按配置寿命在 Bedrock/Mantle 保持缓存有效。
- RPC 客户端新增队列消息管理，可将排队的跟进消息提升为引导消息。
- Tern 努力度指示器可视化思考级别，最高级别显示为火球效果。
- 修复 Opus 5.5/Sonnet 5.5 经 Amazon Bedrock 的强制工具调用失败。
- 纯文本模型的附加图片描述增加 20 秒超时，中止时保留图片并告知模型。

</details>

<details>
<summary>v18.4.5（2026-09-30） · 2026-09-30</summary>

- 新增 Factory Droid 提供商：OAuth 登录、HTTP 流式与区域模型目录。
- 新增模型预设：`/modelpreset` 保存角色分配与思考级别并一键切换。
- `/review` 菜单新增「审查指定 PR」选项，列出打开的拉取请求并支持 `#123`。
- `omp plugin upgrade` 现可升级 npm/git 安装的插件与裸市场插件名。
- Cursor 接入账户目录：真实价格与上下文，Grok 合并为 `grok-4.7`。
- 认证网关默认按套接字归属对端，可用 `--trust-proxy-headers` 恢复转发头。
- 新增子代理工具预览，显示当前工具调用与涉及文件，`subagentLivePreview` 开启。
- 修复扩展提供商把环境变量名当 API key 发送，`/login` 保存的密钥现优先。

</details>

<details>
<summary>v18.4.4（2026-09-29） · 2026-09-29</summary>

- 新增 `ultrafast` 服务层级：`/fast ultra` 选择，按标准费率计费。
- Tern Surface Protocol（TSP）原生终端渲染集成落地，新增原生转录等 UI。
- 空会话直接输入 `exit`/`quit`/`q` 即可退出。
- 新增可选 `input.bareSlashCommands`，免斜杠直接执行命令。
- `ask` 工具的自定义答案与备注提示现支持粘贴图片。
- RPC 新增移除单条排队消息与实时队列事件（`queue_update`）。
- 不同来源的同名技能不再静默丢弃，低优先级者保留命名空间访问。
- 新增 GPT-6.1 Sol 的 Codex 定价与 922K 扩展上下文上限。

</details>

<details>
<summary>v18.4.3（2026-09-29） · 2026-09-29</summary>

- Command Code 新增 Claude Sonnet 5.5 等模型，价格对齐官方 CLI。
- Command Code 用量限制（5 小时、每周、积分）现显示于 `/usage` 与状态栏。
- 默认网页搜索链改为仅免费引擎（Parallel、Exa、Firecrawl），付费需显式配置。
- `web/hosted` 跟随模型而非宿主，经代理/网关可用；图片生成优先用本提供商图像模型。
- 新增 `PI_SMART_GIT=1`：git worktree 写时复制克隆，自带构建缓存。
- 无效的 `--thinking`/`--mode` 参数现报错退出（exit 2）。
- 无终端时 `omp "prompt"` 按无头模式运行。
- `cp` 内置命令支持 macOS `-c` 克隆参数；移除 setup 的网页搜索选择。

</details>

<details>
<summary>v18.4.2（2026-09-28） · 2026-09-28</summary>

- `task` 与 `/vibe` 子代理获得独立 eval 内核，不再共享父会话状态。
- `find` 工具在裁决模型卡住 20 秒后报超时错误，不再阻塞回合。
- 修复 Cursor 原生 Grep/Glob 无结果、Write 建文件失败等工具结果错误。
- 修复 Google Antigravity 每回合请求都被拒（429）的问题。
- 修复 CRLF 换行的 SKILL.md 把 YAML frontmatter 注入技能消息。
- 上下文溢出检测改用上报的上下文大小，修复 Cursor 回合被误判触发压缩。
- `cp` 在 macOS 与 Windows ReFS/Dev Drive 上默认写时复制克隆。

</details>

<details>
<summary>v18.4.1（2026-09-28） · 2026-09-28</summary>

- 修复「Anthropic 流停滞」等中断后纯文本回合无法恢复，现让模型续写（最多 3 次）。
- 修复 Bedrock 上 Grok 4.6/Opus 5.5 的 xhigh/max 级别被降级。
- 修复 Cursor「Other Models」额度耗尽阻塞 Grok/Composer，并补齐定价。
- 滚动 TPM/RPM 限流 429 不再当作额度耗尽结束回合，按瞬时错误处理。
- `omp usage`/`/usage` 在查询失败时仍保留已连接账户，显示为不可用。
- HTML 会话导出改为内联查看器库，离线或严格 CSP 下也能渲染。
- 修复 `disabledProviders` 中的提供商仍可通过回退链应答并取得凭据。
- AST 条件规则在 `write`/`edit` 执行前拦截，`eval` 内调用同样受规则约束。

</details>

<details>
<summary>v18.4.0（2026-09-28） · 2026-09-28</summary>

- 统计仪表盘全新改版：立即打开并后台同步，新增 judge 分类的 Frustration 页。
- 新增 `telemetry.otlpExportEnabled`，可关闭 OTLP 遥测导出。
- 协作 Web 客户端重新设计：黑色外壳、玻璃顶栏与停靠式输入卡片。
- OAuth 登录页重新设计；托管 OpenAI 图像生成结果附带模型与尺寸/质量元数据。
- 新增启动警告：Python 评估缺解释器时提示配置 `python.interpreter`。
- 修复 Cursor 用量/成本核算不准、MCP 调用被当文本返回、超时单位错误。
- 目标模式下所有待办被阻塞时改为等待用户输入，不再重复请求批准。
- 修复 8.3 短路径、`edit` PUT 语法错误、`xargs -P` 并行限制。

</details>

<details>
<summary>v18.3.5（2026-09-27） · 2026-09-27</summary>

- 网页搜索链新增 API 计费的 Responses 搜索（`gpt-6-luna` 等）。
- `omp setup` 新增「OpenAI API」，ChatGPT-OAuth 改 Codex。
- 新增提示缓存预热（`providers.cacheWarming`，默认 idle），临期重放请求。
- 语法高亮改用 Oniguruma 编译，内存约降至 1/5、速度提升 3–5 倍。

</details>

<details>
<summary>v18.3.4（2026-09-27） · 2026-09-27</summary>

- `task` 的 `complexity` 改 `solutionSpace`，auto 选努力度。
- 修复模型把全部输出预算用于推理导致数小时循环，现提示分步执行。
- 修复会话中途 `^` 标记模型导致后续回合丢失提示缓存。
- 修复 Anthropic OAuth 输出被限制 64k，现按模型完整上限（128k）请求。

</details>

<details>
<summary>v18.3.3（2026-09-27） · 2026-09-27</summary>

- 新增统一预测文本引擎（N-gram/SmolLM2/macOS），支持混合评分与后台下载。
- 新增 `omp predict` 评估补全性能，可导入 Codex/Claude Code 历史。
- 新增 `omp skill list [dir] [--json]`，列出技能及发现警告。
- 新增实时引导（steering）：流式进行中即可接收并响应引导消息。
- `task`/`bash` 代理获得 `wait` 工具；聚焦子代理视图新增 `/btw`。
- `retain`/`learn` 支持全局或项目记忆范围；窗口输入默认后台执行。
- 修复 Collab 主机断网后无法回收房间，现自动重试且不丢访客与更新。

</details>

<details>
<summary>v18.3.2（2026-09-26） · 2026-09-26</summary>

- 新增 Claude 订阅用量上限收尾提示：显示 `wrapping up` 与重置时间。
- 扩展上下文新增 `ctx.agent`，可判断主代理或子代理及层级。
- `edit`/`write` 不再拒绝手工编写的 `generated.go` 等文件。
- 修复哈希行 `PUT N*`/`CUT N*` 误删块后语句及 Go 1.26 解析报错。
- 修复失败的远程压缩被每回合重发，现失败后改用下一个配置的方法。
- 修复 `/slow off` 无限重发请求、Windows TEMP 变量为 8.3 短名。

</details>

<details>
<summary>v18.3.1（2026-09-25） · 2026-09-25</summary>

- 支持实时操控，Codex WebSocket 与 GPT-6 响应进行中可继续输入
- 新增 `/slow` 命令，订阅会话可选低优先级服务档位
- 新增 `cfg://` 配置协议及会话级配置变更授权
- 新增 IDA Pro 集成，可浏览伪代码与交叉引用并执行数据库操作
- 浏览器中继支持同时连接 Chrome、Edge 等多个浏览器实例
- 新增 `local://`、`omp://` 原生文件系统支持与 `cp` 内置命令
- 修复 `omp update` 不遵循配置的 npm 源、Windows 行选择器读取异常
- 修复 OpenCode Go 与 SuperGrok 账户选择，自动跳过无可用额度的账户

</details>

<details>
<summary>v18.3.0（2026-09-24） · 2026-09-24</summary>

- 破坏性变更：`hub` 工具废弃，改用 `wait`、`write` 与 `proc://`
- 新增 `toks` 离线 token 计数命令与 `omp://` 文档搜索
- `omp login` 支持终端 OAuth 登录，含浏览器辅助登录与账户策略配置
- 新增 `/annotate` 注释与 `/changelog last [N]` 查看近期版本更新
- 支持 Apple 设备上的 Foundation Models 本地推理与工具调用
- 新增 `*** Insert Before/After` 编辑操作与会话级后台任务管理
- 剪贴板粘贴的图片自动保存到会话产物目录，可被代理读取
- 修复 Windows Terminal 匈牙利语等键盘布局下 AltGr 字符丢失

</details>

<details>
<summary>v18.2.11（2026-09-23） · 2026-09-23</summary>

- 新增内置 StepFun 提供商，支持 step-5-preview 模型与实时模型发现
- 修复 GitHub Copilot Grok 4.x 请求失败及 GPT-6 模型成本估算错误
- 修复 Claude Opus 5.5 会话中途切换高推理强度不生效
- 设置页新增 Skills 区域；rio 终端启用 OSC 8 超链接
- `/shake thinking` 现在报告释放的 token 数；修复启动版本说明滚动问题
- 扩展新增 `before_subagent_spawn` 钩子，可在子代理生成前介入
- 修复背景任务完成时打断前台 Bash/eval 调用的问题

</details>

<details>
<summary>v18.2.10（2026-09-22） · 2026-09-22</summary>

- 新增 `/record` 录制终端会话为 `.ompcast`，可用 `omp play` 回放
- Claude 保存的重置额度支持发现与兑换，可在使用视图及 `/usage reset` 中管理
- 新增实时基准测试结果表，按模型实时排名展示性能指标
- 多个提供商默认模型更新为 claude-opus-5-5 或 claude-sonnet-5
- AWS Bedrock SSO 会话过期后自动刷新，无需重复执行 `aws sso login`
- read 工具默认内联解码图片，SVG 需显式 `:img`；移除图片 `?q=` 查询参数
- 粘贴/拖入的图片保留原始文件路径；会话可跨文件系统移动
- 修复 Vercel AI Gateway 非 Anthropic 模型的工具调用失败

</details>

<details>
<summary>v18.2.8（2026-09-21） · 2026-09-21</summary>

- 新增文本嵌入、重排序、视频/图像生成、语音合成与转写等多项 AI 服务支持
- OpenRouter 提供商扩展嵌入、重排序、视频生成与语音等能力
- 浏览器自动化新增无障碍审计、React 检查、控制台与网络监控、性能追踪等功能
- 浏览器安全控制增强：可配置 HTTPS 错误处理、域名白名单与标签页自动回收
- 新增通过自定义提供商声明原生 judge（typesafe 等）
- 视频处理新增视觉变化检测，支持 FFMPEG 分析与 SVG 叠加
- 修复长时间会话扫描凭据过慢、原生 judge 忽略请求头等问题

</details>

<details>
<summary>v18.2.7（2026-09-21） · 2026-09-21</summary>

- 新增 `find` 工具与命令，支持用自然语言进行语义化工作区搜索
- 破坏性变更：`bash` 工具移除 env 参数；web 搜索覆盖改用 `--model` 指定
- 新增批量评估 `judge_batch`，支持后台执行与跨会话等待/重挂任务
- 系统提示词支持 Handlebars 模板与运行时设置数据
- 图像、网页、语音、听写、judge 与记忆等模型角色现可配置与回退
- Mermaid 图表改用原生渲染器，支持流程图、时序图等多种类型
- 新增 Glyph 协议，无需补丁字体即可渲染图标
- 修复 llama.cpp 的 Qwen 模型发现与路由（PrismML Bonsai 2 等）

</details>

<details>
<summary>v18.2.6（2026-09-18） · 2026-09-18</summary>

- 修复剪贴板为空时粘贴卡顿，图片与文本读取改为并发执行
- 修复 Windows 下 `omp auth-broker token` 等命令静默退出、不生成令牌
- 优化 Anthropic 提示缓存与记忆召回时的系统提示词稳定性

</details>

<details>
<summary>v18.2.5（2026-09-17） · 2026-09-17</summary>

- 新增 `omp stream` 直播终端会话，支持观众聊天与屏幕内容脱敏
- `/login` 新增 Stencil 账户支持，用于 `omp stream` 频道认证
- 破坏性变更：终端 UI 模块迁移至 `@oh-my-pi/pi-tui` 包
- 新增 `dark-celestial` 内置主题与 MCP 添加向导
- 合并冲突支持并排 diff 展示，todo 项可添加详情与备注
- 编辑工具默认启用「仅可见行」校验，防止对未显示内容执行编辑
- OAuth 流程支持自定义基础地址与认证地址模板

</details>

<details>
<summary>v18.2.4（2026-09-17） · 2026-09-17</summary>

- 新增 TypeSafe 判断后端，支持 `/login typesafe` 或环境密钥启用
- 思维强度检测、意外停止检测与 AI 辅助 git 暂存统一使用可配置的判断系统
- Eval 单元格新增 `judge(state, questions)` 评估助手，返回带概率的答案
- 新增 `composer.tokenRate`，实时显示平滑的每秒输出 token 数
- 修复 kitty 与 Ghostty 中调整终端大小时内联图片消失或空白

</details>

<details>
<summary>v18.2.3（2026-09-17） · 2026-09-17</summary>

- 在编辑器中输入 `^` 可标记模型用于委派，生成会话级 `m1`、`m2` 子代理
- 提供商登录支持掩码输入的敏感信息提示，RPC 拒绝此类提示
- 修复 sloppy 编辑在含多字节（如 CJK）文本时崩溃的问题
- `tab.waitForSelector` 返回的元素句柄现可直接传入 `tab.evaluate`
- 修复恢复的子代理丢失父会话扩展钩子、同路径移动失败等问题

</details>

<details>
<summary>v18.2.2（2026-09-16） · 2026-09-16</summary>

- 内置敏感信息遮蔽扩展至连接 URL 与多种密钥格式（AWS、JWT、PEM 等）
- 新增 `tui.titleSpinner` 设置，可选终端标题的四种工作状态动画
- Bedrock 流式请求支持自定义 `baseUrl`（VPC、PrivateLink 等）
- 凭据数据库损坏时自动备份并重建，登录后即可恢复凭据
- 套餐额度已用尽但仍有 Codex 额度的 ChatGPT 账户仍可被选用
- 修复长时会话中转录折叠、安全审查代理误报等问题

</details>

<details>
<summary>v18.2.1（2026-09-15） · 2026-09-15</summary>

- 破坏性变更：`/drop` 重命名为 `/delete`；新增 `CUT`/`PASTE` 编辑操作
- 新增 `omp cleanse` 命令：自动检测检查器、解析诊断并并行修复，带实时进度
- 新增从 Claude/Codex 导入会话的功能（`--from-claude` 等）
- read 工具新增 macOS sample 与 V8 `.cpuprofile` 性能报告解析
- 新增 `/vision` 命令与 `inspect_image.mode` 三态视觉委派设置
- 新增 `providers.autoThinkingMaxEffort` 设置，调高自动思维上限
- 启动版本说明默认紧凑摘要（`startup.changelogMode` 可调）
- 修复 collab 授权绕过漏洞、长流式回复冻结 TUI 等多项问题

</details>

<details>
<summary>v18.2.0（2026-09-15） · 2026-09-15</summary>

- 新增 ollama 网页搜索提供商，凭 OLLAMA_CLOUD_API_KEY 调用其搜索接口
- 支持 readUrl 抓取 ollama.com 模型页，提取描述、标签与架构元数据
- 目录新增 DeepInfra、LiteLLM、Qwen Portal、SiliconFlow 提供商
- 新增 Gemini 3.8 Flash 模型，提供商目录改由 KDL 规则文件编译
- /skill: 输入完成或补全后成为原子技能卡片，可整体删除并支持草稿恢复
- 转录新增网关模型替换警告，标出实际返回的 Claude 模型与请求不符
- omp 编译产物预置字节码，启动耗时由约 250 毫秒降至约 30 毫秒
- 修复 OpenCode Go 配额重置窗口解析，耗尽凭证按服务端时限锁定

</details>

<details>
<summary>v18.1.22（2026-09-14） · 2026-09-14</summary>

- 400 调试转储脱敏各类 provider 认证头，避免共享转储泄露 API key
- omp git 与 /git 新增 delete 操作，可丢弃选中文件或目录的改动
- memory 报告加入隐私提醒，提示分享前先自查其中的敏感信息
- /debug 内存报告改用数值统计，不再输出可能含凭证的堆快照
- 启用 Ollama 模型的 assistant prefill 支持
- 修复 Zen GPT-6 Astra 改走 Responses 端点，避免 HTTP 500 报错
- 移除 timeoutMs、async.pollWaitDuration，hub 等待改用自适应窗口

</details>

<details>
<summary>v18.1.21（2026-09-14） · 2026-09-14</summary>

- 修复 Flatpak Chromium 启动器识别，app.path 可正确管理浏览器档案
- 规范化 user-data-dir 参数，相对 profile 路径统一转为绝对路径
- 浏览器自动化可与已运行的 Chrome 共存，隔离 profile 且不杀进程
- 新增统一的浏览器档案目录，存放由浏览器工具拉起的 Chromium 档案
- 并发安装共享同一次下载，卡住的下载会超时并清理后重试

</details>

<details>
<summary>v18.1.20（2026-09-13） · 2026-09-13</summary>

- 新增 collab.autoStart 设置，会话启动即自托管，手机或面板可随时接入
- 新增 omp collab list 与 omp collab link，用于枚举会话并获取访问链接
- 修复 Windows OAuth 升级后因残留回调注册导致的登录失败
- 修复 DeepSeek V4.1 Flash 与 LiteLLM 模型组的图片输入能力误判
- 修复 Muse Spark 因加密推理回放在工具调用轮次报 400 的问题
- Eval 的 completion() 支持按配置的重试回退链自动切换模型
- 修复范围 grep 拒绝文件名含通配符的既有文件

</details>

<details>
<summary>v18.1.19（2026-09-12） · 2026-09-12</summary>

- 新增 Charm Hyper 内置提供商，支持密钥登录与实时模型发现
- /usage 显示预付余额，Kimi 七天限流与总配额不再互相混淆
- 新增 /btw 侧边对话历史，支持持久化答案与多轮追问
- 重试回退链支持为每个模型指定 reasoning effort 档位
- 新增 task.agentServiceTierOverrides，按名精确覆盖服务档位
- 为本地读取引入默认关闭的投机执行，含 JS/Python eval 投影读取
- 修复 Windows 安装脚本在 Windows PowerShell 5.1 上失败的问题
- 修复 Claude Code 双分隔符 MCP 工具名无法命中注册工具

</details>

<details>
<summary>v18.1.18（2026-09-11） · 2026-09-11</summary>

- 新增 Anthropic 服务端压缩 remote 后端，Opus/Sonnet 4.6+ 可用
- Anthropic OAuth 默认保留 1 小时提示缓存，减少空闲导致的缓存过期
- Anthropic 请求每 15 个用户轮次插入历史衰减缓存断点，稳定缓存前缀
- 开启 tui.mouse 后可用鼠标点击子代理卡片与跳转列表行
- 置顶 Subagents 区块默认折叠，display.pinnedAgents 可设 full
- 修复 Go DeepSeek Flash 误删图片输入与 DeepSeek 384K 输出上限
- 修复 Windows PowerShell 5.1 安装脚本被正常 stderr 输出中断

</details>

<details>
<summary>v18.1.17（2026-09-10） · 2026-09-10</summary>

- 新增 tui.vimMode 可选 Vim 模态编辑，含状态栏模式段与光标形状
- Ctrl+C 清除的未发送草稿可用上方向键召回，可在设置中关闭
- 新增 plan.autosave，方案模式完成后自动保存到项目的 plans 目录
- 新增 Command Code 内置提供商，支持密钥登录与实时模型发现
- 费用显示新增 DeepSeek 峰谷电价指示，价格按生效日期自动切换
- 工具名打错时给出相近工具建议，避免多花一轮往返才能纠正
- omp models 现在报告图片是否真正送达模型，而非仅看目录声明

</details>

<details>
<summary>v18.1.16（2026-09-09） · 2026-09-09</summary>

- /rename 不带标题时用 tiny 模型根据近期对话自动生成会话名
- 新增实验性笔记支撑的上下文窗口，含分支本地笔记与滚动工具
- /loop 支持 --until 与 --while，用 shell 命令退出码控制是否继续
- 修复 Codex 中断回合在工具调用完成后自动继续而非直接停止
- /extensions 搜索支持输入 j 与 k，裸 j/k 不再移动列表选择

</details>

<details>
<summary>v18.1.15（2026-09-08） · 2026-09-08</summary>

- 新增 advisor.maxNotesPerUpdate 设置，默认每轮最多 4 条建议
- 无头浏览器标签在回合结束后冻结，闲置超 30 分钟自动关闭
- 子代理模型徽章可显示思考档位、模型名与顾问图标
- GitHub Copilot 登录改回最小授权 OAuth 应用，企业组织可正常登录
- Copilot 计划或模型策略 403 不再删除已保存的凭证
- 内置 clangd 与 ast_grep 补充 CUDA 源文件与头文件支持

</details>

<details>
<summary>v18.1.14（2026-09-07） · 2026-09-07</summary>

- 修复关闭推理的请求报 400，自动回退到最低可用 effort 档位
- 修复 Cursor GPT 非档位请求发送变体 id 被 Run 端点拒绝
- 修正 Codex Astra 上下文窗口上限与长上下文计费规则
- 修复 /loop 运行中插话会覆盖循环提示词而非作为一次性指令
- 修复 Ask 自定义答案粘贴或多选后需要重复提交的问题

</details>

<details>
<summary>v18.1.13（2026-09-07） · 2026-09-07</summary>

- 修复 Astra 默认上下文窗口恢复为文档标注的 1.05M
- 修复 Herdr 分栏内会话通知无法送达的问题
- 子 shell 环境变量来源判定更精确（主要为内部变更）

</details>

<details>
<summary>v18.1.12（2026-09-06） · 2026-09-06</summary>

- 新增 Muse Code 订阅登录、凭证刷新与 /usage 配额报告
- 目录新增 Muse Code 提供商与 Muse Spark 模型，支持实时账户发现
- Muse Spark 1.3 新增 Meta 的 max 推理档位
- Muse Code 请求改用精简编辑提示，每请求减少约 3KB 工具字节
- 修复 GPT-6 Astra 经 Copilot 的端点问题、定价与上下文窗口
- memory:// 绑定发起会话，同目录的多个会话不再互相读取记忆
- 全屏 /copy 改为打开最近尾部并缓存行集，长会话不再卡顿

</details>

<details>
<summary>v18.1.11（2026-09-05） · 2026-09-05</summary>

- 新增 retry.waitForUsageReset，额度耗尽时休眠至重置时间再重试
- 新增 bash.allowCompoundCommands，可对 && 命令链逐段审批
- GitHub Copilot 登录只申请基础资料权限，恢复企业组织登录
- 修复选中行过长放不进上下文时的提示，提供可用的恢复选择器
- 修复越南语、韩语等带重音的提交摘要被误判为超长

</details>

<details>
<summary>v18.1.10（2026-09-04） · 2026-09-04</summary>

- 修复 Codex V2 远程压缩忽略思考关闭与缓存前缀重建的问题
- subagent 的 yield 改为直接传入 data 与 error，不再嵌套包装
- 修复 Plan Review 中的鼠标点击、悬停与滚轮滚动失效

</details>

<details>
<summary>v18.1.9（2026-09-04） · 2026-09-04</summary>

- 浏览器与计算机自动化改用 JS/Python 求值前导及可复用标签句柄
- 移除 inspect_image 工具，改为 read 图片附带问句参数提问
- 新增 /switch 命令，仅切换当前会话使用的模型
- 新增 worktree.cleanSource 设置，创建 worktree 时清理原始检出
- Bash 支持把 Kitty 与 Sixel 终端图形提取为图片结果
- Markdown 中指向本地文件的链接现在可以直接点击
- 修复 /login zai 支持 Z.AI 更新后的认证流程与回调地址配置
- 移除内置的 librarian 代理

</details>

<details>
<summary>v18.1.8（2026-09-03） · 2026-09-03</summary>

- GPT-6 Astra 加入 OpenAI Codex 目录，支持 apply_patch 工具
- 会话中切换思考档位时保留提示缓存，覆盖 OpenAI 与 Codex 提供商
- 修复 omp models refresh 被吊销令牌阻塞其余模型的发现
- 后台任务改用结构化输出，可通过 agent 资源读取完整结果
- 修复子代理活动与批量执行导致的 TUI 数分钟卡顿

</details>

<details>
<summary>v18.1.7（2026-09-03） · 2026-09-03</summary>

- 移除 Ruby 与 Julia eval 后端，仅保留 Python 与 JavaScript
- Python eval 工具调用改为异步协程，需用 await 调用工具
- 新增异步 agent 与 completion 句柄，替代 parallel/pipeline
- 新增 eval workpool，把任务排队到上下文负载最低的常驻子代理
- 新增 Windows ARM64 原生二进制，安装与更新可感知架构
- 新增 MLX 后端在 Apple 芯片运行本地 tiny 模型，含 Qwen3 1.7B
- 修复 DeepSeek Responses 回放缺少 reasoning_text 导致的 400

</details>

<details>
<summary>v18.1.6（2026-09-03） · 2026-09-03</summary>

- 支持流式工具参数更新，工具调用进度展示更实时
- Codex GPT-5.6 默认改走完整 Responses，支持工具调用并行
- 新增视频附件与读取能力，含预览网格与时间点、帧号选择器
- 模型选择器新增智能评分与预计输出吞吐量等目录指标
- 新增 /copy link 与 /open 命令，渲染块和链接可复制或打开
- 新增 agent 作用域规则，可用 ttsr list 与 test 查看适用规则
- 新增 Firecrawl 作为可选的 providers.fetch 抓取后端
- 新增末尾行读取选择器，可读取文件、归档或 URL 的最后若干行

</details>

<details>
<summary>v18.1.5（2026-09-03） · 2026-09-03</summary>

- 新增 /login abliteration，支持 ABLITERATION_API_KEY 等变量
- 新增 /wt 与 omp worktree add，创建关联 worktree 并迁移当前会话
- 新增 worktree.clone 克隆优先模式，可保留被忽略的构建产物
- 外部用户级配置改为通过 enabledProviders 显式启用
- 新增 Abliteration 提供商与 GLM 5.3 Promo 50 模型
- GitHub Copilot 改用官方 Copilot CLI 身份与 OAuth 应用发起请求
- 移除内置 designer 子代理与 designer 模型角色

</details>

<details>
<summary>v18.1.4（2026-09-02） · 2026-09-02</summary>

- 为支持的模型启用 Cursor 工具 schema 投影
- Gemini Flash 3.6 起各档位折叠为单一按版本模板化的路由条目（主要为内部变更）

</details>

<details>
<summary>v18.1.3（2026-09-02） · 2026-09-02</summary>

- 支持 Claude Fable 5.1 模型，更新 Claude 系列定价与上下文限制
- doubleEscapeAction 新增 tree，双 Esc 可直接打开会话树
- 回退到用户消息改为在当前会话内分支，/rewind 成为 /branch 别名
- TypeScript 7 项目改用 tsc --lsp 提供代码智能支持
- 修复内建 grep 与 sed 的正则语义，加号按字面匹配、反斜杠加号为运算符
- 修复 Gemini 3 并行工具调用后在 Antigravity 与 Vertex 上永久卡死
- 修复 Bedrock 上无签名 thinking 块导致整个会话被拒
- 修复 API key 账号轮换遵循服务端报告的配额重置窗口

</details>

<details>
<summary>v18.1.2（2026-09-01） · 2026-09-01</summary>

- 为 Amazon Bedrock 模型加入思考强度控制
- 支持对话中途动态更新 Anthropic 系统提示、工具与推理强度
- 新增 Claude Fable 5.1、DeepSeek V4 Flash Vision 等新模型
- sloppy 编辑格式改用 XML 标签，编辑错误附带可复制的指令载荷
- 可通过 edit.recoverInlineEdits 找回以纯文本形式输出的编辑指令
- 顾问可读取活动记忆后端，并在支持时使用 recall 工具
- 修复后台模型发现完成后活动会话自动刷新上下文窗口限制

</details>

<details>
<summary>v18.1.1（2026-09-01） · 2026-09-01</summary>

- 修复数万未跟踪文件的 worktree 上 git status 引发的原生崩溃与内存暴涨

</details>

<details>
<summary>v18.1.0（2026-09-01） · 2026-09-01</summary>

- 新增原生 ClinePass 提供商，支持 CLINE_API_KEY、订阅与配额报告
- 新增原生 Devin 提供商，含动态模型目录、路由模型与用量报告
- /usage 改为全屏仪表盘，含订阅网格与 GitHub 风格的活动热力图
- 双 Esc 打开全屏回退选择器，支持渲染项导航与分支式回退
- Agent Hub 新增 Activity 视图，/hub 成为实时运维入口
- 项目及上级目录中的独立 CLAUDE.md 与 AGENTS.md 一并加载
- 新增 Traces 仪表盘，含交互时间轴、可搜索转录与成本统计
- 新增 /trace 命令，在统计面板中展示当前会话的 trace 地址

</details>

<details>
<summary>v18.0.11（2026-08-29） · 2026-08-29</summary>

- 状态栏默认以紧凑图标显示思考档位，可关闭以恢复原显示方式
- 新增 composer 与状态栏组件的画廊预览，可按表面或分段浏览
- 修复 MCP OAuth 发现支持嵌套路径的授权服务器，如 Keycloak realm
- 修复 HTTP 402 与停用工作区响应的凭证回退分类，避免误判为配额耗尽
- 修复 Cursor Kimi K3、Grok 4、Composer 2.5 的图片输入能力标注
- 修复损坏图片不再永久阻塞后续请求与会话恢复
- 开启 tui.hyperlinks 时，聊天链接生成可点击的终端超链接

</details>

<details>
<summary>v18.0.10（2026-08-28） · 2026-08-28</summary>

- 新增 Sharpshooter 记忆后端，含 /memory queue 与 sync 控制
- 新增 /restart，原地重启 omp 并恢复当前会话
- 新增 band 状态条外观，成为新的默认 composer 形状
- 失败或中断的工具调用可原地重试，按 F5、Alt+R 或 /retry 免额外往返
- 行尾按右方向键可接受补全建议、内联幽灵文本与拼写纠正
- 修复 Windows 上 Python eval 导入 numpy 等原生扩展时无限卡住

</details>

<details>
<summary>v18.0.9（2026-08-28） · 2026-08-28</summary>

- 目录新增 Z.AI GLM-5.3-Flash 模型，支持 1M 上下文、图像输入与多档思考等级。
- SDK 移除 git/jj 封装，VCS 操作改用 pi-natives/vcs 原生接口。
- extendedContext 默认关闭，高级长上下文模型（如 GPT-5.6 1M）保持标准定价窗口，可经 /extended-context on 开启。
- 改进 OAuth 登录流程，浏览器无法自动关闭登录页时显示回退提示。
- 修复 Google Antigravity Gemini 3.7 Flash 分层模型在最低思考档报 HTTP 400。
- 终端新增 OMP_TUI_DEBUG 无头驱动套接字，LaTeX 文本命令现渲染为终端粗体/斜体。
- 状态栏新增 Antigravity 每日用量，修复后台任务重复计数与内嵌上下文显示。
- omp usage 分别报告 Codex Chat 与 Spark 容量，omp token 无阻塞刷新本地 MCP OAuth 凭据。

</details>

<details>
<summary>v18.0.8（2026-08-27） · 2026-08-27</summary>

- omp usage 与状态栏新增 Z.AI GLM Coding Plan 用量跟踪（5 小时+每周额度窗口，显示 lite/pro/max 档位）。
- 修复 Amazon Bedrock 上 OpenAI 架构模型（gpt-5.x）开启推理时的 HTTP 400。
- 转录用量行新增提示到产出总耗时显示（display.showTurnTime，默认关闭）。
- 修复损坏会话头覆盖可恢复转录、启动竞态导致新会话工具与技能缺失。
- 修复 snapcompact 压缩帧超限导致会话恢复被拒（HTTP 400）。
- 协作 Web 端转录现支持渲染 LaTeX 公式（$…$ 与 $$…$$）。
- 修复 omp git 分块导航、暂存后侧栏跳回顶部及 ! 命令继承文件描述符等问题。
- 修复工作区符号搜索在所有语言服务器失败时仍报告成功。

</details>

<details>
<summary>v18.0.7（2026-08-27） · 2026-08-27</summary>

- 新增 omp usage clients 按客户端查看用量（支持 --days 与 --json），应用可用 OMP_APP_NAME 标识。
- 模型目录新增基于 models.dev 共享目录的后台刷新，新发布模型无需等新版即可出现。
- omp git 响应性大幅提升，新增刷新、暂存、Vim 移动、diff 视图选择等快捷键。
- 修复 Anthropic Claude 订阅 OAuth 被上游拒绝、Cursor 恢复/分叉会话失败等问题。
- 明确浏览器中继两种启用方式：单次调用 app.relay 与配置 browser.relay。
- 修复 /branch 受 doubleEscapeAction 影响、--model 循环回 default 角色丢失思考档位。
- 修复扩展在 .omp/config.yml 中配置后技能/钩子/工具无法被发现。
- 数学定界符语法统一到 math-delimiters，修复公式提前闭合、转义 $ 等问题。

</details>

<details>
<summary>v18.0.6（2026-08-26） · 2026-08-26</summary>

- git TUI 与 omp commit --legacy 新增快速、可缓存的 Conventional Commits 提交信息生成。
- git TUI 侧栏支持折叠/展开未暂存与已暂存分区，并区分新文件与已跟踪变更。
- 流式思考/推理长输出现可继续滚入终端滚动区，不再局限于视口。
- 新增 backgroundIdleMs 选项，自定义后台认证代理活动自动驻留前的时长。
- 改进 TypeScript/TSX 语法高亮，正确处理类型注解与模板字符串。
- 修复 omp update 在 Windows 上残留旧版二进制、退出提交生成时进程残留等问题。

</details>

<details>
<summary>v18.0.5（2026-08-25） · 2026-08-25</summary>

- OpenRouter 新增浏览器 OAuth PKCE 登录，同时保留粘贴 API 密钥方式。
- /login 新增 DeepInfra 与 Yolo-Auto API 密钥认证，并内置两提供方（含 deepseek-flash-v4）。
- read 工具新增 :img 选择器，可将本地 SVG/SVGZ 栅格化为图片供视觉模型读取。
- omp git 新增并排图片/SVG 预览（支持 Git LFS），并新增 q 退出与空白差异过滤。
- 新增 omp if-bench 命令，用于无工具指令遵循与工作记忆基准测试。
- DeepInfra 现支持 image_gen 与 tts 工具，语音输出支持 MP3/WAV。
- 修复退出计划模式不中断当前回合、/review 数字键选择失效等问题。
- 修复 LSP 客户端错误共用进程、长会话因提供方拒绝超限历史而无法恢复等问题。

</details>

<details>
<summary>v18.0.4（2026-08-24） · 2026-08-24</summary>

- 新增 omp git（/git）交互式全屏仓库界面：diff 查看、行级暂存、提交组合器（支持 amend）等。
- /extensions 改造为全屏扩展控制中心，支持鼠标、标签页与实时 MCP 连接管理。
- 流式 Markdown 代码块新增实时语法高亮；启动组合器可立即编辑。
- 修复 ! 命令在 zsh/fish 下的运行问题，现于真实 PTY 中执行。
- 改进 HTTP 413 错误分类，区分载荷/媒体限制与上下文窗口溢出。
- 修复 Kimi Code/Moonshot 图片请求 400、Claude 中断后回放思考块等问题。
- 修复 /todo 展开/折叠与 /shake thinking 报告、Orca 中韩文 IME 光标漂移。
- 修复 Cursor grok 模型默认思考档位与 xAI/SuperGrok 超 200K 上下文计费档缺失。

</details>

<details>
<summary>v18.0.3（2026-08-23） · 2026-08-23</summary>

- 新增可选编辑自动修复（edit.autoRepair.enabled）：编辑破坏 AST 解析时由小模型就地修复。
- 新增更新通道：omp update --canary 安装预发布版，--stable 切回稳定版。
- 意外停止新增 None、Mechanical（默认）、Smart 三种模式，Smart 用模型分类恢复纯文本停止。
- Ctrl+T 现可切换转录中所有思考块（含已滚入终端历史的）。
- 修复 eval 在并行扇出超时后被强杀内核丢失状态的问题。
- 修复 Windows 自更新失败导致 omp 命令缺失或停留旧版本。
- 退出时不再删除终端图形存储中的 Kitty 内联图片；放大终端不再擦除可见历史。
- 修复 Fireworks 模型 NaN 400、OpenAI 兼容流 [DONE] 无 finish_reason 等问题。

</details>

<details>
<summary>v18.0.1（2026-08-23） · 2026-08-23</summary>

- 新增 /pin 命令，将会话固定到 --resume 选择器顶部。
- Amazon Bedrock 新增 Converse 护栏（guardrail）配置，支持自定义模型。
- Bash 命令超过阈值后默认自动转入后台执行。
- 斜杠命令自动补全将技能折叠为 /skill: 条目；启动组合器可立即编辑。
- PI_PROXY 现覆盖 OAuth 刷新、用量探测与模型发现等所有网络请求。
- macOS 拼写检查现遵循全部活动系统词典（如俄语）。
- /models 不再为未配置的 Ollama、llama.cpp、LM Studio 显示失效标签页。
- 修复 Cursor 思考模型 not_found、思考循环检测失效、提示历史重复等问题。

</details>

<details>
<summary>v18.0.0（2026-08-22） · 2026-08-22</summary>

- 新增 omp render 命令，回放会话线程并基准测试转录管线性能。
- macOS 编辑器新增可配置拼写建议（Ctrl+.）、Tab 单词补全与可选自动纠正。
- omp bench 新增实时仪表盘：p50/p95、吞吐量、成本跟踪与 --prefill-bytes 选项。
- 新增 /shake thinking 命令，从会话历史中剥离模型推理块。
- 编辑工具增强：＋ 前缀行插入、统一 diff 格式、裸选区替换等。
- 新增 tui.resizeScrollback 设置（append/rebuild/preserve），控制宽度变化时滚动区刷新。
- 斜杠命令自动补全新增图标与使用频率排序；启动组合器基于缓存即时渲染。
- 修复 Kimi/Moonshot 图片 400、Windows 转录布局损坏、Claude 中断回放思考块等问题。

</details>

<details>
<summary>v17.4.2（2026-08-21） · 2026-08-21</summary>

- 新增可选图片 URL 代理（images.urls.enabled），对外发图片经后端链发布而非内联 base64。
- 组合器新增附件预览卡片（移植自 omp2）：粘贴图片/大文本显示缩略图与行数。
- 粘贴图片现仅插入 [Image #N, WxH] 标记，不再附带冗余 attachment:// URI。
- 修复 Cursor 思考档位选择无效与推理兄弟模型 resource_exhausted 报错。
- 修复 macOS Terminal.app 颜色不可读（改用 256 色模式）。
- 修复 /todo edit 解析转义括号失败、omp setup --check 退出码错误等问题。

</details>

<details>
<summary>v17.4.1（2026-08-21） · 2026-08-21</summary>

- 新增 PERSONALITY.md 支持，可用 ~/.omp/agent/PERSONALITY.md 覆盖系统提示中的个性文本。
- read/write 工具大幅扩展归档支持（rar/7z/iso/deb/rpm/asar 等），write 可创建 tar.zst。
- 新增 Codex Code Mode（providers.openai-codex.codeMode），将非核心工具降级到 eval 桥。
- 新增 speculative 压缩 compaction.asyncEnabled：后台预压缩上下文，避免阻塞性暂停。
- /handoff 与自动交接压缩现直接向当前会话提交摘要，不再另起新会话。
- 新增 extendedContext 设置（默认开），可将高级长上下文定价模型钳制到标准定价窗口。
- /settings 支持点击切换与拖拽排序，敏感选项（如 External Thinking）带风险提示。
- 令牌计数改为按各模型 tokenizer 动态计算，并支持自定义模型 tokenizer 覆盖。

</details>

<details>
<summary>v17.4.0（2026-08-20） · 2026-08-20</summary>

- 新增 /cleanse（omp cleanse）会话内检查/修复循环，带实时状态面板。
- 新增 omp ps 交互式监控守护托管的后台进程。
- 新增 composer.shape 组合器布局（圆角框、Claude Code 规则、无边框等）。
- 新增 statusLine.contextLine 上下文用量仪表（percentage/annotated/embedded）。
- eval 单元现支持异步后台运行（类似 bash），并支持阈值配置。
- 新增 extendedContext 设置与 /extended-context 命令，控制高级长上下文定价模型窗口。
- /handoff 与自动交接压缩就地压缩当前会话；压缩分隔线显示前后上下文大小。
- 破坏性变更：全局令牌计数函数改为模型作用域、不可变的 Tokenizer 实例。

</details>

<details>
<summary>v17.3.8（2026-08-19） · 2026-08-19</summary>

- 修复 /compact 在 /clear 后复活旧回合的问题，并加固压缩摘要以防御提示注入。
- 新增 providers.cacheRetention 设置，控制提示缓存保留策略（auto/short/long/none）。
- Cursor Grok 4.5/4.6 各思考档位折叠为单一模型，按档位路由到线上 wire id。
- 本地 Qwen 3.8+ 模型的思考档位现映射到 reasoning_effort，修复档位被忽略问题。
- 修复 models.db 损坏后永久禁用模型缓存的问题，损坏缓存可自愈重建。
- 修复 omp commit 拆分提交二进制文件报 corrupt binary patch、omp update 带 --cwd 崩溃。
- 修复多子代理会话高 CPU（合并动画定时器）、macOS 粘贴图片附带文件图标等问题。
- 修复 Cursor 托管 WebFetch 权限询问导致流停滞、Perplexity 邮箱 OTP 登录失败等问题。

</details>

<details>
<summary>v17.3.7（2026-08-18） · 2026-08-18</summary>

- xAI 渠道请求统一发送 omp User-Agent 标识
- xAI 与 SuperGrok 默认模型升级为 grok-4.6
- Codex 上 GPT-5.6 系列上下文窗口提升至 100 万 tokens
- 扩展 API 新增文件写入与删除的权限失败回退钩子
- omp stats 仪表盘支持 --host 绑定地址，便于容器访问

</details>

<details>
<summary>v17.3.5（2026-08-16） · 2026-08-16</summary>

- 新增 z.AI GLM-5.3 支持，1M 上下文与 low/high/max 档位
- 付费 xAI 改走 Responses API，默认模型升至 grok-4.5
- 瞬时 provider 故障（429/5xx）自动重试，/compact 与 /handoff 不再中断
- Umans、Kimi 多账号等用量上报与配额轮换得到修复
- ask 对话框多选改为空格切换选项、回车提交
- /debug 报告包限定当前会话，避免泄漏其他会话文件
- 修复浏览器守护进程、LSP 与扩展超时等一批稳定性问题

</details>

<details>
<summary>v17.3.4（2026-08-14） · 2026-08-14</summary>

- PDF 解析后端换为 pdf-inspector，并恢复 PDF 页面图像渲染
- 修复 Figma Dev Mode MCP 因过早打开 SSE 流而无法连接
- omp usage invalidate 可彻底刷新过期的 OAuth 与 API key 用量
- 修复国内阿里 Token Plan 凭据的配额显示与获取指引
- 修复 Copilot 环境变量 token 走错端点导致的 403 错误
- 修复 Windows 下 Ctrl+G 外部编辑器无法启动的问题
- 修复记忆 recall 在 channelId 过滤下丢弃全局条目

</details>

<details>
<summary>v17.3.3（2026-08-14） · 2026-08-14</summary>

- 修复 Gemini 只返回思考无正文时的重复请求与空流
- 自动续跑被截断的 Gemini 回合并重试畸形工具调用
- hashline 恢复悬空区间分隔符，不再整头拒绝补丁
- 修复 Gemini 报告结尾围栏导致表格渲染为原始代码块

</details>

<details>
<summary>v17.3.2（2026-08-13） · 2026-08-13</summary>

- 新增 deepseek-v4-pro:preview 与 gemini-3.7-flash 模型
- Antigravity 客户端版本改为动态发现，新模型无需改码即可出现
- 移除 Antigravity 身份提示词注入，用户系统提示原样发送
- 修复 Antigravity Claude 恢复会话时未签名思考块触发 400
- 修复子代理提交结果后父 TUI 卡住等待焦点或缩放才刷新
- 修复 read 头部路径折叠导致同名文件的 edit 被误拒

</details>

<details>
<summary>v17.3.1（2026-08-13） · 2026-08-13</summary>

- 支持 Gemini 3.7 Flash 动态发现与三档思考等级路由
- 修复 Windows 干净安装缺 VC++ 运行库导致 omp 无法启动
- Claude Code 配置发现遵循 CLAUDE_CONFIG_DIR 目录设置
- 修复状态栏 git 分支在切换分支后不更新
- --tools 白名单现可纳入扩展注册的插件工具
- 修复浏览器工具在 Windows 误探测并弹出用户自带 Chrome
- 目录元数据更新：上下文窗口、定价与模型配置

</details>

<details>
<summary>v17.3.0（2026-08-13） · 2026-08-13</summary>

- 重大变更：移除全局 advisor.subagents，改为按 agent 配置顾问
- 新增 Astral ty 作为内置 Python LSP 后备服务器
- /agents 重设计为全屏控制中心，含过滤、详情与属性芯片
- 新增第一方 Nix 支持，含 NixOS 与 Home Manager 模块
- /usage 与状态栏改用 OpenCode Go 官方配额真实用量
- 新增 OpenAI Daybreak 与 GPT-5.6 Cyber 模型及完整定价
- 集中修复 LSP 覆盖层、WSL2 启动挂起等稳定性问题

</details>

<details>
<summary>v17.2.15（2026-08-12） · 2026-08-12</summary>

- 新增 omp compress，可批量把文件改写为紧凑提示寄存器
- 新增 --external-thinking 标志强制启用外部思考工具
- omp cleanse 支持更多语言检查器与自然语言描述任务
- omp cleanse 无参数运行时提供交互式检查器选择器
- 修复 MCP Streamable HTTP 协议协商与连接中断问题
- /handoff 现会跨会话复制计划、草稿等本地产物

</details>

<details>
<summary>v17.2.14（2026-08-11） · 2026-08-11</summary>

- pi-ai 新增 forceReasoningOff 与 disableReasoning 选项
- 可在 OpenAI 与 Azure OpenAI 模型上关闭原生推理
- 新增 externalThinking 设置，经由 think 工具做外部思考

</details>

<details>
<summary>v17.2.13（2026-08-11） · 2026-08-11</summary>

- 新增 searxng.safesearch 设置与 Exa MCP 搜索提供方
- 支持 Cloudflare AI Gateway 路由 Gemini 搜索
- omp update 按发布清单的 omp.dist 字段接管分发方式
- 面板命令如 /usage 改为即时渲染，不再等回合结束
- 修复 AWS role_arn 角色链解析，支持 EKS/IRSA 多账号
- 修复 /vibe 会话切换后 bash、edit 等工具集丢失
- 状态栏 usage 新增 Cursor 月度配额百分比显示

</details>

<details>
<summary>v17.2.12（2026-08-09） · 2026-08-09</summary>

- 修复 Codex 账号级策略拒绝时未轮换兄弟账号凭据
- 修复 alibaba-token-plan 的 qwen3.8-max 缺思考与图像元数据
- shell 输出精简不再改写 1000 字符以内的短内容
- /handoff 区分空生成与中止，暴露真实错误原因
- hashline 破坏性变更：粘贴未捕获命名寄存器改为抛错
- 修复 Z.AI 网页搜索丢来源并显示原始 JSON 的问题
- 修复长会话中驻留子代理会话导致的内存泄漏

</details>

<details>
<summary>v17.2.11（2026-08-07） · 2026-08-07</summary>

- 支持 Agent Plugins 1.0.0 标准的插件发现与安全执行
- 新增 omp share 命令，按 ID 前缀或路径直接分享会话
- 子进程注入 AGENT=1 环境变量供下游工具识别代理执行
- Exa 搜索配置统一为 exa.enabled 并自动迁移旧配置
- 新增 Cursor 个人月度美元配额与余额的上报显示
- 修复 ANTHROPIC_BASE_URL 未生效及自定义请求头转发
- 修复嵌入模型下载中断损坏缓存导致语义召回失效
- 修复 Windows 主机构建与 AVX2 检测，启动提速约 270ms

</details>

<details>
<summary>v17.2.10（2026-08-06） · 2026-08-06</summary>

- 重大变更：移除 zod 依赖，工具 schema 改用 omptype
- 新增 --trusted-extension 白名单加载扩展，绕过自动发现
- Ctrl+S Agent Hub 重做为全屏名册与选中代理详情面板
- 崩溃输出附带可直接复制的 omp --resume 恢复命令
- 配置与参数校验改用 omptype，显著缩短启动时间
- 修复 Windows 与 WSL 终端上 Shift+字母等按键被吞
- 修复 PowerShell 作为自定义 shellPath 的参数传递
- 修复子代理经模型角色别名时套用了错误的重试回退链

</details>

<details>
<summary>v17.2.9（2026-08-05） · 2026-08-05</summary>

- 恢复旧版项目会话目录命名并移除自动迁移逻辑
- 修复 Copilot model_not_available 400 被当作致命错误
- 浏览器工具可自动探测 Linux 上的 Ungoogled Chromium
- MCP 导入器遵循 enabled: false，禁用服务不再被挂载
- 修复 grep/glob 分号路径列表过长时整体报路径不存在
- print 模式确保末尾大记录完整写出，退出不再截断
- stats 仪表盘限定 IPv4 回环并移除通配 CORS
- 修复 WSL 会话读取不到 Windows 侧 Agent Skills 的问题

</details>

<details>
<summary>v17.2.8（2026-08-04） · 2026-08-04</summary>

- 升级内置 omptype 引擎，支持 JSON Schema 导入与互操作
- toJsonSchema 支持输入输出形态与 Standard Schema V1 (主要为内部变更)

</details>

<details>
<summary>v17.2.7（2026-08-03） · 2026-08-03</summary>

- 引入 omptype schema 库替换 arktype，校验提速近百倍
- 新增 TypeBox 与 Zod 风格编写适配器，产出原生 omptype
- 修复 ChatGPT OAuth 请求误带 service_tier: auto 报错
- 修复 thinking-level off 对 DeepSeek V4 直连不生效
- 安装脚本增加启动冒烟测试，musl 系统不再误报成功
- codex config.toml 发现遵循 enabled=false 的 MCP 服务
- 内置 ps 命令补齐 procps/BSD 常用输出格式

</details>

<details>
<summary>v17.2.6（2026-08-03） · 2026-08-03</summary>

- 新增 /reset 命令原地清空对话，保留会话元数据与历史
- 新增 bedrock-mantle 提供方，托管 GPT-5.4/5.5/5.6 模型
- 新增跨平台进程级文件锁工具，崩溃后自动释放
- 修复 Windows 取消超时命令时误杀 omp 主进程
- 修复 macOS PCRE2 grep 崩溃，可用 OMP_PCRE2_JIT 控制
- 扩展斜杠命令处理后不再重复显示为用户提示
- 新增 MNEMOPI_DB_PAGE_SIZE 配置数据库页大小

</details>

<details>
<summary>v17.2.5（2026-08-03） · 2026-08-03</summary>

- 新增 Chrome MV3 中继扩展，可接管并驱动现有浏览器标签
- 新增 relay 浏览器模式，自动启动守护并按 omp 分组标签
- 新增统一桌面会话 API，含窗口截图、输入与无障碍树
- 新增 /tree 转向导航快捷键与隐藏工具活动开关 Ctrl+Shift+O
- 新增 lsp.shared 共享语言服务器，降低多实例冷启动开销
- 新增 --service-tier 与 providers.webSearchTimeoutSeconds 配置
- 重大变更：edit 工具替换模式改为单次编辑 schema
- 修复会话记录持久性，进程崩溃不再丢失已完成会话

</details>

<details>
<summary>v17.2.4（2026-08-01） · 2026-08-01</summary>

- 新增 MCP requestIdFormat 配置，默认改为整数请求 id
- 模型选择器允许选小上下文模型，先用当前模型压缩再切换
- 新增 pgrep、pkill、pidwait、top 等内置进程命令
- 新增 Shift+Up 作为消息出队的第二默认快捷键
- 密钥占位符与市场注册表迁至 XDG 目录，首次自动搬移
- 修复 Codex 压缩优先使用 WebSocket 而非回退 SSE
- 修复流式工具调用 id 变化导致卡片重复渲染
- 无 write 权限的会话不再把发现工具藏进 xd:// 传输

</details>

<details>
<summary>v17.2.3（2026-08-01） · 2026-08-01</summary>

- 新增 ai&（aiand）提供商，支持 API 密钥粘贴登录与动态模型发现
- 修复 Anthropic OAuth 订阅账号请求 1M 模型被 429 拒绝，现不再申请 1M beta，订阅账号透明使用标准 200k 上下文
- 无头浏览器改用按项目共享的 Chromium 实例，避免启动风暴与孤儿进程
- 修复 Ask 对话框缺少 question 字段导致整个会话崩溃的问题
- 修复 Codex 网页搜索错误被折叠为 Unknown error，现保留后端原始错误码与消息
- 修复 Bash 自动后台命令结束后残留计时器、延迟 SDK 关闭的问题
- mnemopi 记忆合并现剥离远程模型的思考块，避免推理文本污染记忆

</details>

<details>
<summary>v17.2.2（2026-07-31） · 2026-07-31</summary>

- 新增 GMI Cloud（gmi-cloud）提供商，支持 GMI_API_KEY 认证与动态模型发现
- 新增 Ctrl+L 快捷键开关实时语音模式，显示重置快捷键移至 Alt+L
- 扩展 API 新增 ctx.invokeTool()，可运行内置工具并继承上下文与中止信号
- hashline 破坏性变更：SWAP/INS/PASTE 替换为统一 PUT/CUT 语法，新增 @reg 命名寄存器
- Cursor 模型发现现正确暴露 1M 上下文窗口，并修复 Grok 4.5、Synthetic 等发现问题
- 修复 /reload-plugins 不重连 MCP 服务器、不刷新工具注册表的问题
- 修复多用户机器上 bash 工具因 snapshot 目录权限报 EACCES
- 上下文压缩总结输出上限 16384 tokens，避免大上下文时压缩内容膨胀

</details>

<details>
<summary>v17.2.1（2026-07-30） · 2026-07-30</summary>

- 新增可选的原生软件安全扫描工作流（security.enabled，默认关闭），含 security:// 命名空间与 SARIF 导入
- 新增 --from-claude 与 --from-codex 会话导入（Codex 含压缩状态），也可用 /resume @claude、@codex
- Anthropic OAuth 请求对齐 Cowork 的 claude-desktop 画像，支持按凭据 ID 精确刷新
- computer 工具在 rootless XWayland 下快速报错退出，不再每次截图抛 BadMatch 崩溃
- 修复远程 llama.cpp/Ollama 端点发现超时无模型、以及缓存复用旧端点的问题
- 修复 omp install 对导入 createEditTool/createWriteTool 的 pi 扩展校验失败
- 新增 postmortem.quit 配置，终端已断开时安全处理关闭流程

</details>

<details>
<summary>v17.2.0（2026-07-30） · 2026-07-30</summary>

- Cursor 现代 exec 协议端到端支持：七种 Pi 工具帧映射到本地 read/bash/edit 等，lsp 重回 MCP 目录
- hashline 破坏性变更：移除 DEL/COPY 操作，新增 CUT/PASTE 剪贴板寄存器，支持跨文件移动代码
- 新增 /login exa 与 /login xai 交互式 API 密钥登录
- 新增 --from-claude/--from-codex 会话导入，亦可通过 /resume @claude、@codex 使用
- /mcp 子命令新增 MCP 服务器名自动补全
- 新增 browser.cdpUrl 设置与 RPC 实时 fast-mode 控制（set_fast_mode）
- 启动更新日志默认改为紧凑摘要，可用 startup.changelogMode 调整
- 修复多 OAuth 账号恢复会话时 Anthropic 提示缓存冷启动，现按会话固定所用账号

</details>

<details>
<summary>v17.1.8（2026-07-28） · 2026-07-28</summary>

- 新增 omp cleanse 命令：解析 Cargo Clippy 等诊断，并发子代理修复并带进度条验证
- /guided-goal 由弹窗流程改为会话内自然对话式引导
- 破坏性变更：tab.screenshot() 不再接受自定义保存路径，统一存到 browser.screenshotDir
- 修复 Linux 下 omp 进程名显示为 bun 的问题
- agent shell 命令不再继承启动目录 .env 环境变量
- 修复 Google Vertex AI 多区域端点 404 与 macOS 麦克风捕获失效
- 修复 omp update 下载超时无提示，现显示友好错误信息

</details>

<details>
<summary>v17.1.7（2026-07-28） · 2026-07-28</summary>

- 新增 moonshotai Kimi-K3 与 kimi-k3-fast 模型支持
- 上游 403 拒绝（权限/模型策略）现自动轮换其他账号，不再首个账号被拒即失败
- 新增 /vision 命令控制图像理解工具，inspect_image.enabled 改为三态 inspect_image.mode
- read 工具新增 macOS sample 调用树与 V8 .cpuprofile 的瓶颈摘要解析
- 扩展的 tool_call 钩子现可返回 input 改写工具实际执行参数
- 修复恢复含图片附件的提示时图片丢失，现重新挂载到编辑草稿

</details>

<details>
<summary>v17.1.6（2026-07-27） · 2026-07-27</summary>

- 新增 SiliconFlow 与 SiliconFlow 中国区提供商，支持 omp login siliconflow 与动态模型发现
- 状态栏分别显示主会话与 Advisor 的花费
- task 工具 effort 参数改为可选启用（task.enableEffort），并新增 task.maxEffort 上限
- MCP 原生资源 URI（如 ags://）现可直接用 read/omp read 读取
- 修复 learned.md 写入不断追加空行、标题错位的问题，保存字节幂等
- 修复 bash kill 内建：默认 SIGTERM，支持数字信号与负 PID（进程组）
- 终端断开时 omp 不再因 setRawMode 崩溃，改为正常退出

</details>

<details>
<summary>v17.1.5（2026-07-27） · 2026-07-27</summary>

- inspect_image 新增超时设置（inspect_image.timeoutMs，默认 5 分钟）
- DeepSeek V4 Flash、Step 3.7 Flash、MiMo 改用 replace 编辑模式，不再误用 hashline
- omp --resume 直接切换到会话记录目录，不再提示 fork 新会话
- 无效 config.yml 不再被清空覆盖，原文件备份为 .broken-* 并保留
- /live 实时语音会话新增可选语音设置
- 修复 Windows 无 bash.exe（如 scoop 版 Git）时 omp 无法启动，现回退 cmd.exe
- 修复 Kimi Code 模型输出上限被固定为 32000，现按模型家族正确推导

</details>

<details>
<summary>v17.1.4（2026-07-26） · 2026-07-26</summary>

- 新增 Claude Opus 5 的 Amazon Bedrock 模型条目（含 us/eu/au/global 区域）
- omp usage 现显示 Anthropic OAuth 约 30 天授权到期提醒与自动禁用凭据的墓碑行
- alibaba-token-plan 登录支持中国（北京）区域，修复 401 拒绝
- bash.patterns 的 deny/prompt 规则现按命令段匹配复合命令（如 &&、分号、换行），不再被绕过
- omp config list 不再明文泄露凭据，显示点掩码，JSON 标记 redacted
- omp update 现校验 GitHub release 资产的 SHA-256 摘要与大小后再安装
- Cursor 模型下的 todo 列表与服务器保持同步，重启/回退后仍然保留
- 修复 Windows 无 bash.exe（scoop Git）时 omp 无法启动，回退 cmd.exe

</details>

<details>
<summary>v17.1.3（2026-07-26） · 2026-07-26</summary>

- 修复 Cursor 会话中 xd:// 分阶段预览（如 ast_edit）无法决断导致会话中止，现恢复 write 传输转发
- 修复本地 OpenAI 兼容后端（llama.cpp 等）大提示预填充被首事件看门狗提前取消
- 修复 find -exec/-execdir 子进程输出直接冲到终端污染 TUI，现走工具捕获输出
- ast_edit 不再要求 lang 参数：混合语言路径逐文件推断语言改写（如 .rs+.toml）
- 修复隔离会话中 Edit/Write 工具报 Settings not initialized 的问题

</details>

<details>
<summary>v17.1.2（2026-07-24） · 2026-07-24</summary>

- bash 内建 shell 新增 moreutils 风格命令：ts、sponge、ifne、isutf8、combine、errno
- web_search 现支持 Google 风格查询指令（site:、日期范围、lang:、filetype: 等），各提供商自动映射
- 新增 searxng.engines 设置自定义 SearXNG 搜索引擎列表
- task 工具新增每任务 effort 参数（lo/med/hi），并移除旧的 model 参数（破坏性变更）
- omp-stats 新增 Providers 仪表盘：按提供商统计 token/花费与订阅窗口分析
- 大型粘贴现保存为带 .md 后缀的 local://paste-N.md 引用
- todo 工具省略 op 字段时自动推断操作（list→init 等），不再硬性校验失败
- 修复离开全屏覆盖层或调整大小时终端闪烁的问题

</details>

<details>
<summary>v17.1.1（2026-07-24） · 2026-07-24</summary>

- 新增 computer 工具（默认关闭）与 /computer 命令：原生桌面后端（macOS/Win/Linux X11），含 OpenAI Codex 原生 computer-use
- 新增 /session pin 命令固定当前会话的 OAuth 账号
- /live 语音/媒体改为跨平台原生麦克风、扬声器、WebRTC 栈（pi-natives），不再依赖 Chromium 子进程
- 新增 alibaba-token-plan（QwenCloud Token Plan）提供商与交互式登录，支持配额报告
- 新增 Meta Model API 提供商与 Muse Spark 1.1
- omp usage 与 /usage 新增 Anthropic 额外用量（Claude Extra Usage）显示
- macOS computer 截图从约 30 秒降至半秒内
- 排队中的指令不再硬中止 bash 等不可中断工具，改为协作式中断信号

</details>

<details>
<summary>v17.1.0（2026-07-24） · 2026-07-24</summary>

- 新增多工作区目录管理：`/add-dir`、`/remove-dir`、`/dirs` 与 `--add-dir` 启动参数
- 新增 `/live` 实时语音接口，经 WebRTC 输入语音下达编码任务
- 新增 `/usage` 命令与用量感知的模型自动回退，应对配额受限的编码套餐
- 破坏性变更：`providers.webSearch`、`providers.image` 改为 `webSearchOrder`、`imageOrder` 优先级列表
- 新增 `error.notify` 失败通知、`read.renderMarkdown` 阅读预览与 `bash.patterns` 命令审批规则
- 任务新增 block/unblock 操作与 `blocked` 状态；statusline 的 git 段支持 Jujutsu（`jj`）
- 新增 QwenCloud Token Plan、Meta Model API 登录及 Vercel/OpenAI 提示缓存控制
- 修复切换提供商丢失压缩历史、空会话排队 steer 导致 OOM 等一批稳定性问题

</details>

<details>
<summary>v17.0.9（2026-07-23） · 2026-07-23</summary>

- `/usage` 新增 Synthetic（synthetic.new）用量报告，含 5 小时滚动限额与每周信用额度
- `task` 工具支持按次指定模型，含批量选择、回退链与推理档位后缀
- Firecrawl 免 key 模式：显式选 `firecrawl` 时无需 `FIRECRAWL_API_KEY`
- 新增 `mcp.renderMarkdownResults` 设置，默认把非 JSON 的 MCP 文本渲染为 Markdown
- 新增 `task.isolation.apply` 设置，控制隔离任务结果是否自动应用回父仓库
- 新增 RPC 协议 v2：支持大对象无损分块与基于游标的历史分页
- 目录调整：GPT-5.3 Codex Spark 更名、上下文缩至 128K、多款模型重新定价
- 修复 GitHub Copilot 在 priority 服务层被拒、SuperGrok 用量追踪缺失

</details>

<details>
<summary>v17.0.8（2026-07-23） · 2026-07-23</summary>

- 目录新增 MiniMax M3、Gemini 3.5 Flash Lite/3.6 Flash、Qwen 3.6 35B 等多款模型
- 移除 devin 与 openai-codex 目录中多个过时模型系列
- 新增 `/tree` 对历史 `ask` 结果的重新作答，可分支出并列答案
- 新增 Hindsight 超时配置：`hindsight.requestTimeoutMs` 等设置与 `HINDSIGHT_*` 环境变量
- 新增 `omp-linux-musl-x64/arm64` 二进制，支持 Alpine 等 musl 发行版
- 修复内置 `rm -rf ""` 把空参数当当前目录而误删的严重安全问题
- 修复模型选择器、冷启动 `--model` 解析与回退链的多处缺陷
- 修复 `Ctrl+V` 粘贴在模态输入框被忽略、tmux/表格渲染等多项交互问题

</details>

<details>
<summary>v17.0.7（2026-07-21） · 2026-07-21</summary>

- 修复 Portkey/网关中以 `@` 开头的自定义模型 ID 被错误改写而触发 400

</details>

<details>
<summary>v17.0.6（2026-07-20） · 2026-07-20</summary>

- `generate_image` 支持 ChatGPT/Codex 订阅，无需 `OPENAI_API_KEY` 也能出图
- `generate_image` 新增 `provider` 参数，可按单次请求指定图像提供商
- 新增 OpenTelemetry 日志与指标 OTLP 导出，遵循标准 `OTEL_*` 环境变量
- 同一邮箱的个人与团队 OpenAI Codex 工作区凭据可共存并独立轮换
- `/tree`、`/branch` 支持 Shift+Enter，一步完成分叉并生成分支摘要
- `retry.fallbackChains` 通配符支持带 provider 前缀的目标与键
- 新增 Warp 原生 CLI 事件，以及每轮用量行的本地时间戳显示
- 修复隔离 `task` 子代理污染父仓库 git 分支与并行任务分支堆叠问题

</details>

<details>
<summary>v17.0.5（2026-07-18） · 2026-07-18</summary>

- `generate_image` 支持 Codex 订阅与按次 `provider` 覆盖，另加 OTel 日志/指标导出
- 新增 `PI_CONFIG_FILES` 环境变量，可在 `--config` 叠加层之前加载配置
- `retry.fallbackChains` 通配符支持 id 前缀目标；`/tree` 支持 Shift+Enter 快捷分叉
- Anthropic API key 请求默认改用 1 小时提示缓存，可用 `PI_CACHE_RETENTION` 覆盖
- 修复 models.db 明文缓存敏感请求头的安全隐患
- 修复 Windows 控制台窗口、盘符根目录启动崩溃与 `.cmd` MCP 启动失败
- 修复浏览器选择器支持快照引用，分类器拒答不再静默结束回合
- 扩展上下文新增托管定时器 API，避免回调异常拖垮整个会话

</details>

<details>
<summary>v17.0.4（2026-07-18） · 2026-07-18</summary>

- 修复 Kimi Code 用量报告缺失 5 小时窗口重置时间的显示
- Kimi 系模型在所有主机（含 OpenRouter 等代理）统一使用 MFJS 工具 schema
- 修复 Linux 内置 ffmpeg 录音在无 PulseAudio 时改用 ALSA 输入
- 修复 `/quit`、`/exit` 因记忆整合未完成而长时间挂起
- 本地嵌入模型缓存损坏时自动隔离并重新下载，恢复向量检索能力

</details>

<details>
<summary>v17.0.3（2026-07-17） · 2026-07-17</summary>

- `omp usage`、`/usage` 按组织区分 Anthropic 同邮箱的多个订阅
- `/logout` 与 `omp token --list` 显示组织名，便于选择要操作的凭据
- `/tan` 分支隔离强化：清空继承的 todo 并在压缩后重申分叉边界提示
- transcript 为缺少结果的工具调用增加可视化省略标记
- 移除 Bing、Yahoo 等不可靠的 HTML 抓取式网页搜索提供商
- 修复 Cursor 在剥离 ALPN 的代理下报 `h2 is not supported` 且无提示
- `read`/`write` 支持 ZIP 系归档（`.jar`/`.apk` 等）内的路径读取
- 修复多行粘贴被逐行提交、终端断开后 TUI 空转等终端问题

</details>

<details>
<summary>v17.0.2（2026-07-17） · 2026-07-17</summary>

- `generate_image` 支持 ChatGPT/Codex 订阅并可按次指定图像 `provider`
- 新增按项目存储模型角色的模式，模型选择器支持全局回退
- advisor 支持单独启停开关，`/advisor status` 展示各 advisor 状态与配额
- HTTP 402 与余额耗尽被判为持续性用量限制，自动轮换到兄弟凭据
- `/clear` 改为 `/new` 别名，并新增 `q` 别名修复 `/q` 误触 `/queue`
- 修复 Cursor 会话遗漏 MCP 工具、流过早报成功等问题
- 修复 MCP 工具因名称前缀重叠被反复挂载与卸载
- 修复 Windows 下 `.cmd`/`.bat` MCP 启动与盘符根目录启动崩溃

</details>

<details>
<summary>v17.0.1（2026-07-16） · 2026-07-16</summary>

- 目录新增 GPT-5.6 Luna/Sol/Terra（Bedrock、Azure、Cloudflare）等多组模型条目
- 多款模型补充图像输入与推理能力，并统一模型命名与更新定价、上下文上限
- 修复 OpenRouter 成本改用账号实际扣费而非目录估算
- 修复 OpenAI 推理模型转发不支持的采样参数（如 `temperature`）导致的 400
- 修复 Anthropic 月度消费上限与 OpenRouter 免费额度耗尽时无法及时轮换凭据
- 修复 `omp grep` 对带前导冒号路径、Windows 下 `tail` 破坏管道致进程退出
- 修复 `retry.fallbackChains` 在不可重试的硬错误上不再生效的问题
- 自动压缩在上下文紧张时自动丢图与省略内容，并显示需人工介入的警告标记

</details>

<details>
<summary>v17.0.0（2026-07-15） · 2026-07-15</summary>

- 破坏性变更：`irc`、`job`、`launch` 三个工具合并为统一的 `hub` 工具
- 破坏性变更：移除 BM25 工具发现系统及相关 `tools.discoveryMode` 等配置
- 破坏性变更：移除隐藏的 `resolve` 工具，改用 `xd://resolve/reject/propose` 虚拟设备
- 破坏性变更：移除 `ssh` agent 工具，保留 `ssh://` 协议与 `omp ssh` 主机管理 CLI
- 引入 `xd://` 虚拟设备协议，工具可经 `read`/`write` 以 URL 方式发现与执行（`tools.xdev` 默认开启）
- 新增 `edit.enforceSeenLines` 设置（默认关闭），拒绝编辑从未完整显示过的行
- 新增子代理 prewalk 支持，含 `prewalk` frontmatter 与 `task.prewalk` 设置
- 配置键更名：`dev.autoqa.consent`→`dev.autoqaConsent`、`todo.reminders.max`→`todo.remindersMax`

</details>

<details>
<summary>v16.5.2（2026-07-14） · 2026-07-14</summary>

- 破坏性变更：移除 read 与 grep 的 selector 参数，行范围需拼进 path
- 新增 generate_image.enabled 设置，可开关图像生成工具
- 限流响应头采集扩展到所有支持的提供商，多账号会话提前轮换凭据
- 多账号凭据排序优化，优先使用即将过期的配额、降级重度已用账号
- 修复 omp config list --json 管道输出被截断到 64 KiB 的问题
- 修复 Kitty 键盘协议下 vim 式 h/j/k/l 导航失效
- 修复 /guided-goal 在 websocket-only Codex 模型上报 Model not found
- 修复会话中切换到纯文本模型后仍把历史图片发给新提供商

</details>

<details>
<summary>v16.5.1（2026-07-14） · 2026-07-14</summary>

- 新增 omp usage 报告 Cursor OAuth 与访问令牌用量
- Anthropic 多组织账号按组织隔离凭据、用量与登录会话
- 自动压缩在上下文吃紧时自动丢弃图片并给出持续警告标记
- 修复 --max-time 时长写法（如 5s、10m、1h）被忽略不生效
- 修复 /tan、/fork 克隆未继承与持久化父会话提示词缓存键
- 修复子代理未按 modelRoles.task 选择模型而回落到父会话模型
- 修复 npm 管理的 Windows 安装上 omp update 覆盖 npm 启动器
- 修复 GLM 工具调用缺失参数闭合时后续参数被吞并

</details>

<details>
<summary>v16.5.0（2026-07-14） · 2026-07-14</summary>

- 破坏性变更：--reasoning-slide-* 系列被统一的 --prewalk 机制取代
- 新增 --prewalk 流程，先用强模型规划再移交更快更便宜的模型实现
- 新增项目级 launch 工具（由 launch.enabled 开关）管理常驻服务与调试器
- launch 支持 detached 模式，服务可在 broker 关闭后存活并重连
- 新增紧凑模型选择器（Alt+P），支持 @ 搜索快速角色并立即切换
- 新增 tui.scrollbackRebuild 设置控制原生回滚重建，默认关闭
- 移除不可靠的 Bing、Yahoo 网页抓取搜索提供商
- /tan 分叉不再继承父会话历史，todo 清空并提示并发编辑

</details>

<details>
<summary>v16.4.8（2026-07-12） · 2026-07-12</summary>

- 模型浏览器支持 Home/End 导航，PageUp/PageDown 改为钳制不越界
- 计划审阅浮层新增 c 快捷键，把当前计划 Markdown 复制到剪贴板
- 重构 /models 选中、悬停与侧边栏作用域的高亮视觉呈现
- 修复 JS eval 单元在含顶层 await 时丢失 function/var 全局声明
- 修复 omp-stats 因缺失 stopReason 的消息触发约束错误而中断同步

</details>

<details>
<summary>v16.4.6（2026-07-12） · 2026-07-12</summary>

- usage 命令新增 invalidate 动作，用于清除缓存的用量报告
- retry.fallbackChains 支持模型级键与 provider/* 通配符写法
- /models Roles 视图可直接增删替换与排序回退链条目
- 新增 /queue 命令与 ->、=> 简写，排队等待代理让出后的跟进消息
- /models 浏览器展示每模型实测 TPS 与 TTFT 速度
- 修复 /models 鼠标滚轮误移动选中项并从末尾回绕到顶部
- 修复推理 token 隐藏时 TPS 被数倍夸大，改为按整个请求时长计算

</details>

<details>
<summary>v16.4.5（2026-07-11） · 2026-07-11</summary>

- 破坏性变更：task 工具 wire schema 调整，role 与 description 字段被移除
- 新增全屏支持鼠标的 Model Hub（经 /model 进入），含作用域侧边栏
- 新增 /pause 命令冻结全部代理，可手工改仓库后再恢复运行
- 新增富交互式固定高度 ask 对话框，支持选项预览、备注与多选
- OAuth 登录改为可 Esc 取消的对话框，不再卡在无法跳出的配对提示
- 子代理软请求预算默认提到 200，改为引导收尾而非静默终止
- 内置 base64、sed、xargs、jq 及校验和家族等进程内 shell 内建命令

</details>

<details>
<summary>v16.4.4（2026-07-11） · 2026-07-11</summary>

- 针对小参数量模型（如 LFM2）优化标题生成与自动思考分类提示词
- 修复 Windows 二进制静默退出不运行 CLI、连带 omp update 回滚
- omp-windows-x64.exe 改用基线 x64 运行时，兼容无 AVX2 的老款 CPU
- 修复 GenerateImage 不接受无 chatgpt-account-id 的 Codex 代理密钥
- macOS 改为静态链接 PCRE2，去除 Homebrew 动态库运行时依赖

</details>

<details>
<summary>v16.4.3（2026-07-11） · 2026-07-11</summary>

- 新增 /vibe 模式，模型作为导演调度后台工作代理并提供电视墙视图
- 新增多个免凭据网页搜索提供商，并行聚合去重为 Public Web 结果
- grep 支持 PCRE2 回退，可处理环视与反向引用等 Rust 正则不支持的模式
- 浏览器动作超时由 15 秒缩短到 8 秒，加快代理迭代速度
- 修复 omp search、omp q 命令因连接未关闭导致的挂起
- 修复 read 对 raw 行范围选择器添加多余的上下文填充
- 修复 GPT-5.6 过度委派任务，集中任务分发与并发策略到系统提示词

</details>

<details>
<summary>v16.4.2（2026-07-10） · 2026-07-10</summary>

- 修复工具参数中的 BigInt 在会话压缩时序列化失败导致数据丢失
- xAI 兼容性修复，历史回放时自动降级 OpenAI 专有工具调用设置
- 修复并发 MCP OAuth 令牌刷新竞争，避免有效凭据被清空
- Codex 请求补发版本头，支持新近受限的模型
- 修复 omp-stats 同步缺少成本明细的历史条目时崩溃
- 修复 GPT-5.6 过度委派任务的问题

</details>

<details>
<summary>v16.4.1（2026-07-10） · 2026-07-10</summary>

- 目录新增 GPT-5.6 Luna、Sol、Terra 与 perplexity-academic-researcher 模型
- 多个 GPT-5.6 模型更新上下文窗口、最大输出与缓存写入价格
- 移除 openai-codex 订阅渠道的 GPT-5.6 pro 推理别名
- TUI 新增二维 LaTeX 数学渲染，支持分数、矩阵、根式与极限
- 支持 \left、\right 可伸缩定界符与 cases、matrix 等环境
- 修复 MCP OAuth 动态注册遗漏 scopes 导致后续授权被拒

</details>

<details>
<summary>v16.4.0（2026-07-10） · 2026-07-10</summary>

- 新增 max 思考层级，支持模型最高 32768 token 推理预算
- 破坏性变更：内置 explore 代理更名为 scout，配置键同步改名
- 新增 thinkingBudgets.max 设置与 --thinking、:max 模型后缀用法
- 推理努力档位改为与上游 API 一一对应，选错档位自动降档
- 目录新增 Grok 4.5、Dolphin Mistral 24b、GLM5.2-Fast 等模型
- 新增 Novita 提供商与 API key 登录、环境变量自动发现
- 修复全上下文分叉冷启动丢失 OpenAI 提示词缓存并新增 --prompt-cache-key
- 修复 --tools 过滤在交互会话中误禁用配置的延迟 MCP 工具

</details>

<details>
<summary>v16.3.15（2026-07-09） · 2026-07-09</summary>

- OpenAI 系聊天补全支持自动与显式提示词缓存关联头
- 新增 GPT-5.6 pro 推理模式，按 reasoningMode: pro 发送请求
- xAI OAuth 改用设备码流程，/login 显示验证码并轮询授权结果
- GPT-5.6 多账号路由按套餐分级，Sol 与 Luna 优先 Plus 及以上账号
- 目录新增 Grok 4.5、gpt-5.6 基础模型与 meta/muse-spark-1.1 模型
- 测试指引并入主系统提示词，移除内置 Tester 子代理

</details>

<details>
<summary>v16.3.14（2026-07-09） · 2026-07-09</summary>

- 目录新增 GPT-5.6（Luna、Sol、Terra）变体与 minimal 到 xhigh 五档努力
- GPT-5.6 支持 max 推理档，wire 端用户档位整体上移一档发送
- 修复 Codex 请求变换绕过目录努力映射，导致档位发送错误
- 修复 gpt-5.6 推理摘要在思考块里显示空 HTML 注释噪音

</details>

<details>
<summary>v16.3.13（2026-07-09） · 2026-07-09</summary>

- xAI Grok OAuth 默认改为手动粘贴授权码登录并重命名登录项
- 目录新增 Grok 4.5、GPT-5.6、Aion 3.0、KAT-Coder v2.5 等模型
- 修复 Anthropic 流在工具调用卡住时无限挂起，看门狗限时恢复
- 修复 read 与 grep 把模型给出的空 selector 当成非法选择器
- 修复命名配置档案丢失用户 keybindings 中的默认键位
- 修复首次运行忽略预置的 config.yaml 配置文件
- 修复原生 bash 输出桥无界增长，WSL 等内存受限环境不再被杀

</details>

<details>
<summary>v16.3.12（2026-07-08） · 2026-07-08</summary>

- 提示词中输入 #数字 可自动补全为 PR 与 Issue 内部 URL
- /settings 暴露 retry.fallbackChains，/model 可指定默认回退模型
- 新增按工具的中止元数据，可区分被中断工具与未受影响的兄弟调用
- 修复项目 .omp/RULES.md 粘性规则被同名用户规则遮蔽
- 修复 bash 中未解析的 memory://、skill:// 字面量导致命令中止
- 修复 Claude 插件清单用数组声明时命令与技能静默丢失
- 修复 bash 工具 timeout: 0 被当成最短超时而非禁用命令截止

</details>

<details>
<summary>v16.3.11（2026-07-06） · 2026-07-06</summary>

- 目录新增 Claude Haiku 4.5 (JP) 与 tencent/hy3 模型
- 会话标题生成改为标记解析，修复标题显示原始 JSON 的问题
- 修复 llama.cpp 模型发现未读取图像输入模态而被当成纯文本
- 修复 Linux 启动提示词读取 CPU 型号在多核主机上开销过大
- 修复纯指令的 Codex 首轮请求被拒，现把指令镜像为用户输入

</details>

<details>
<summary>v16.3.10（2026-07-06） · 2026-07-06</summary>

- 子代理 HUD 最多显示 8 项，更多运行中代理以摘要行呈现
- 修复浏览器 run 清理抛出未处理拒绝导致整个 omp 会话崩溃
- Claude Sonnet 5 在拒绝 strict tools 的网关上自动降级并记住
- Ollama 空结束补全改为先补一个输出 token 再重试，避免静默停住
- RPC get_session_stats 返回上下文窗口用量，客户端可渲染进度条

</details>

<details>
<summary>v16.3.9（2026-07-06） · 2026-07-06</summary>

- say 命令新增 --file 从文件读取文本，并支持流式合成长内容
- say 完成后展示片段数与总时长，并校验所选音色有效性
- omp-stats 行为指标调整，减少脏话、喊叫与沮丧判定的误报
- 指标更新后下次同步会自动重新摄入会话历史
- 修复 omp commit 拆分计划在锁文件与清单同暂存时中止
- 修复绝对路径开头的补全被误当作斜杠命令处理

</details>

<details>
<summary>v16.3.8（2026-07-05） · 2026-07-05</summary>

- 修复浏览器工具因 puppeteer-core 版本漂移而静默丢失 stealth 补丁
- 重新生成补丁并锁定 puppeteer-core 版本，避免未来漂移再次失效

</details>

<details>
<summary>v16.3.7（2026-07-05） · 2026-07-05</summary>

- 支持以 memory:// 地址读取完整记忆行，返回带元数据的 YAML 头
- 修复提供方编排 token 被计入上下文，导致过早触发自动压缩
- /model 搜索限定在当前提供商标签页，不再串存其他提供商标型
- 修复 xAI web_search 优先使用 xai-oauth 凭据再回落到 API key
- 修复 plan 模式 Approve and compact 丢弃排队的运维轮次
- mnemopi 事实抽取保留 instructions、preferences 等原始分类
- 修复 Windows Edge-only 环境下浏览器工具启动失败的问题

</details>

<details>
<summary>v16.3.6（2026-07-04） · 2026-07-04</summary>

- 凭据限流封锁跨进程持久化，新增 auth_credential_blocks 表与 broker 接口
- Anthropic Fable/Mythos 周额度确认耗尽时主动硬封锁该凭据
- 修复 Ollama 工具请求因布尔子 schema 报 HTTP 400 的问题
- 自动重试成功的错误在转录中折叠为一行暗色说明并排除出上下文
- 重写原生回滚提交模型，滚出视口的内容不再丢失或重复出现
- 原生 grep 改为流式并行遍历目录树，且并发调用不再互相串行

</details>

<details>
<summary>v16.3.5（2026-07-04） · 2026-07-04</summary>

- OAuth 回调服务器新增 /launch 短地址，窄终端复制不再截断参数
- 修复 /mcp reauth 丢失 scopes 导致重连报 insufficient_scope
- 修复 Linear 等仅支持 S256 的提供商在 Windows 上 PKCE 校验失败
- 修复大 artifact:// 读取先物化整个工件导致的内存溢出崩溃
- 任务分支合并在单个空提交时自动跳过，不再中止整个 cherry-pick
- 修复 ACP terminal/create 未包装 shell 行导致规范客户端 ENOENT
- 修复 Windows 上原子压缩重写时并发写造成的会话尾部数据丢失

</details>

<details>
<summary>v16.3.4（2026-07-03） · 2026-07-03</summary>

- 新增 Baseten 提供商，包含 DeepSeek V4 Pro 与 Kimi 系列模型
- 目录新增 Devin Claude 5 Fable 变体、Copilot Kimi K2.7 Code 等模型
- 放弃对 Fable/Mythos 周额度的主动硬封锁，改为排名优先级提示
- omp usage 对未上报的同级限额显示 not reported 行以免误读

</details>

<details>
<summary>v16.3.3（2026-07-02） · 2026-07-02</summary>

- 破坏性变更：edit 工具不再接受 _input 作为输入字段别名
- 支持动态模型解析，实现运行中无缝切换模型
- 新增 Claude Fable 等分级与周限额跟踪，避免单额度拖垮整个凭据
- 顾问笔记卡片重新设计，加粗标签头与严重度着色轨条
- Gemini 网络搜索支持经配置指定搜索模型（含环境变量）
- 修复 Windows 上原子压缩并发写导致的会话数据丢失
- 修复 DAP 客户端写超时与适配器进程泄漏造成的挂起
- 为 omp update、Hindsight、Smithery 等网络请求补上超时

</details>

<details>
<summary>v16.3.2（2026-07-02） · 2026-07-02</summary>

- 破坏性变更：grep、glob、ast_grep 的 paths 数组改为单个 path 参数，可用分号分隔
- 新增 speech.enhanced 设置，把助手输出改写为自然口语再合成
- omp stats 仪表盘新增 Tools 标签页，展示调用数、错误率与成本
- 语音改为父端按句切分并用 macOS 无缝流式播放，大幅降低首音延迟
- ZenMux 模型发现无需 API key 即可把新发布模型自动写入缓存
- 修复自动生成的会话标题把全大写缩写改成首字母大写

</details>

<details>
<summary>v16.3.0（2026-07-02） · 2026-07-02</summary>

- 支持 Anthropic serverSideFallback beta，新增 providers.anthropic.serverSideFallback 配置
- 新增 task.softRequestBudgetNotice 设置，开启子代理预算收尾提示
- 会话加载与渲染性能大幅提升，大消息流式揭示提速约十倍
- 会话持久化修复签名思考块损坏，避免 API 以 HTTP 400 拒绝回放
- /quit、/exit 引入关闭预算，不再被后台任务阻塞会话退出
- git clone 与 fetch 改用 30 分钟网络传输截止，区别于本地命令超时
- 协作协议升级到 v3，v2 访客握手将被拒绝并新增交互式 UI 帧
- 修复 /copy code、/copy cmd 被当成普通提示词而不是复制代码块

</details>

<details>
<summary>v16.2.13（2026-07-01） · 2026-07-01</summary>

- 修复旧版 OpenAI Codex 模型因 reasoning.summary 参数被拒的问题
- 兼容的 Codex 模型新增人类可读的推理摘要支持
- Codex 会话改用 V2 流式远程压缩,规避旧接口超时
- 修复 SSH 工具拒绝以波浪号开头的 cwd 远程路径
- 修复 TUI 模糊搜索对中文等非 ASCII 查询的过滤失效

</details>

<details>
<summary>v16.2.12（2026-07-01） · 2026-07-01</summary>

- 优化 Cursor 与 Devin 流式传输,避免大参数导致 UI 卡顿
- 移除模型规范别名分组层,模型匹配改为精确与供应商偏好
- 移除模型选择器 CANONICAL 标签与 omp models canonical 子命令
- 新增 extensionHandlerTimeoutMs 设置,防止扩展工具调用卡死
- 修复 write 工具进度不实时显示、流式参数预览丢失
- 修复浏览器工具中止时 Chromium/Puppeteer 进程泄漏
- 修复 OpenAI 兼容模型发现的上下文窗口信息缺失
- 优化流式 markdown 渲染,复用已渲染行以减少闪烁

</details>

<details>
<summary>v16.2.11（2026-07-01） · 2026-07-01</summary>

- 目录新增 Claude Sonnet 3/3.7、Opus 3 与 Sonnet 5 模型条目
- Anthropic 供应商新增一方目录发现支持
- 更新 DeepSeek R1/V3 价格与 Claude Sonnet 5 接口地址
- /resume 会话选择器改为全屏,支持鼠标滚动与点击恢复
- 修复提示词中途调用 skill 时覆盖用户已输入的内容
- 修复并行 bash 命令取消时误杀其他并发命令
- 修复 grep/ripgrep 目录遍历忽略取消与超时信号
- 修复 Windows 虚拟环境下 Ruff LSP 的自动探测

</details>

<details>
<summary>v16.2.9（2026-06-30） · 2026-06-30</summary>

- 内置 quick_task 子代理重命名为 sonic,并移除 oracle 子代理
- 新增内置 Tester 子代理,专注编写高信号测试用例
- 新增语音输入提交触发设置,可按句或松开即发送
- 新增思考循环保护,自动重试时注入系统提示打断循环
- MCP OAuth 固定重定向端口被占用时改为快速报错
- /mcp reauth 与 add 流程支持按 Esc 立即取消
- 修复技能 frontmatter 中未加引号冒号的描述解析问题

</details>

<details>
<summary>v16.2.8（2026-06-30） · 2026-06-30</summary>

- 内置新增 go-add-cleanup、go-bench-loop 等多条 Go 编码规则
- 放宽 bash 工具对 search、grep、ls、find 命令的限制
- 修复单轮超大上下文导致自动压缩死路,自动执行 shake 精简
- 修复子代理增量 yield 的 schema 校验导致整个结果丢失
- 流式工具调用预览(如 write)不再整段显示为空
- 修复本地模型流超时设置未转发,可在设置中调整看门狗
- bash 拦截器放行 echo/printf 重定向到 /dev/null 等设备

</details>

<details>
<summary>v16.2.7（2026-06-30） · 2026-06-30</summary>

- 全局 serviceTier 与 fastModeScope 改为按模型族分档设置
- 新增 Google Vertex AI Interactions API 与服务档位支持
- 新增 GOOGLE_CLOUD_ACCESS_TOKEN 等显式令牌环境变量
- snapcompact 新增内嵌 TrueType 字体,支持中文等非拉丁文本
- 修复 CJK 历史在多次上下文压缩后无法渲染的问题
- 修复 /resume 打开大型历史会话导致的内存耗尽
- 修复 DuckDuckGo 网页搜索请求头以提升可靠性
- 修复 /extensions 与 /mcp list 状态不一致的问题

</details>

<details>
<summary>v16.2.6（2026-06-29） · 2026-06-29</summary>

- 修复 Antigravity 用量上报的日/周配额窗口识别
- 修复 GLM-5.x 长思考阶段被误判为流卡住而报错
- DuckDuckGo 搜索改用 HTML 前端,非百科查询不再返回空
- Gemini 网页搜索支持标准 GEMINI_API_KEY 开发者凭据
- 修复 Windows 下 MCP npx.cmd 启动与带空格的扩展路径
- 修复 omp search 未应用网页搜索供应商过滤设置
- 修复流式参数预览导致的 TUI 渲染滞后与闪烁

</details>

<details>
<summary>v16.2.5（2026-06-29） · 2026-06-29</summary>

- 状态栏将 worktree 路径折叠为项目名并附工作区图标
- 修复 Ollama/llama.cpp 本地上下文窗口估算过高
- 修复每供应商并发上限导致子代理生成树死锁
- 修复 Ctrl+Q/Ctrl+Enter 追加发送未展开的粘贴占位符
- 内置 grep 新增对 --color 与 --version 参数的兼容
- 修复编辑工作区外文件误报 File not found 的问题

</details>

<details>
<summary>v16.2.4（2026-06-28） · 2026-06-28</summary>

- 远程压缩引入瞬时错误重试、可配置超时与用户中止处理
- Azure OpenAI 与 Codex 模型启用自由格式工具补丁支持
- 新增 /move 命令,可迁移当前会话及其产物到目标目录
- 修复 /collab 会话因超大条目导致的反复重连循环
- 修复 autolearn 与本地记忆写入破坏 Anthropic 提示缓存
- 修复 /usage show 在 Codex 自定义代理下提示无数据

</details>

<details>
<summary>v16.2.3（2026-06-28） · 2026-06-28</summary>

- 默认启用 V2 流式远程压缩,支持会话路由与提示缓存
- 新增 WATCHDOG.yml 配置多个 advisor,各自可配模型与工具
- 新增 /advisor configure 全屏界面管理顾问名单与权限
- advisor 可被授予 edit、write、bash 等内置工具
- 新增 compaction.remoteStreamingV2Enabled 等远程压缩设置
- 新增 edit.citationTags 设置,输出 OpenAI 引用标记
- 会话标题支持修改与自动刷新,并记录推理 token 统计
- Linux 终端新增 D-Bus 桌面通知回退,可用环境变量关闭

</details>

<details>
<summary>v16.2.2（2026-06-27） · 2026-06-27</summary>

- 新增 tiny 模型角色,统一承接标题、记忆等在线小任务
- 新增 textVerbosity 设置控制 OpenAI/Codex 回答详细度
- OpenAI Codex 默认改为中等详细度并启用详细推理摘要
- 新增公开错误模块,提供结构化错误分类与重试判定
- 移除 Pi 方言支持及相关序列化与解析逻辑
- 改进 MCP 服务器发现与 401/403 授权失败的错误识别
- 修复自动会话标题错误保留用户全大写文本的问题

</details>

<details>
<summary>v16.2.1（2026-06-27） · 2026-06-27</summary>

- advisor 系统提示纳入 AGENTS.md 等项目上下文规则文件
- 修复 Claude 市场插件 MCP 配置中环境变量未展开
- 修复 ACP generate_image 实时更新中的图片引用解析

</details>

<details>
<summary>v16.2.0（2026-06-27） · 2026-06-27</summary>

- 破坏性变更:search 工具改名为 grep,find 工具改名为 glob
- 新增 GitLab Duo Agent 与 GitLab Duo Workflow 供应商
- read、grep、write 工具新增 ssh:// 远程主机路径访问
- 新增交互式 /move 覆盖层,带路径补全与目录创建
- 新增 TinyFish、DuckDuckGo、xAI、Firecrawl 网页搜索供应商
- 新增 dap.json 调试适配器配置与 maxInFlightRequests 限流
- 新增 Warp 终端一等支持与 OSC 终端进度显示外观设置
- Todo HUD 重构为紧凑连接树,状态行固定不再堆积滚动区

</details>

<details>
<summary>v16.1.23（2026-06-26） · 2026-06-26</summary>

- 新增 compaction.midTurnEnabled 支持轮次内阈值自动压缩
- 内置 grep 新增 -q/--quiet 与 -x/--line-regexp 选项
- 新增 /resume 按会话 ID 恢复与 omp gc 存储清理命令
- 新增 tui.renderMermaid 设置控制 Mermaid 代码块渲染
- 新增 CoreWeave Serverless Inference 供应商登录支持
- 修复切换压缩策略后旧图像帧泄漏进上下文导致提前压缩
- 内置 shell 新增基于 uutils 的 cat、ls、grep 等命令
- 修复新扩展供应商提供的默认模型在启动时被覆盖

</details>

<details>
<summary>v16.1.22（2026-06-26） · 2026-06-26</summary>

- 修复本地 OpenAI 兼容服务器每轮都重新处理完整提示词
- 新增 OpenAICompat.replayReasoningContent 并对本地供应商启用
- Windows 下 MCP 子进程启动不再弹出可见命令行窗口
- 修复 MCP OAuth 发现跳过 issuer 不匹配的授权服务器元数据

</details>

<details>
<summary>v16.1.21（2026-06-26） · 2026-06-26</summary>

- 修复自动学习自动续跑回合被误当作用户回复而继续执行
- 修复 macOS 剪贴板纯图片粘贴被当作文本或提示为空
- 修复旧版扩展包在编译二进制中的加载与校验失败
- 同一回合多次 todo 更新不再堆叠多个面板
- 修复 MCP OAuth 对拒绝冗余 resource 指示的授权服务器

</details>

<details>
<summary>v16.1.20（2026-06-25） · 2026-06-25</summary>

- 修复执行工具后按 Ctrl+Z 终端挂死只能强杀恢复
- 修复流式输出期间仅图片提交被视为空输入而丢失
- 修复 Claude Sonnet/Haiku 4.5 误发 effort 参数导致 400
- 修复 Ollama 达长度上限的空响应被当作正常停止
- 修复 bash 快照丢失 mise 等激活函数依赖的环境变量
- Warp 终端被识别为一等终端,启用内联图片显示

</details>

<details>
<summary>v16.1.19（2026-06-25） · 2026-06-25</summary>

- 修复跨 API 切换供应商时历史推理内容被降级丢失
- 修复空名称工具调用导致会话陷入 400 重试循环
- Bedrock 跨区域推理配置文件按地理前缀路由正确区域
- 修复 @image 提及在 Codex Responses 上被拒绝的问题
- 修复 skill:// 工具解析丢失会话中已加载的技能
- 修复开发者提示被序列化为 system 破坏本地缓存前缀

</details>

<details>
<summary>v16.1.18（2026-06-25） · 2026-06-25</summary>

- OAuth 改用稳定凭据 ID,403、限流等临时错误不再吊销凭据
- 新增 --list 与 --account 查看和选择已存 OAuth 账号
- /extensions 控制中心改为全屏并支持鼠标导航与切换
- 修复 Codex 图片请求走精简传输被拒,改用完整传输
- 修复本地后端因日志整体重写而反复重新预填充上下文

</details>

<details>
<summary>v16.1.17（2026-06-24） · 2026-06-24</summary>

- 斜杠命令统一记入输入历史,可用上箭头召回
- 修复 task.maxConcurrency 为 0 时子代理被串行执行
- 优化大会话转写加载,显著减少大型会话的 TUI 卡顿
- 修复 tmux 下桌面通知丢失,改用透传封装与响铃回退
- 修复 Windows 下 @ 路径补全对工作区外绝对路径失效
- 修复 GitHub Copilot 企业端点误发图片输入导致 400
- 修复 snapcompact 帧数上限按实际窗口计算,避免反复告警
- 修复 OpenRouter Anthropic 模型缓存与签名推理回放问题

</details>

<details>
<summary>v16.1.16（2026-06-23） · 2026-06-23</summary>

- eval 工具改为每次调用单个单元格,不再接受单元格数组
- eval 的 agent() 参数统一为 agent 与 handle,各语言一致
- 新增 isolated、apply、merge 选项支持工作区隔离执行
- --resume 会话选择器改为全屏并支持鼠标点击恢复
- bash 工具限制使用 ls/find,复杂逻辑引导改用 eval
- 修复 /handoff 在流式响应期间执行导致会话损坏
- 修复 /goal 阈值自动压缩在长工具循环中被跳过

</details>

<details>
<summary>v16.1.15（2026-06-22） · 2026-06-22</summary>

- 新增 share.store 设置,可选加密 Blob 或 GitHub Gist 分享
- /share 默认改传分享服务器,避免 Gist 速率限制失败
- 修复 nohup 后台进程在异步回合结束时被误杀
- 修复 Perplexity 搜索劫持自动搜索链与 OpenRouter 计费
- 修复同一供应商多把 API key 登录互相覆盖
- Codex OAuth 遇配额 429 时自动轮换到其他健康凭据
- omp stats 新增按主代理、子代理、顾问的 token 用量拆分

</details>

<details>
<summary>v16.1.14（2026-06-22） · 2026-06-22</summary>

- 新增 PI_PROXY 及按供应商细分的代理环境变量，并支持 NO_PROXY 豁免
- 新增 Sakana AI 供应商与 Fugu 模型接入，可用 SAKANA、FUGU 变量配置
- 模型目录新增 GCP-5.4 Mini、GPT-5.5 等配置，并引入 xhigh 推理档位
- 新增 Ruby 与 Julia eval 后端，需 eval.rb、eval.jl 显式开启（默认关闭）
- 系统提示不再绝对禁止用 shell 命令替代专用工具，bashInterceptor 仍可硬拦截
- 移除 readHashLines 设置，hashline 锚点改由 edit.mode 统一控制并自动迁移
- 修复 hashline 定界符平衡修复，避免误删或重复补写结构闭合符

</details>

<details>
<summary>v16.1.13（2026-06-22） · 2026-06-22</summary>

- 新增 Devin 作为模型供应商，可从其模型管理器动态拉取模型
- 修复 OpenAI Responses 历史回放丢弃未完成图像生成调用导致的 404
- 修复 /login fireworks 误拒有效 fw 开头 API key 的校验问题
- 修复 Umans 供应商图像预算上限，对齐其单请求 10 张图片的限制

</details>

<details>
<summary>v16.1.12（2026-06-21） · 2026-06-21</summary>

- 密钥混淆改为仅覆盖用户消息与工具结果，不再改写系统提示与工具 schema
- 修复混淆污染 Codex 图片 base64 导致请求报无效数据 URL 的问题
- 少于 8 字符的明文与正则匹配不再混淆，减少误伤正常词语
- 修复 RPC/ACP 启动覆盖调用方显式配置，恢复 isConfigured 守卫
- pi-natives 的 highlightCode 新增 Julia 语法高亮支持

</details>

<details>
<summary>v16.1.11（2026-06-21） · 2026-06-21</summary>

- 新增 tab.waitForSelector、tab.waitForNavigation 浏览器等待能力
- HTML 导出改用品牌配色，可选择品牌配色或本地 TUI 配色
- 修复 OpenAI Responses 回放泄露图像内部字段致代理拒绝请求
- 修复 gemini-3.5-flash 思维 JSON 泄漏进正文输出流的问题
- 修复 Umans GLM 模型误报原生图像支持，改走 handoff 视觉路径
- 修复配置本地 tinyModel 时标题生成回退在线 smol 而产生计费
- 修复 plan 模式在 discoveryMode all 下缺失 write 工具导致停滞
- 会话恢复保留 auto 思考模式选择，不再被固化为上次具体档位

</details>

<details>
<summary>v16.1.10（2026-06-21） · 2026-06-21</summary>

- 流式 JSON 解析改用自研 RelaxedJson，容忍单引号、注释与尾逗号
- 新增 tab.ariaSnapshot 与 tab.ref，浏览器工具支持 ARIA 树快照引用
- write 与 find 设为必备工具，discoveryMode all 下仍始终可用
- 修复 Anthropic 兼容模型工具调用 ID 归一化与重试配对问题
- 修复 DashScope 429 限流与 OpenCode 余额不足被误判为凭据失效
- 修复流式工具调用预览停留在占位内容、不显示最终参数的问题
- 修复 TUI 屏障块下方滚出视口的流式输出内容丢失

</details>

<details>
<summary>v16.1.9（2026-06-21） · 2026-06-21</summary>

- /login 新增 llama.cpp 供应商，默认本地免鉴权，可选填 API key
- /dump 新增 LLM 请求 JSON 导出功能
- 浏览器反检测增强，屏蔽自动化标志并伪装 WebGL、Worker 等指纹 API
- 移除 Wafer Pass 登录与目录条目，保留 wafer-serverless
- 修复 moonshot 可经 MOONSHOT_BASE_URL 指向 Kimi 中国站并回退 KIMI_API_KEY
- 修复 omp list、omp remove 误启动交互会话，改为提示插件子命令
- 修复置于子命令前的全局 flags 被当作 launch 提示词吞掉
- 修复 /mcp enable 与 disable 误重连无关 MCP 服务器

</details>

<details>
<summary>v16.1.8（2026-06-20） · 2026-06-20</summary>

- 新增「Prose Only Thinking」设置，思考脉冲显示实时 tokens/s 速率
- 斜杠命令自动补全新增内置命令的实时状态预览
- /btw 完成答案可复制，/btw、/tan、/omfg 等命令文本进入提示历史
- 默认自动压缩策略改为 snapcompact，advisor 中断冷却默认 3 轮
- 新增 mnemopi.proactiveLinking 配置项，可在设置中开启主动记忆关联
- 协作协议升级为 COLLAB_PROTO 2，大快照分块传输修复 /join 超时
- 自动压缩改用本地历史估算兜底，扩展压缩请求不再抑制自动压缩
- 多个扩展 API 改为异步，如 transformProviderContext 与 snapcompact render

</details>

<details>
<summary>v16.1.7（2026-06-20） · 2026-06-20</summary>

- 修复 minimax-code 及其中国区目录上下文由 512K 更正为 1M 长上下文
- models.yml 支持 compat.supportsImageDetailOriginal 覆盖以适配响应式代理
- 修复斜杠命令前有空格时自动补全与回车补全失效
- 空 / 补全弹窗不再把技能命令排在所有内置命令之后

</details>
