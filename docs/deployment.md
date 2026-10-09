# GitHub Pages 发布

用户于 2026-10-09 指定先完成桌面网页，并新建 `wonderjz99/AI-lian` 仓库，通过 GitHub Pages 发布。手机开发、优化与实体设备验收暂缓；保留已经实现的响应式界面。

## 首次发布

在用户自己的普通终端运行：

```sh
cd /Users/jim/Projects/AI-lian
gh auth login --hostname github.com --web --git-protocol https --scopes repo,workflow
bash scripts/publish-github.sh
```

若已使用正确账号登录，可跳过第二行登录命令。登录时选择 `wonderjz99`；在 GitHub 官方页面完成验证，不把令牌粘贴到对话或文件中。

脚本先验证账号、分支、远程仓库及项目检查，再创建公开仓库、保存本地提交、普通推送 `main`、启用 Actions 类型的 Pages，并触发发布工作流。若已有其他远程、未提交的暂存内容、不同账号或不相关的非空同名仓库，会停止；不会强制推送或更改已有私有仓库的可见性。重复运行可用于后续资料更新，重新检查和发布，不创建重复仓库。

仓库创建后代码与正式资料公开；`node_modules`、`dist`、`.env*` 和 `work/` 不进入 Git。网站仅发布构建后的 `dist`，不会把开发文档作为网页目录发布。

## 自动检查和发布

`.github/workflows/pages.yml` 使用 Node 22 和锁文件执行安装、`npm run check` 以及 Playwright 桌面项目回归；通过后上传静态产物，由单独部署任务使用 Pages 权限发布。PR 仅检查，不发布；`main` 推送或手动触发会检查并发布。不新增手机验收要求。

Vite 的相对资源路径 `base: './'` 保持不变，可部署于项目路径 `/AI-lian/`，图谱动态加载资源也随同构建产物发布。网站没有客户端路由或运行时后端，不需要 404 路由改写、模型密钥或数据库。

预期地址（**只有首次部署成功后才生效**）：

- 仓库：`https://github.com/wonderjz99/AI-lian`
- 网站：`https://wonderjz99.github.io/AI-lian/`
- 部署状态：`https://github.com/wonderjz99/AI-lian/actions`

推送完成不等于上线成功。Actions 中最新的 `Validate and deploy desktop website` 完成 build 和 deploy 后，访问网站复验加载、搜索、双选、资本视图、关系证据和原文链接。后续普通提交后 `git push origin main` 即可自动触发相同检查与发布。

## 当前实际状态

用户终端已创建公开仓库 wonderjz99/AI-lian，本地提交为 `0b8d0ab`，origin 已关联。GitHub 连接器实际读取确认远程仓库仍为空，尚无上传的工作流；不能将仓库创建视作网站上线。若脚本仍在运行，让它继续；若已经退出，可在用户普通终端重新运行发布脚本，它会复用现有仓库与提交，不重复创建。

代理命令行仍无法连接 api.github.com，因此首次推送、启用 Pages 及触发工作流需要用户普通终端完成。GitHub Actions 与公网浏览器验收仍待实际发布后执行。

### 首次推送连接超时

用户后续执行已保存本地提交 `2f9a934`，但 HTTPS 推送在连接 github.com:443 时超时。已发现本机 Clash / mihomo 监听 127.0.0.1:7897；当前 Git 未配置 HTTP 代理。可在用户普通终端对本次发布临时使用现有代理，不改全局 Git 配置：

```sh
cd /Users/jim/Projects/AI-lian
http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897 bash scripts/publish-github.sh
```

代理需要保持运行。此连接方式在当前代理会话内未验证成功：访问本机 7897 返回 operation not permitted，需由用户终端实测。若仍失败，保留完整错误输出继续定位，不重复创建仓库或强制推送。

官方依据：[自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[创建仓库 CLI](https://cli.github.com/manual/gh_repo_create)、[Pages REST API](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site)。
