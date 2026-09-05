import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "Oh My Pi 中文文档",
  description: "面向 Oh My Pi / omp coding agent 的中文使用、配置、扩展与架构文档",
  base: "/omp-docs-cn/",
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", type: "image/x-icon", href: "/omp-docs-cn/favicon.ico" }]
  ],
  themeConfig: {
    logo: "/omp-docs-cn/hero.png",
    siteTitle: "OMP 中文文档",
    nav: [
      { text: "指南", link: "/guide/overview" },
      { text: "参考", link: "/reference/cli" },
      { text: "源码", link: "https://github.com/can1357/oh-my-pi" },
      { text: "官网", link: "https://omp.sh" }
    ],
    sidebar: [
      {
        text: "开始",
        items: [
          { text: "项目概览", link: "/guide/overview" },
          { text: "安装与升级", link: "/guide/install" },
          { text: "快速上手", link: "/guide/quickstart" },
          { text: "使用 omp", link: "/guide/using" },
          { text: "Slash 命令", link: "/guide/slash-commands" },
          { text: "快捷键", link: "/guide/keybindings" },
          { text: "设置", link: "/guide/settings" },
          { text: "运行模式", link: "/guide/modes" },
          { text: "会话", link: "/guide/sessions" },
          { text: "会话树", link: "/guide/session-tree" },
          { text: "记忆", link: "/guide/memory" },
          { text: "压缩", link: "/guide/compaction" },
          { text: "计划模式", link: "/guide/plan" },
          { text: "目标模式", link: "/guide/goal" },
          { text: "交接", link: "/guide/handoff" }
        ]
      },
      {
        text: "能力",
        items: [
          { text: "文件操作", link: "/guide/files" },
          { text: "代码智能", link: "/guide/code-intelligence" },
          { text: "调试", link: "/guide/debugging" },
          { text: "结构化编辑", link: "/guide/editing" },
          { text: "代码审查", link: "/guide/review" },
          { text: "创建提交", link: "/guide/commit" },
          { text: "安全扫描", link: "/guide/security" },
          { text: "子代理与 IRC", link: "/guide/subagents" },
          { text: "Advisor 模型", link: "/guide/advisor" },
          { text: "Vibe 模式", link: "/guide/vibe" },
          { text: "Collab", link: "/guide/collab" },
          { text: "Web 与浏览器", link: "/guide/web" },
          { text: "计算机控制", link: "/guide/computer" },
          { text: "GitHub", link: "/guide/github" }
        ]
      },
      {
        text: "模型",
        items: [
          { text: "Provider", link: "/guide/providers" },
          { text: "模型角色", link: "/guide/roles" },
          { text: "Agent 与模型角色", link: "/guide/agents-and-roles" },
          { text: "自定义模型与 Provider", link: "/guide/custom-models" },
          { text: "Prewalk", link: "/guide/prewalk" }
        ]
      },
      {
        text: "定制",
        items: [
          { text: "上下文文件", link: "/guide/context-files" },
          { text: "技能", link: "/guide/skills" },
          { text: "Prompt 模板", link: "/guide/prompt-templates" },
          { text: "魔法关键词", link: "/guide/magic-keywords" },
          { text: "Hook", link: "/guide/hooks" },
          { text: "自定义工具", link: "/guide/custom-tools" },
          { text: "编写子代理", link: "/guide/subagent-authoring" },
          { text: "MCP", link: "/guide/mcp" },
          { text: "编写 MCP 服务端", link: "/guide/mcp-authoring" },
          { text: "主题", link: "/guide/themes" },
          { text: "TTSR 规则", link: "/guide/ttsr" },
          { text: "插件", link: "/guide/plugins" },
          { text: "编写扩展", link: "/guide/extension-authoring" },
          { text: "市场", link: "/guide/marketplace" }
        ]
      },
      {
        text: "编程接口",
        items: [
          { text: "SDK", link: "/guide/sdk" },
          { text: "RPC 模式", link: "/guide/rpc" },
          { text: "ACP", link: "/guide/acp" }
        ]
      },
      {
        text: "参考",
        items: [
          { text: "CLI 参考", link: "/reference/cli" },
          { text: "环境变量", link: "/reference/env" },
          { text: "密钥与认证", link: "/reference/secrets" },
          { text: "工具审批", link: "/reference/approvals" },
          { text: "会话格式", link: "/reference/session-format" },
          { text: "工具索引", link: "/guide/tools" }
        ]
      }
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/can1357/oh-my-pi" }
    ],
    search: {
      provider: "local"
    },
    editLink: {
      pattern: "https://github.com/Aieguu/omp-docs-cn/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页"
    },
    footer: {
      message: "基于 oh-my-pi 上游文档整理的非官方中文文档。",
      copyright: "MIT Licensed"
    }
  }
});
