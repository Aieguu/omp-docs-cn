import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "Oh My Pi 中文文档",
  description: "面向 Oh My Pi / omp coding agent 的中文使用、配置、扩展与架构文档",
  base: "/omp-docs-cn/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: "https://omp.sh/favicon.svg",
    siteTitle: "OMP 中文文档",
    nav: [
      { text: "指南", link: "/guide/overview" },
      { text: "参考", link: "/reference/tool-catalog" },
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
          { text: "Slash 命令", link: "/guide/slash-commands" },
          { text: "快捷键", link: "/guide/keybindings" },
          { text: "核心概念", link: "/guide/concepts" }
        ]
      },
      {
        text: "日常使用",
        items: [
          { text: "工具系统", link: "/guide/tools" },
          { text: "会话、分支与记忆", link: "/guide/sessions" },
          { text: "配置体系", link: "/guide/config" },
          { text: "模型与 Provider", link: "/guide/models" }
        ]
      },
      {
        text: "高级主题",
        items: [
          { text: "扩展、技能、MCP 与 Hook", link: "/guide/extensibility" },
          { text: "架构与运行时", link: "/guide/internals" },
          { text: "常见问题", link: "/guide/faq" }
        ]
      },
      {
        text: "参考",
        items: [
          { text: "内置工具目录", link: "/reference/tool-catalog" },
          { text: "环境变量速查", link: "/reference/env" },
          { text: "MCP 配置速查", link: "/reference/mcp" },
          { text: "上游文档覆盖清单", link: "/reference/source-map" }
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
