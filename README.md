# YunzaiJs - Yunzai Bot 插件集合

一款为 Yunzai Bot 打造的高质量 JavaScript 插件合集。所有插件均采用原生 JS 编写，旨在提供轻量、高效且功能丰富的扩展体验。

<div align="center">
  <p>
    <img src="https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge" alt="Version">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/badge/Yunzai-Bot-red?style=for-the-badge" alt="Yunzai Bot">
  </p>
</div>

---

## 🚀 插件功能详情

<details open>
<summary><b>🎯 Help_Lite.js - 极简帮助菜单</b> (点击展开)</summary>

### 功能特点
- **可视化编辑**: 支持通过 [Help Editor](https://help.jiaozi.live/) 在线配置。
- **智能主题**: 支持 自动/深色/浅色 模式切换。
- **动态一言**: 集成 Hitokoto API，显示每日金句。
- **响应式设计**: 高端极简布局，适配不同屏幕。

### 📥 安装方法
```bash
curl -o ./plugins/example/Help_Lite.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/Help_Lite.js'
````

### ⚙️ 使用指令

  - `#帮助` / `#菜单` / `help` - 查看帮助菜单
  - `#刷新帮助` - 强制重新生成图片缓存

\</details\>

\<details\>
\<summary\>\<b\>🔐 bot\_auth.js - 授权管理系统\</b\> (点击展开)\</summary\>

### 功能特点

  - **精细授权**: 支持按群组或用户设置授权期限。
  - **到期拦截**: 自动清理到期授权，-Infinity 优先级确保拦截效率。
  - **查询卡片**: 生成带头像的精美授权状态卡片。

### 📥 安装方法

```bash
curl -o ./plugins/example/bot_auth.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/bot_auth.js'
```

### ⚙️ 使用指令

  - `#授权群号:天数` - 远程授权指定群组
  - `#查询授权` - 查看当前群/用户的授权信息

\</details\>

\<details\>
\<summary\>\<b\>📧 反馈\_发邮件喷v1.1.js - 反馈记录系统\</b\> (点击展开)\</summary\>

### 功能特点

  - **实时通知**: 支持 SMTP 邮件发送（如 QQ 邮箱），实时告知管理员。
  - **本地存档**: 所有反馈均保存在本地 JSON。
  - **列表生成**: 自动渲染精美的反馈汇总图片。

### 📥 安装方法

```bash
curl -o ./plugins/example/反馈_发邮件喷v1.1.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/反馈_发邮件喷v1.1.js'
```

### ⚙️ 使用指令

  - `#反馈 [内容]` - 提交您的建议或 BUG
  - `#查看反馈` - 生成反馈列表图（仅主人）

\</details\>

\<details\>
\<summary\>\<b\>🤖 claw\_hermes.js - OpenClaw & Hermes AI 控制\</b\> (点击展开)\</summary\>

### 功能特点

  - **AI 对话**: 支持 Hermes AI 与 OpenClaw Agent 的底层调用。
  - **格式优化**: 自动清理 Markdown 符号，确保 QQ 消息预览正常。
  - **权限控制**: 仅白名单用户可调用 AI 功能。

### 📥 安装方法

```bash
curl -o ./plugins/example/claw_hermes.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/claw_hermes.js'
```

### ⚙️ 使用指令

  - `claw [指令]` / `hermes [问题]`

\</details\>

\<details\>
\<summary\>\<b\>🐧 [Linux]浏览器进程优化.js - 进程监控\</b\> (点击展开)\</summary\>

### 功能特点

  - **自动清理**: 针对 Linux 系统，监控并清理 Puppeteer 残留的 Chrome 僵尸进程。
  - **资源守护**: 当进程数超过阈值时自动触发优化，保持系统流畅。

### 📥 安装方法

```bash
curl -o ./plugins/example/[Linux]浏览器进程优化.js 'https://raw.githubusercontent.com/T060925ZX/YunzaiJs/refs/heads/main/[Linux]浏览器进程优化.js'
```

\</details\>

-----

## 📦 通用安装说明

### 前置要求

  - **Node.js**: 建议版本 24.x 或更高。
  - **Yunzai Bot**: 或其他兼容框架（如 TRSS-Yunzai）。

### 安装依赖

在机器人根目录下执行以下命令（任选其一）：

```bash
# 使用 pnpm (推荐)
pnpm add puppeteer nodemailer yaml node-fetch -w

# 使用 npm
npm install puppeteer nodemailer yaml node-fetch
```

### 重启生效

下载完成后，在群内发送 `#重启` 或在后台手动重启 Bot 进程。

-----

## 🤝 贡献与联系

如有问题或建议，欢迎联系：

  - **QQ群**: [【☁️云朵收容所】](https://qm.qq.com/q/MIMtWRobQI) (1048206553)
  - **GitHub**: 提交 Issue 或 Pull Request

\<div align="center"\>
\<p\>⭐ 如果喜欢这些插件，请给仓库一个 Star！\</p\>
\<p\>Made with ❤️ by Jiaozi\</p\>
\</div\>

```
