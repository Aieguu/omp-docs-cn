# 安装与升级

## 环境要求

上游 README 标注：

- macOS、Linux、Windows。
- Bun `>= 1.3.14`。
- npm 包名：`@oh-my-pi/pi-coding-agent`。

## 安装方式

### macOS / Linux 安装脚本

```sh
curl -fsSL https://omp.sh/install | sh
```

### Windows PowerShell 安装脚本

```powershell
irm https://omp.sh/install.ps1 | iex
```

### Bun 全局安装

```sh
bun install -g @oh-my-pi/pi-coding-agent
```

### mise 固定版本

```sh
mise use -g github:can1357/oh-my-pi
```

## 验证安装

```sh
omp --version
omp --help
```

如果要测试 one-shot 模式：

```sh
omp -p "用一句话说明当前目录是什么项目"
```

## 配置目录

默认配置和运行数据位于：

```text
~/.omp/agent/
```

常见文件：

| 路径 | 用途 |
| --- | --- |
| `~/.omp/agent/config.yml` | 全局设置。 |
| `~/.omp/agent/models.yml` | 自定义模型 / Provider。 |
| `~/.omp/agent/mcp.json` | 用户级 MCP 配置。 |
| `~/.omp/agent/sessions/` | 会话 JSONL。 |
| `~/.omp/agent/blobs/` | 大型二进制 blob。 |
| `~/.omp/agent/history.db` | prompt 历史搜索。 |

项目级配置通常放在：

```text
<project>/.omp/
```

## 升级建议

- 如果通过安装脚本安装，重新运行脚本通常会覆盖到最新发布版本。
- 如果通过 Bun 安装：

```sh
bun update -g @oh-my-pi/pi-coding-agent
```

- 如果使用 `mise`，通过 `mise` 的版本 pin 机制升级。

## Windows 注意点

omp 的上游目标之一是“不需要 WSL 桥接也能运行”。搜索、shell、PTY、文本处理等大量能力由原生 N-API / Rust 实现，但具体项目命令仍取决于你的开发环境，例如 `git`、`node`、`python`、编译器和语言服务是否可用。
