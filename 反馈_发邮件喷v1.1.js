import fs from 'fs';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

/**
 * ==========================================
 * 插件配置区域
 * ==========================================
 */
const CONFIG = {
  // 是否启用邮件反馈功能 (true: 启用, false: 禁用)
  enable_email: true,
  // SMTP 服务器地址 (例如: smtp.qq.com, smtp.163.com)
  smtp_host: 'smtp.qq.com',
  // SMTP 端口 (通常为 465 或 587)
  smtp_port: 465,
  // 是否使用 SSL/TLS
  smtp_secure: true,
  // 发件人邮箱账号
  smtp_user: 'your-email@qq.com',
  // 发件人邮箱授权码 (非密码，需在邮箱设置中开启 SMTP 获取)
  smtp_pass: 'your-app-password',
  // 接收反馈的指定邮箱
  target_email: 'target-email@qq.com',
  // 邮件标题前缀
  subject_prefix: '【机器人反馈记录】'
};

export class FeedbackPlugin extends plugin {
  constructor() {
    super({
      name: '记录反馈',
      dsc: '记录反馈、发送邮件并生成精美图片列表',
      event: 'message',
      priority: -1,
      rule: [
        {
          reg: '^#(反馈|意见|建议|BUG|bug|Bug) (.*)$',
          fnc: 'recordFeedback',
        },
        {
          reg: '^#(查看|查询)(记录|反馈)$',
          fnc: 'viewFeedback',
        },
        {
          reg: '^#(清空|清理|清除)(反馈记录|记录)$',
          fnc: 'clearFeedback',
        }
      ]
    });

    // 仅在启用邮件时初始化传输器
    if (CONFIG.enable_email) {
      this.transporter = nodemailer.createTransport({
        host: CONFIG.smtp_host,
        port: CONFIG.smtp_port,
        secure: CONFIG.smtp_secure,
        auth: {
          user: CONFIG.smtp_user,
          pass: CONFIG.smtp_pass,
        },
      });
    }
  }

  /**
   * 记录反馈核心逻辑
   */
  async recordFeedback(e) {
    const dirPath = './data';
    const filePath = './data/feedback.json';

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    // 获取信息
    const info = e.isGroup ? await e.group.getInfo() : { group_name: '私聊反馈' };
    const groupname = info.group_name || '未知群聊';
    let groupid = e.group_id || '私聊';
    let name = e.member?.card || e.member?.nickname || e.nickname || '未知用户';
    let id = e.user_id;
    let content = e.raw_message.replace(/^#(反馈|意见|建议|BUG|bug|Bug)\s*/i, '').trim();

    const now = new Date();
    const remarkTime = now.getFullYear() + '-' +
                          String(now.getMonth() + 1).padStart(2, '0') + '-' +
                          String(now.getDate()).padStart(2, '0') + ' ' +
                          String(now.getHours()).padStart(2, '0') + ':' +
                          String(now.getMinutes()).padStart(2, '0') + ':' +
                          String(now.getSeconds()).padStart(2, '0');

    // 头像 URL
    const groupAvatar = e.isGroup ? `http://p.qlogo.cn/gh/${groupid}/${groupid}/100/` : '';
    const userAvatar = `https://q1.qlogo.cn/g?b=qq&s=640&nk=${id}`;

    const feedbackData = {
      group_name: groupname,
      group_id: groupid,
      group_avatar: groupAvatar,
      user_name: name,
      user_id: id,
      user_avatar: userAvatar,
      content: content,
      Time: remarkTime
    };

    // 1. 本地存储 (始终执行)
    let feedbackArray = [];
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        feedbackArray = JSON.parse(data);
      } catch (err) {
        feedbackArray = [];
      }
    }
    feedbackArray.push(feedbackData);
    fs.writeFileSync(filePath, JSON.stringify(feedbackArray, null, 3), 'utf-8');

    // 2. 发送邮件 (根据配置开关执行)
    if (CONFIG.enable_email && this.transporter) {
      this.sendFeedbackEmail(feedbackData).catch(err => {
        console.error('[Feedback] 邮件发送失败:', err);
      });
    }

    await e.reply('找茬已记录，讨厌您的找茬！');
    return true;
  }

  /**
   * 发送邮件逻辑 (包含头像展示)
   */
  async sendFeedbackEmail(data) {
    // 处理头像逻辑，如果是私聊则不显示群头像区域
    const groupAvatarHtml = data.group_avatar 
      ? `<div style="display: flex; align-items: center; margin-bottom: 10px; background: #f8fafc; padding: 10px; border-radius: 8px;">
           <img src="${data.group_avatar}" width="40" height="40" style="border-radius: 8px; margin-right: 12px; border: 1px solid #e2e8f0;" />
           <div>
             <div style="font-weight: bold; font-size: 14px; color: #1e293b;">${data.group_name}</div>
             <div style="font-size: 12px; color: #64748b;">群号: ${data.group_id}</div>
           </div>
         </div>` 
      : '';

    const mailOptions = {
      from: `"${data.user_name}" <${CONFIG.smtp_user}>`,
      to: CONFIG.target_email,
      subject: `${CONFIG.subject_prefix} 来自 ${data.user_name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, sans-serif; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: #3b82f6; padding: 24px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">收到新的找茬反馈</h1>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            
            ${groupAvatarHtml}

            <div style="display: flex; align-items: center; margin-bottom: 20px; background: #f0f7ff; padding: 12px; border-radius: 50px;">
              <img src="${data.user_avatar}" width="45" height="45" style="border-radius: 50%; margin-right: 15px; border: 2px solid white;" />
              <div>
                <div style="font-weight: bold; font-size: 16px; color: #1e3a8a;">${data.user_name}</div>
                <div style="font-size: 12px; color: #3b82f6;">UID: ${data.user_id}</div>
              </div>
            </div>

            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">反馈时间：${data.Time}</p>

            <div style="background-color: #fafafa; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px;">
              <p style="margin: 0; font-weight: bold; color: #3b82f6; font-size: 14px; margin-bottom: 8px;">📝 反馈内容：</p>
              <p style="white-space: pre-wrap; margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">${data.content}</p>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
            此邮件由机器人反馈插件自动发送 · 感谢关注
          </div>
        </div>
      `,
    };
    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * 查看反馈列表 (生成图片)
   */
  async viewFeedback(e) {
    if (!e.isMaster) {
      await e.reply('你不是主人，不可以查看反馈记录!');
      return;
    }

    const filePath = './data/feedback.json';
    if (!fs.existsSync(filePath)) return e.reply('暂无反馈记录！');

    const feedbackArray = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (feedbackArray.length === 0) return e.reply('暂无反馈记录！');

    await e.reply('正在生成反馈记录图片，请稍候...');
    try {
      const imagePath = await this.generateFeedbackImage(feedbackArray);
      await e.reply(segment.image(imagePath));

      setTimeout(() => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, 10000);
    } catch (error) {
      console.error('生成反馈图片失败:', error);
      await e.reply('生成反馈记录图片失败，请检查日志！');
    }
  }

  async generateFeedbackImage(feedbackArray) {
    const tempDir = './data/temp';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const imagePath = `./data/temp/feedback_${Date.now()}.png`;
    const htmlContent = this.generateFeedbackHTML(feedbackArray);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 780, height: 800, deviceScaleFactor: 2 });
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      await page.waitForSelector('.feedback-container', { timeout: 5000 });
      const container = await page.$('.feedback-container');
      const boundingBox = await container.boundingBox();

      await page.screenshot({
        path: imagePath,
        clip: {
          x: boundingBox.x - 10,
          y: boundingBox.y - 10,
          width: boundingBox.width + 20,
          height: boundingBox.height + 20
        }
      });
      return imagePath;
    } finally {
      await browser.close();
    }
  }

  generateFeedbackHTML(feedbackArray) {
    let cardsHtml = '';
    feedbackArray.forEach((item, index) => {
      const groupName = this.escapeHtml(item.group_name || '未知群组');
      const groupId = this.escapeHtml(String(item.group_id || '未记录'));
      const groupAvatar = item.group_avatar || `http://p.qlogo.cn/gh/${groupId}/${groupId}/100/`;
      const userName = this.escapeHtml(item.user_name || '匿名用户');
      const userId = this.escapeHtml(String(item.user_id || '未知ID'));
      const userAvatar = item.user_avatar || `https://q1.qlogo.cn/g?b=qq&s=640&nk=${userId}`;
      const content = this.escapeHtml(item.content || '无内容').replace(/\n/g, '<br>');
      const timeStr = this.escapeHtml(item.Time || '未知时间');

      cardsHtml += `
        <div class="feedback-card">
          <div class="card-number-badge">#${index + 1}</div>
          <div class="card-header">
            <div class="group-info">
              <img class="group-avatar" src="${groupAvatar}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%233b82f6\'/%3E%3C/svg%3E'">
              <div class="group-details">
                <div class="group-name">${groupName}</div>
                <div class="group-id">群号: ${groupId}</div>
              </div>
            </div>
            <div class="user-info">
              <img class="user-avatar" src="${userAvatar}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%2360a5fa\'/%3E%3C/svg%3E'">
              <div class="user-details">
                <div class="user-name">${userName}</div>
                <div class="user-id">UID: ${userId}</div>
              </div>
            </div>
          </div>
          <div class="card-content">
            <div class="time-info">
              <span class="time-icon">📅</span>
              <span>${timeStr}</span>
            </div>
            <div class="content-wrapper">
              <div class="content-label">📝 反馈内容</div>
              <div class="feedback-text">${content}</div>
            </div>
          </div>
        </div>
      `;
    });

    const totalCount = feedbackArray.length;

    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
          display: flex; justify-content: center; padding: 40px 30px;
          font-family: -apple-system, sans-serif;
        }
        .feedback-container { max-width: 720px; width: 100%; display: flex; flex-direction: column; gap: 24px; }
        .header-card {
          background: white; border-radius: 24px; padding: 28px 32px;
          border: 1px solid rgba(59, 130, 246, 0.25); box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          position: relative; overflow: hidden;
        }
        .header-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: #3b82f6; }
        .header-title { display: flex; justify-content: space-between; align-items: center; }
        .title-left { font-size: 1.8rem; font-weight: 700; color: #1e3a8a; display: flex; align-items: center; gap: 12px; }
        .count-badge { background: #eff6ff; padding: 6px 16px; font-size: 0.9rem; color: #1e40af; border-radius: 40px; border: 1px solid #bfdbfe; }
        .feedback-card { background: white; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
        .card-number-badge { position: absolute; top: 16px; right: 20px; background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; color: #475569; }
        .card-header { padding: 24px; border-bottom: 1px solid #f0f2f5; }
        .group-info, .user-info { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f8fafc; border-radius: 16px; margin-bottom: 12px; }
        .group-avatar, .user-avatar { width: 40px; height: 40px; border-radius: 12px; object-fit: cover; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .user-avatar { border-radius: 50%; }
        .group-name, .user-name { font-weight: 700; color: #0f172a; }
        .group-id, .user-id { font-size: 0.7rem; color: #64748b; }
        .card-content { padding: 20px 24px; }
        .time-info { display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; padding: 6px 14px; border-radius: 20px; font-size: 0.7rem; color: #475569; margin-bottom: 16px; border: 1px solid #e2e8f0; }
        .content-wrapper { background: #fafcff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; }
        .content-label { background: #f8fafc; padding: 12px 16px; font-size: 0.75rem; font-weight: 600; color: #3b82f6; border-bottom: 1px solid #e2e8f0; }
        .feedback-text { padding: 16px 20px; font-size: 0.95rem; line-height: 1.6; color: #1e293b; white-space: pre-wrap; }
        .footer-note { text-align: center; padding: 16px; color: #64748b; font-size: 0.7rem; }
      </style>
    </head>
    <body>
      <div class="feedback-container">
        <div class="header-card">
          <div class="header-title">
            <div class="title-left"><span>📋</span><span>来自叼毛用户的反馈</span></div>
            <div class="count-badge">📊 ${totalCount} 条记录</div>
          </div>
        </div>
        ${cardsHtml}
        <div class="footer-note">感谢每一位用户的反馈 · 您的建议是我们进步的动力 ❤️</div>
      </div>
    </body>
    </html>`;
  }

  async clearFeedback(e) {
    if (!e.isMaster) {
      await e.reply('你不是主人，不可以清除反馈记录!');
      return;
    }
    const filePath = './data/feedback.json';
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      await e.reply('反馈记录已清除！');
    } else {
      await e.reply('反馈记录为空，无需清除！');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}