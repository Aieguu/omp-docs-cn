# Oh My Pi 中文文档

这是 `can1357/oh-my-pi` 的非官方中文文档站，使用 VitePress 构建并通过 GitHub Pages 发布。

## 本地开发

```sh
npm install
npm run docs:dev
```

## 构建

```sh
npm run docs:build
```

## 部署

仓库已包含 `.github/workflows/deploy.yml`。推送到 `main` 后，GitHub Actions 会构建 `docs/` 并发布到 GitHub Pages。

若是第一次启用 Pages，请在仓库 Settings → Pages 中选择 **GitHub Actions** 作为 Source。

## 文档来源

- 上游项目：<https://github.com/can1357/oh-my-pi>
- 本次整理参考提交：`774d32c chore: bump version to 15.4.1`
- 官方站点：<https://omp.sh>
