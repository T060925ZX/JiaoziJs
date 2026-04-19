# YunzaiJs - Yunzai Bot 插件集合

一款为 Yunzai Bot 打造的高质量 JavaScript 插件合集。所有插件均采用原生 JS 编写，旨在提供轻量、高效且功能丰富的扩展体验。

<div align="center">
  <p>
    <img src="https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge" alt="Version">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/badge/Yunzai-Bot-red?style=for-the-badge" alt="Yunzai Bot">
    <img src="https://img.shields.io/badge/Node.js-24.x+-brightgreen?style=for-the-badge" alt="Node.js">
  </p>
</div>

---

## 📖 目录

- [插件功能详情](#-插件功能详情)
  - [Help_Lite.js - 极简帮助菜单](#-help_litejs---极简帮助菜单)
  - [bot_auth.js - 授权管理系统](#-bot_authjs---授权管理系统)
  - [反馈_发邮件喷v1.1.js - 反馈记录系统](#-反馈_发邮件喷v11js---反馈记录系统)
  - [claw_hermes.js - OpenClaw & Hermes AI 控制](#-claw_hermesjs---openclaw--hermes-ai-控制)
  - [[Linux]浏览器进程优化.js - 进程监控](#-linux浏览器进程优化js---进程监控)
- [通用安装说明](#-通用安装说明)
- [常见问题](#-常见问题)
- [贡献与联系](#-贡献与联系)

---

## 🚀 插件功能详情

<details open>
<summary><b>🎯 Help_Lite.js - 极简帮助菜单</b> (点击展开)</summary>

### 功能特点
- **可视化编辑**: 支持通过 [Help Editor](https://help.jiaozi.live/) 在线配置，所见即所得。
- **智能主题**: 支持 自动/深色/浅色 模式切换，适配不同场景。
- **动态一言**: 集成 Hitokoto API，每次打开显示不同的每日金句。
- **响应式设计**: 高端极简布局，完美适配手机与电脑屏幕。
- **图片缓存**: 自动缓存生成的帮助图片，提升响应速度。

### 📥 安装方法
```bash
# 进入 Yunzai 根目录，执行以下命令
curl -o ./plugins/example/Help_Lite.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/Help_Lite.js'
```

### ⚙️ 使用指令
| 指令 | 说明 |
|------|------|
| `#帮助` / `#菜单` / `help` | 查看帮助菜单 |
| `#刷新帮助` | 强制重新生成图片缓存 |

</details>

<details>
<summary><b>🔐 bot_auth.js - 授权管理系统</b> (点击展开)</summary>

### 功能特点
- **精细授权**: 支持按群组或用户设置授权期限，灵活控制访问权限。
- **到期拦截**: 自动清理到期授权，-Infinity 优先级确保拦截效率。
- **查询卡片**: 生成带头像的精美授权状态卡片，直观展示剩余时长。
- **多级管理**: 支持超级管理员和次级管理员分级授权。
- **日志记录**: 所有授权操作自动记录，便于审计追踪。

### 📥 安装方法
```bash
curl -o ./plugins/example/bot_auth.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/bot_auth.js'
```

### ⚙️ 使用指令
| 指令 | 说明 | 权限 |
|------|------|------|
| `#授权群号:天数` | 远程授权指定群组 | 主人/管理员 |
| `#授权QQ号:天数` | 授权指定用户 | 主人/管理员 |
| `#查询授权` | 查看当前群/用户的授权信息 | 所有人 |
| `#取消授权 群号/QQ号` | 取消指定授权 | 主人/管理员 |
| `#授权列表` | 查看所有授权记录 | 主人 |

</details>

<details>
<summary><b>📧 反馈_发邮件喷v1.1.js - 反馈记录系统</b> (点击展开)</summary>

### 功能特点
- **实时通知**: 支持 SMTP 邮件发送（如 QQ 邮箱、163 邮箱），实时告知管理员新反馈。
- **本地存档**: 所有反馈均保存在本地 JSON 文件，支持数据持久化。
- **列表生成**: 自动渲染精美的反馈汇总图片，支持分页查看。
- **反馈分类**: 支持建议/BUG/投诉等多种反馈类型。
- **状态跟踪**: 管理员可标记反馈为"已读/处理中/已完成"。

### 📥 安装方法
```bash
curl -o ./plugins/example/反馈_发邮件喷v1.1.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/反馈_发邮件喷v1.1.js'
```

### ⚙️ 使用指令
| 指令 | 说明 | 权限 |
|------|------|------|
| `#反馈 [内容]` | 提交您的建议或 BUG | 所有人 |
| `#反馈 [类型] [内容]` | 指定类型提交反馈（如：#反馈 BUG xxx） | 所有人 |
| `#查看反馈` | 生成反馈列表图 | 仅主人 |
| `#处理反馈 [ID]` | 标记反馈为已处理 | 仅主人 |
| `#删除反馈 [ID]` | 删除指定反馈 | 仅主人 |

</details>

<details>
<summary><b>🤖 claw_hermes.js - OpenClaw & Hermes AI 控制</b> (点击展开)</summary>

### 功能特点
- **AI 对话**: 支持 Hermes AI 与 OpenClaw Agent 的底层调用，智能问答。
- **格式优化**: 自动清理 Markdown 符号，确保 QQ 消息预览正常美观。
- **权限控制**: 仅白名单用户可调用 AI 功能，防止滥用。
- **多模型支持**: 支持切换不同的 AI 模型（Hermes/Claw/GPT）。
- **对话历史**: 保留上下文对话能力，实现连续对话。

### 📥 安装方法
```bash
curl -o ./plugins/example/claw_hermes.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/claw_hermes.js'
```

### ⚙️ 使用指令
| 指令 | 说明 |
|------|------|
| `claw [问题]` | 调用 OpenClaw Agent 进行问答 |
| `hermes [问题]` | 调用 Hermes AI 进行问答 |
| `#AI切换 [模型名]` | 切换当前使用的 AI 模型 |
| `#AI清空` | 清空当前对话历史 |

</details>

<details>
<summary><b>🐧 [Linux]浏览器进程优化.js - 进程监控</b> (点击展开)</summary>

### 功能特点
- **自动清理**: 针对 Linux 系统，监控并清理 Puppeteer 残留的 Chrome 僵尸进程。
- **资源守护**: 当进程数超过阈值时自动触发优化，保持系统流畅。
- **定时扫描**: 支持自定义扫描间隔，默认每 30 分钟检查一次。
- **日志输出**: 清理操作自动记录到日志文件，便于排查问题。
- **轻量高效**: 原生 Shell 调用，资源占用极低。

### 📥 安装方法
```bash
curl -o ./plugins/example/[Linux]浏览器进程优化.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/[Linux]浏览器进程优化.js'
```

### ⚙️ 配置说明
安装后无需额外配置，插件自动运行。如需修改扫描间隔，请编辑插件中的 `SCAN_INTERVAL` 变量（单位：毫秒）。

</details>

---

## 📦 通用安装说明

### 前置要求
| 要求 | 版本 |
|------|------|
| **Node.js** | 建议版本 24.x 或更高 |
| **Yunzai Bot** | v3.0 及以上版本 |
| **pnpm/npm** | 最新稳定版 |

### 安装依赖
在机器人根目录下执行以下命令（任选其一）：

```bash
# 使用 pnpm (推荐)
pnpm add puppeteer nodemailer yaml node-fetch -w

# 使用 npm
npm install puppeteer nodemailer yaml node-fetch

# 使用 yarn
yarn add puppeteer nodemailer yaml node-fetch
```

### 安装插件
选择需要安装的插件，复制对应的 curl 命令执行即可。所有插件将下载到 `./plugins/example/` 目录下。

### 重启生效
下载完成后，在群内发送 `#重启` 或在后台手动重启 Bot 进程。

---

## ❓ 常见问题

<details>
<summary><b>Q: 插件安装后没有反应怎么办？</b></summary>

1. 确认已安装所有依赖（puppeteer、nodemailer 等）
2. 检查 Node.js 版本是否符合要求（≥24.x）
3. 查看控制台是否有报错信息
4. 尝试重启 Bot 进程
</details>

<details>
<summary><b>Q: Help_Lite.js 生成的图片不显示？</b></summary>

- 确保 puppeteer 安装完整：`pnpm add puppeteer -w`
- Linux 系统可能需要额外安装 Chrome 依赖：`apt-get install -y libgbm-dev libxshmfence-dev`
</details>

<details>
<summary><b>Q: 反馈邮件发送失败？</b></summary>

- 检查邮箱 SMTP 配置是否正确
- 确认邮箱已开启 SMTP 服务（QQ 邮箱需生成授权码）
- 查看是否有网络连接问题
</details>

<details>
<summary><b>Q: 如何更新已安装的插件？</b></summary>

重新运行对应的 curl 命令即可覆盖更新，更新后建议重启 Bot。
</details>

---

## 🤝 贡献与联系

如有问题、建议或想要贡献代码，欢迎通过以下方式联系：

- **QQ 群**: [【☁️云朵收容所】](https://qm.qq.com/q/MIMtWRobQI) (1048206553)
- **GitHub**: [提交 Issue](https://github.com/T060925ZX/YunzaiJs/issues) 或 Pull Request
- **作者**: Jiaozi

### 贡献指南
1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

---

<div align="center">
  <p>
    <img src="https://img.shields.io/github/stars/T060925ZX/YunzaiJs?style=social" alt="GitHub stars">
    <img src="https://img.shields.io/github/forks/T060925ZX/YunzaiJs?style=social" alt="GitHub forks">
  </p>
  <p>⭐ 如果喜欢这些插件，请给仓库一个 Star！</p>
  <p>Made with ❤️ by Jiaozi</p>
  <p><sub>Licensed under MIT License</sub></p>
</div>
