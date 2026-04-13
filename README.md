# JiaoziJs - Yunzai Bot 插件集合

<div align="center">
  <p>
    <img src="https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge" alt="Version">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/badge/Yunzai-Bot-red?style=for-the-badge" alt="Yunzai Bot">
  </p>
</div>

## 📖 项目简介

JiaoziJs 是一个专为 [Yunzai Bot](https://github.com/yoimiya-kokomi/Miao-Yunzai) 设计的多功能插件集合,提供了帮助菜单、授权管理、反馈系统、AI 助手控制等实用功能。所有插件均采用现代化设计,支持精美的图片渲染和友好的用户交互体验。

## ✨ 功能特性

<details>
<summary><b>🎯 Help_Lite.js - 极简宽屏帮助菜单</b>（点击展开）</summary>

### 功能特点
- **可视化编辑**: 支持在线可视化编辑配置 (https://help.jiaozi.live/)
- **智能主题切换**: 支持自动/深色/浅色主题模式
- **动态一言**: 集成 Hitokoto API,显示每日一句
- **自定义背景**: 支持自定义背景图片 URL
- **图标库管理**: 自动从 GitHub/Gitee 下载图标资源
- **缓存优化**: 基于 Hash 的智能缓存机制,避免重复渲染
- **响应式设计**: 高端极简宽屏布局,适配不同屏幕尺寸

### 使用指令
- `#帮助` / `#菜单` / `help` - 查看帮助菜单
- `#刷新帮助` / `#重载帮助` / `#重置帮助` - 强制重新生成帮助图片

### 📥 安装方法
```bash
cd Yunzai-Bot/plugins/example
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/Help_Lite.js ./Help_Lite.js
```

</details>

<details>
<summary><b>🔐 bot_auth.js - 授权管理系统</b>（点击展开）</summary>

### 功能特点
- **精细授权**: 支持按群组或用户进行授权管理
- **期限控制**: 可设置授权有效期,到期自动拦截
- **优先级拦截**: 使用 `-Infinity` 优先级确保在消息处理最前端执行
- **精美查询**: 支持生成带头像的授权状态卡片图片
- **主机器人指定**: 仅指定的 Master Bot 可执行授权操作

### 使用指令
- `#授权群号:天数` - 授权指定群组(如:`#授权123456789:30`)
- `#授权本群天数` - 快速授权当前群组
- `#查询授权` / `#授权查询` - 查看授权状态

### 📥 安装方法
```bash
cd Yunzai-Bot/plugins/example
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/bot_auth.js ./bot_auth.js
```

</details>

<details>
<summary><b>📧 反馈_发邮件喷v1.1.js - 反馈记录系统</b>（点击展开）</summary>

### 功能特点
- **邮件通知**: 支持 SMTP 邮件发送,实时通知管理员
- **本地存储**: 所有反馈记录保存在本地 JSON 文件
- **图片生成**: 自动生成精美的反馈列表图片
- **双头像展示**: 同时显示群头像和用户头像
- **权限控制**: 仅主人可查看和清除反馈记录

### 使用指令
- `#反馈 内容` / `#建议 内容` / `#BUG 内容` - 提交反馈
- `#查看反馈` / `#查询反馈` - 查看所有反馈记录(仅主人)
- `#清空反馈` / `#清除反馈` - 清空所有反馈记录(仅主人)

### 📥 安装方法
```bash
cd Yunzai-Bot/plugins/example
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/反馈_发邮件喷v1.1.js ./反馈_发邮件喷v1.1.js
```

</details>

<details>
<summary><b>🤖 claw_hermes.js - OpenClaw & Hermes AI 控制</b>（点击展开）</summary>

### 功能特点
- **OpenClaw 集成**: 通过命令行调用 OpenClaw Agent
- **Hermes Agent**: 支持 Hermes AI 对话查询
- **Markdown 过滤**: 自动清理输出中的 Markdown 格式符号
- **路径自动检测**: 智能定位 hermes 可执行文件路径
- **权限白名单**: 仅允许指定用户执行 AI 指令

### 使用指令
- `claw 指令内容` - 执行 OpenClaw 命令
- `hermes 问题内容` - 向 Hermes AI 提问

### 📥 安装方法
```bash
cd Yunzai-Bot/plugins/example
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/claw_hermes.js ./claw_hermes.js
```

</details>

<details>
<summary><b>🐧 [Linux]浏览器进程优化.js - 进程监控工具</b>（点击展开）</summary>

### 功能特点
- **自动监控**: 定时检测 Chrome/Chromium 浏览器进程数量
- **智能清理**: 当进程数超过阈值时,自动终止非活跃进程
- **日志记录**: 详细记录检测和清理过程
- **可配置参数**: 可自定义检测间隔和进程阈值

### 配置参数
- `CHECK_INTERVAL`: 检测间隔(默认 600 秒)
- `MAX_PROCESSES`: 触发清理的进程阈值(默认 20)

### 📥 安装方法
```bash
cd Yunzai-Bot/plugins/example
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/[Linux]浏览器进程优化.js ./[Linux]浏览器进程优化.js
```

**注意:** 此脚本仅适用于 Linux 系统

</details>

## 📦 安装说明

### 前置要求

- [Yunzai Bot](https://github.com/yoimiya-kokomi/Miao-Yunzai) 或兼容框架
- Node.js >= 16.x
- Puppeteer(用于图片渲染)
- Git(用于自动下载图标资源)

### 批量安装（可选）

如果需要一次性安装所有插件，可以使用以下脚本：

```bash
# 进入 Yunzai 插件目录
cd Yunzai-Bot/plugins/example

# 批量下载所有插件
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/Help_Lite.js ./Help_Lite.js
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/bot_auth.js ./bot_auth.js
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/反馈_发邮件喷v1.1.js ./反馈_发邮件喷v1.1.js
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/claw_hermes.js ./claw_hermes.js
git clone https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/[Linux]浏览器进程优化.js ./[Linux]浏览器进程优化.js
```

**提示:** 你也可以在上方的各个插件介绍中单独下载安装需要的插件。

### 安装依赖

```bash
npm install puppeteer nodemailer yaml node-fetch
```

### 配置插件

**Help_Lite.js 配置:**
- 首次运行会自动生成 `resources/help-plugin/config.yaml`
- 编辑配置文件自定义标题、主题、背景等

**反馈插件配置:**
- 编辑 `反馈_发邮件喷v1.1.js` 中的 `CONFIG` 对象
- 配置 SMTP 服务器信息和目标邮箱

### 重启 Yunzai Bot

```bash
# 重启 Bot 使插件生效
```

## ⚙️ 配置说明

### Help_Lite 配置示例

```yaml
# resources/help-plugin/config.yaml
main_title: 'YUNZAI BOT'          # 主标题
sub_title: 'COMMAND MENU'         # 副标题
theme: 'auto'                     # 主题: auto/dark/light
device_scale_factor: 1.2          # 设备缩放比例
default_hitokoto: ''              # 默认一言(留空则从 API 获取)
background_image_url: ''          # 背景图片 URL
```

### 反馈插件配置

```javascript
const CONFIG = {
  enable_email: true,              // 是否启用邮件功能
  smtp_host: 'smtp.qq.com',        // SMTP 服务器
  smtp_port: 465,                  // SMTP 端口
  smtp_secure: true,               // 是否使用 SSL
  smtp_user: 'your-email@qq.com',  // 发件人邮箱
  smtp_pass: 'your-app-password',  // 邮箱授权码
  target_email: 'target@qq.com',   // 接收反馈的邮箱
  subject_prefix: '【机器人反馈记录】' // 邮件标题前缀
};
```

### 授权管理配置

```javascript
const MASTER_BOT = '2660750139'  // 负责授权的机器人 QQ 号
```

### OpenClaw/Hermes 配置

```javascript
const ALLOWED_USERS = [1602833550]  // 允许使用 AI 功能的用户 ID 列表
```

## 📁 项目结构

```
JiaoziJs/
├── Help_Lite.js                    # 帮助菜单插件
├── bot_auth.js                     # 授权管理插件
├── 反馈_发邮件喷v1.1.js            # 反馈记录插件
├── claw_hermes.js                  # OpenClaw & Hermes 控制
├── [Linux]浏览器进程优化.js        # Linux 浏览器进程监控
└── README.md                       # 项目说明文档
```

## 🛠️ 技术栈

- **运行时**: Node.js (ES Modules)
- **Bot 框架**: Yunzai Bot Plugin System
- **图片渲染**: Puppeteer
- **邮件服务**: Nodemailer
- **数据处理**: YAML, JSON
- **网络请求**: node-fetch

## 📝 使用说明

### 帮助菜单自定义

1. 访问 https://help.jiaozi.live/ 进行可视化编辑
2. 编辑完成后导出配置
3. 将配置保存到 `resources/help-plugin/help.yaml`
4. 发送 `#刷新帮助` 应用更改

### 授权管理流程

```
管理员在主机器人上执行:
#授权123456789:30     → 授权群聊 123456789 30天
#授权本群30           → 授权当前群聊 30天

用户查询授权状态:
#查询授权             → 查看当前群聊/用户的授权信息
```

### 反馈系统使用

```
用户提交反馈:
#反馈 这个功能有问题    → 提交反馈并发送邮件给管理员

管理员查看反馈:
#查看反馈             → 生成反馈列表图片
#清空反馈             → 清除所有反馈记录
```

## ⚠️ 注意事项

1. **Puppeteer 依赖**: 确保系统已安装 Chromium/Chrome 浏览器
2. **Linux 环境**: `[Linux]浏览器进程优化.js` 仅适用于 Linux 系统
3. **邮件配置**: 使用 QQ 邮箱需开启 SMTP 并获取授权码
4. **权限控制**: 部分指令仅限 Master 或白名单用户使用
5. **网络访问**: Help_Lite 需要访问 GitHub/Gitee 下载图标资源
6. **进程监控**: 浏览器进程优化工具需谨慎使用,避免误杀重要进程

## 📄 许可证

本项目采用 MIT 许可证

```
MIT License

Copyright (c) 2024-2026 Jiaozi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## 👨‍💻 作者

**Jiaozi**
- Copyright © 2024-2026
- All Rights Reserved

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📮 联系方式

如有问题或建议,请通过以下方式联系:
- 提交 GitHub Issue
- 使用机器人的 `#反馈` 功能

---

<div align="center">
  <p>⭐ 如果这个项目对你有帮助,请给个 Star 吧!</p>
  <p>Made with ❤️ by Jiaozi</p>
</div>
