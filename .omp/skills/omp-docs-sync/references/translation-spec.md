# CN docs sync spec (read by translation workers)

You are translating official omp.sh English docs into Simplified Chinese pages of the
VitePress site at docs/. The source for each page is the rendered capture at
`.cache/official/<slug>.md` (produced by `scripts/fetch-pages.js`); each starts with
`# <English title>`. If a source still carries legacy `Title: / URL Source: /
Markdown Content:` header lines, strip them. Site root for links is the file's own
folder; guide pages live in docs/guide/, reference pages in docs/reference/. Write files
in UTF-8 markdown.
Do not translate command names, code, file paths, provider/model names, key names
(Ctrl+P...), env var names, URLs, code fences, table structure, or headings that are
pure product terms like `omp`, `MCP`, `SDK`, `TUI`, `ACP`, `Agent`, `Provider`, `Hook`.
Use the terms: session=会话, fork=分叉, branch=分支, resume=恢复, share=分享,
leaf=叶子(节点), tool=工具, subagent=子代理, extension=扩展, plugin=插件,
marketplace=市场, prompt=提示词, keybinding=快捷键, compaction=压缩, context=上下文,
artifact=工件, approval=审批, model=模型, skill=技能, queue=队列, turn=轮次,
steering/follow-up=后续消息/引导消息, profile=档案(profile), checkpoint=检查点,
project root=项目根目录, workspace root=工作区根目录, clipboard=剪贴板.
Address the reader as 你. Translate the whole page — every section, paragraph, code
block and table — never a summary. File must start with `# <Chinese title>`.

## VitePress rendering rules (violations break the build)

- Inside a **table row**, a `|` inside a code span must be escaped: `` `[--scope project\|user]` ``.
  Unescaped, it splits the cell and can fail the build with "Element is missing end tag".
- Outside code fences never emit `{{`: Vue parses it as interpolation. Write
  `<code v-pre>{{args}}</code>` instead.
- Keep the official structure: same number of `##` / `###` sections, same order, same
  code fences and table rows. `scripts/verify-docs.mjs` compares heading counts.
- Internal links follow the map below. Never leave `https://omp.sh/docs…` or `/docs/<slug>`
  in body text.
- Do not touch pages that have no official counterpart: guide/faq.md, guide/install.md,
  reference/source-map.md.

## Official link rewrite map
For every internal official link (URL `https://omp.sh/docs` optionally + `/slug`, or
`/docs/slug`), rewrite to a relative markdown link per this table (slug -> local path).
`overview`(slug empty) -> `./overview.md`
`quickstart` -> `./quickstart.md`
`using` -> `./using.md`
`slash` -> `./slash-commands.md`
`keybindings` -> `./keybindings.md`
`settings` -> `./settings.md`
`modes` -> `./modes.md`
`sessions` -> `./sessions.md`
`session-tree` -> `./session-tree.md`
`memory` -> `./memory.md`
`compaction` -> `./compaction.md`
`plan` -> `./plan.md`
`goal` -> `./goal.md`
`handoff` -> `./handoff.md`
`files` -> `./files.md`
`code-intelligence` -> `./code-intelligence.md`
`debugging` -> `./debugging.md`
`editing` -> `./editing.md`
`subagents` -> `./subagents.md`
`web` -> `./web.md`
`github` -> `./github.md`
`providers` -> `./providers.md`
`roles` -> `./roles.md`
`custom-models` -> `./custom-models.md`
`context-files` -> `./context-files.md`
`skills` -> `./skills.md`
`prompt-templates` -> `./prompt-templates.md`
`hooks` -> `./hooks.md`
`custom-tools` -> `./custom-tools.md`
`subagent-authoring` -> `./subagent-authoring.md`
`mcp` -> `./mcp.md`
`mcp-authoring` -> `./mcp-authoring.md`
`themes` -> `./themes.md`
`ttsr` -> `./ttsr.md`
`plugins` -> `./plugins.md`
`extension-authoring` -> `./extension-authoring.md`
`marketplace` -> `./marketplace.md`
`sdk` -> `./sdk.md`
`rpc` -> `./rpc.md`
`acp` -> `./acp.md`
`tools` -> `./tools.md`
`advisor` -> `./advisor.md`
`agents-and-roles` -> `./agents-and-roles.md`
`collab` -> `./collab.md`
`commit` -> `./commit.md`
`computer` -> `./computer.md`
`magic-keywords` -> `./magic-keywords.md`
`prewalk` -> `./prewalk.md`
`review` -> `./review.md`
`security` -> `./security.md`
`vibe` -> `./vibe.md`
`cli` -> `../reference/cli.md`
`env` -> `../reference/env.md`
`secrets` -> `../reference/secrets.md`
`session-format` -> `../reference/session-format.md`
`approvals` -> `../reference/approvals.md`
Anchors: keep `#anchor` if the anchor matches the translated heading's Chinese text in the
same page; otherwise drop the anchor.
When a target file does not exist yet, still write the mapped link (files will exist at
build time). Never leave a bare `https://omp.sh/docs` internal URL in body text.

## Chinese titles (slug -> title line)
overview=项目概览, quickstart=快速上手, using=使用 omp, slash=Slash 命令,
keybindings=快捷键, settings=设置, modes=运行模式, sessions=会话,
session-tree=会话树, memory=记忆, compaction=压缩, plan=计划模式, goal=目标模式,
handoff=交接, files=文件操作, code-intelligence=代码智能, debugging=调试,
editing=结构化编辑, subagents=子代理与 Agent Hub, web=Web 与浏览器, github=GitHub,
providers=Provider, roles=模型角色, custom-models=自定义模型与 Provider,
context-files=上下文文件, skills=技能, prompt-templates=Prompt 模板, hooks=Hook,
custom-tools=自定义工具, subagent-authoring=编写子代理, mcp=MCP,
mcp-authoring=编写 MCP 服务端, themes=主题, ttsr=TTSR 规则, plugins=插件,
extension-authoring=编写扩展, marketplace=市场, sdk=SDK, rpc=RPC 模式, acp=ACP,
tools=工具索引, advisor=Advisor 模型, agents-and-roles=Agent 与模型角色,
collab=Collab, commit=创建提交, computer=计算机控制, magic-keywords=魔法关键词,
prewalk=Prewalk, review=代码审查, security=安全扫描, vibe=Vibe 模式,
cli=CLI 参考, env=环境变量, secrets=密钥与认证, session-format=会话格式,
approvals=工具审批
