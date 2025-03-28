import plugin from '../../lib/plugins/plugin.js';
import { spawn, execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { segment } from 'oicq';

// 常量定义
const _path = process.cwd();
const COMIC_BASE_DIR = path.join(_path, 'resources', 'jmpdf');
const CONFIG_FILE = path.join(COMIC_BASE_DIR, 'option.yml');
const DEFAULT_CONFIG = {
  dir_rule: { base_dir: COMIC_BASE_DIR },
  plugins: {
    after_photo: [{
      plugin: "img2pdf",
      kwargs: { pdf_dir: COMIC_BASE_DIR, max_workers: 10, compress: true }
    }]
  }
};

// 配置常量
const IMAGE_SETTINGS = {
  maxPerMessage: 60,
  recallTime: 30,
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp']
};

const PDF_SETTINGS = {
  maxSizeWarning: 100 * 1024 * 1024 // 100MB
};

class ComicManager {
  static async init() {
    try {
      await fs.mkdir(COMIC_BASE_DIR, { recursive: true });
      
      try {
        await fs.access(CONFIG_FILE);
        logger.mark('配置文件已存在:', CONFIG_FILE);
      } catch {
        await fs.writeFile(CONFIG_FILE, yaml.stringify(DEFAULT_CONFIG), 'utf8');
        logger.mark('已创建默认配置文件:', CONFIG_FILE);
      }
    } catch (err) {
      logger.warn('初始化配置失败:', err);
      throw err;
    }
  }

  static async getFileSystemState() {
    const state = { dirs: [], pdfs: [] };
    
    try {
      const files = await fs.readdir(COMIC_BASE_DIR);
      
      for (const file of files) {
        const fullPath = path.join(COMIC_BASE_DIR, file);
        try {
          const stat = await fs.stat(fullPath);
          const item = { name: file, path: fullPath, ctime: stat.birthtimeMs, isDir: stat.isDirectory() };
          
          if (item.isDir) {
            state.dirs.push(item);
          } else if (path.extname(file).toLowerCase() === '.pdf') {
            state.pdfs.push(item);
          }
        } catch (err) {
          logger.warn(`访问 ${fullPath} 失败:`, err.message);
        }
      }
    } catch (err) {
      logger.error('读取目录失败:', err);
    }
    
    return state;
  }

  static findNewFiles(before, after, startTime) {
    return after.filter(afterItem => 
      afterItem.ctime >= startTime &&
      !before.some(beforeItem => beforeItem.name === afterItem.name)
    ).sort((a, b) => a.ctime - b.ctime);
  }

  static async safeRename(oldPath, newPath) {
    try {
      await fs.access(newPath);
      await fs.rm(newPath, { recursive: true, force: true });
    } catch (err) {
      logger.warn(`清理目标路径失败: ${newPath}`, err);
    }
    await fs.rename(oldPath, newPath);
  }

  static async getSortedImageFiles(dir) {
    try {
      const files = await fs.readdir(dir);
      return files
        .filter(file => IMAGE_SETTINGS.supportedFormats.includes(path.extname(file).toLowerCase()))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || 0);
          const numB = parseInt(b.match(/\d+/)?.[0] || 0);
          return numA - numB;
        })
        .map(file => path.join(dir, file));
    } catch (err) {
      logger.error('读取图片文件失败:', err);
      return [];
    }
  }

  static async dirExists(dir) {
    try {
      return (await fs.stat(dir)).isDirectory();
    } catch {
      return false;
    }
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 初始化配置
ComicManager.init().then(() => {
  logger.mark('配置初始化完成');
}).catch(err => {
  logger.warn('配置初始化出错:', err);
});

export class JMComicPlugin extends plugin {
  constructor() {
    super({
      name: 'JM漫画下载器',
      dsc: 'JM漫画下载与管理',
      event: 'message',
      priority: 5000,
      rule: [
        { reg: '^[#/]?jm(help|帮助)?$', fnc: 'help' },
        { reg: '^[#/]?jmd\\s*(\\d+)$', fnc: 'downloadOnly' },
        { reg: '^[#/]?jmp\\s*(\\d+)(?:\\s+(\\d+))?$', fnc: 'sendComicImages' },
        { reg: '^[#/]?jmf\\s*(\\d+)$', fnc: 'encryptAndUpload' },
        { reg: '^[#/]?清理jm$', fnc: 'cleanComicCache' }
      ]
    });
  }

  async help(e) {
    await e.reply([
      '📚 JM漫画下载器使用帮助',
      '⬇️ /jmd ID - 下载漫画',
      '🌅 /jmp ID - 发送漫画图片',
      '📄 /jmf ID - 上传漫画PDF',
      '🧹 /清理jm - 清理漫画缓存',
      '📌 注意: 发送图片功能仅限私聊使用',
      '💡 提示: 需要先安装qpdf用于PDF加密'
    ].join('\n'));
  }

  async downloadOnly(e) {
    const comicId = this.getComicId(e);
    if (!comicId) return e.reply('请输入正确的漫画ID');

    try {
      await e.reply(`⬇️ 开始下载漫画 ${comicId}...`);
      
      const beforeState = await ComicManager.getFileSystemState();
      const startTime = Date.now();
      
      await this.runDownloadCommand(comicId, e);
      
      const afterState = await ComicManager.getFileSystemState();
      const newPdfs = ComicManager.findNewFiles(beforeState.pdfs, afterState.pdfs, startTime);
      const newDirs = ComicManager.findNewFiles(beforeState.dirs, afterState.dirs, startTime);
      
      if (newPdfs.length === 0 || newDirs.length === 0) {
        return await e.reply('❌ 未检测到有效的新文件或文件夹');
      }

      const result = await this.matchAndRename(newPdfs, newDirs, e);
      await this.sendDownloadResult(e, comicId, newPdfs, newDirs, result);
    } catch (err) {
      await this.handleError(e, '下载出错:', err);
    }
  }

  async sendComicImages(e) {
    const comicId = this.getComicId(e);
    if (!comicId) return e.reply('请输入正确的漫画ID');

    try {
      const comicDir = path.join(COMIC_BASE_DIR, comicId);
      
      if (!(await ComicManager.dirExists(comicDir))) {
        return e.reply(`❌ 未找到漫画 ${comicId} 的文件夹`);
      }

      await e.reply(`📂 正在准备漫画 ${comicId} 的图片...`);
      const imageFiles = await ComicManager.getSortedImageFiles(comicDir);

      if (imageFiles.length === 0) {
        return e.reply('⚠️ 该文件夹中没有找到任何图片文件');
      }

      await this.sendImagesInBatches(e, comicId, imageFiles);
    } catch (err) {
      await this.handleError(e, '发送图片出错:', err);
    }
  }

  async encryptAndUpload(e) {
    const comicId = this.getComicId(e);
    if (!comicId) return e.reply('请输入正确的漫画ID');

    try {
      const originalPdf = await this.findOriginalPdf(comicId);
      if (!originalPdf) {
        return await e.reply([
          '❌ 未找到该漫画的原始PDF文件',
          `请确认存在 ${comicId}.pdf 文件`,
          '或使用命令重新下载：',
          `/jmd ${comicId}`
        ].join('\n'));
      }

      await e.reply('🔐 正在加密PDF文件...');
      const encryptedPdf = path.join(COMIC_BASE_DIR, `${comicId}_加密.pdf`);
      
      await this.encryptPdf(originalPdf, encryptedPdf, comicId);
      await this.uploadPdf(e, encryptedPdf, comicId);
    } catch (err) {
      await this.handleError(e, '加密上传出错:', err);
    }
  }

  async cleanComicCache(e) {
    try {
      await e.reply('⚠️ 正在安全清理漫画缓存（保留配置）...');
      
      if (!await ComicManager.dirExists(COMIC_BASE_DIR)) {
        return e.reply('✅ 漫画缓存目录不存在，无需清理');
      }

      const { deletedCount, keptCount, sizeMB } = await this.cleanDirectory();
      await this.sendCleanupResult(e, deletedCount, keptCount, sizeMB);
    } catch (err) {
      await this.handleError(e, '清理出错:', err);
    }
  }

  // ========== 辅助方法 ==========
  getComicId(e) {
    // 匹配所有命令格式: /jmd /jmp /jmf 后跟的数字ID
    const match = e.msg.match(/^[#/]?jm[dfp]?\s*(\d+)/);
    return match?.[1];
  }

  async matchAndRename(newPdfs, newDirs, e) {
    const result = { success: 0, failed: 0 };
    const minLength = Math.min(newPdfs.length, newDirs.length);
    
    for (let i = 0; i < minLength; i++) {
      const pdfName = path.basename(newPdfs[i].name, '.pdf');
      const dir = newDirs[i];
      const newPath = path.join(COMIC_BASE_DIR, pdfName);
      
      try {
        await ComicManager.safeRename(dir.path, newPath);
        await e.reply(`🔄 重命名成功: ${dir.name} → ${pdfName}`);
        result.success++;
      } catch (err) {
        await e.reply(`❗ 重命名失败: ${dir.name} → ${pdfName} (${err.message})`);
        result.failed++;
      }
    }
    
    if (newPdfs.length > newDirs.length) {
      await e.reply(`⚠️ 有 ${newPdfs.length - newDirs.length} 个PDF没有对应的文件夹`);
    } else if (newDirs.length > newPdfs.length) {
      await e.reply(`⚠️ 有 ${newDirs.length - newPdfs.length} 个文件夹没有对应的PDF`);
    }
    
    return result;
  }

  async sendDownloadResult(e, comicId, newPdfs, newDirs, result) {
    await e.reply([
      '✅ 下载标准化完成',
      `📄 检测到PDF: ${newPdfs.map(p => path.basename(p.name, '.pdf')).join(', ')}`,
      `📂 原文件夹: ${newDirs.map(d => d.name).join(', ')}`,
      `🔄 成功重命名: ${result.success}个`,
      `❌ 失败: ${result.failed}个`
    ].join('\n'));
  }

  async runDownloadCommand(comicId, e) {
    return new Promise((resolve, reject) => {
      const child = spawn('jmcomic', [comicId, `--option=${CONFIG_FILE}`]);

      child.stdout.on('data', data => {
        const msg = data.toString().trim();
        if (msg) logger.mark(`[下载日志] ${msg}`);
      });

      child.stderr.on('data', data => {
        const msg = data.toString().trim();
        if (msg) logger.error(`[下载错误] ${msg}`);
      });

      child.on('close', code => {
        code === 0 ? resolve() : reject(new Error(`下载失败，退出码: ${code}`));
      });

      child.on('error', reject);
    });
  }

  async sendImagesInBatches(e, comicId, imageFiles) {
    const comicTitle = `漫画 ${comicId}`;
    const totalPages = imageFiles.length;
    await e.reply(`📊 共找到 ${totalPages} 张图片，开始发送...`);

    const batches = [];
    for (let i = 0; i < imageFiles.length; i += IMAGE_SETTINGS.maxPerMessage) {
      batches.push(imageFiles.slice(i, i + IMAGE_SETTINGS.maxPerMessage));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      const messages = this.createImageMessages(batch, comicTitle, batchIndex, batches.length);
      const msgId = await this.sendForwardMessage(e, messages);
      
      if (IMAGE_SETTINGS.recallTime > 0) {
        this.scheduleRecall(e, msgId);
      }

      if (batchIndex < batches.length - 1) {
        await ComicManager.delay(2000);
      }
    }

    await e.reply(`✅ 漫画 ${comicId} 图片发送完成 (共 ${totalPages} 张)`);
  }

  createImageMessages(batch, comicTitle, batchIndex, totalBatches) {
    const messages = batch.map((file, idx) => ({
      type: 'node',
      data: {
        nickname: this.e.sender.nickname,
        user_id: this.e.user_id,
        content: [
         //  { type: 'text', data: { text: `📖 ${comicTitle} - 第 ${batchIndex * IMAGE_SETTINGS.maxPerMessage + idx + 1} 页` } },
          { type: 'image', data: { file: `file://${file}` } }
        ]
      }
    }));

    messages.unshift({
      type: 'node',
      data: {
        nickname: this.e.sender.nickname,
        user_id: this.e.user_id,
        content: [
          { type: 'text', data: { 
            text: `📚 ${comicTitle} (${batchIndex + 1}/${totalBatches}) - 本批 ${batch.length} 张` 
          } }
        ]
      }
    });

    return messages;
  }

  async sendForwardMessage(e, messages) {
    const forwardData = {
      type: 'node',
      data: {
        nickname: e.sender.nickname,
        user_id: e.user_id,
        content: messages
      }
    };

    return e.isGroup
      ? await e.bot.sendApi('send_group_forward_msg', { group_id: e.group_id, messages: forwardData })
      : await e.bot.sendApi('send_private_forward_msg', { user_id: e.user_id, messages: forwardData });
  }

  scheduleRecall(e, msgId) {
    setTimeout(async () => {
      try {
        e.isGroup
          ? await e.group.recallMsg(msgId.data.message_id)
          : await e.friend.recallMsg(msgId.data.message_id);
      } catch (err) {
        logger.error('撤回消息失败:', err);
      }
    }, IMAGE_SETTINGS.recallTime * 1000);
  }

  async findOriginalPdf(comicId) {
    try {
      const targetFile = `${comicId}.pdf`;
      const files = await fs.readdir(COMIC_BASE_DIR);
      
      for (const file of files) {
        if (file === targetFile) {
          return path.join(COMIC_BASE_DIR, file);
        }
      }
      return null;
    } catch (err) {
      logger.error('查找PDF失败:', err);
      return null;
    }
  }

async encryptPdf(inputPath, outputPath, password) {
    try {
        // 统一转换为绝对路径
        inputPath = path.resolve(inputPath);
        outputPath = path.resolve(outputPath);
        
        // Windows系统特殊处理
        if (process.platform === 'win32') {
            // 检查qpdf是否安装
            try {
                execSync('where qpdf', { stdio: 'ignore' });
            } catch {
                throw new Error('在Windows系统上未找到qpdf，请确保已安装并添加到PATH环境变量');
            }

            // Windows路径处理
            const winSafePath = (p) => {
                // 处理空格和特殊字符
                p = p.replace(/"/g, '\\"');
                // 统一使用双引号包裹路径
                return `"${p}"`;
            };

            const safeInput = winSafePath(inputPath);
            const safeOutput = winSafePath(outputPath);

            // Windows命令执行
            const encryptCmd = [
                'qpdf',
                '--encrypt', password, password, '256',
                '--', safeInput, safeOutput
            ].join(' ');

            execSync(encryptCmd, { 
                windowsHide: true, 
                stdio: 'ignore',
                shell: true // 在Windows上需要shell执行
            });

            // Windows验证命令
            const verifyCmd = [
                'qpdf',
                `--password=${password}`,
                '--decrypt',
                safeOutput,
                'NUL' // Windows的空设备
            ].join(' ');

            execSync(verifyCmd, { 
                windowsHide: true, 
                stdio: 'ignore',
                shell: true 
            });
        } 
        // Linux/macOS处理
        else {
            const escapePath = (p) => p.replace(/(\s+)/g, '\\$1');
            const safeInput = escapePath(inputPath);
            const safeOutput = escapePath(outputPath);

            execSync([
                'qpdf',
                '--encrypt', password, password, '256',
                '--', safeInput, safeOutput
            ].join(' '), { stdio: 'ignore' });

            execSync([
                'qpdf',
                `--password=${password}`,
                '--decrypt',
                safeOutput,
                '/dev/null'
            ].join(' '), { stdio: 'ignore' });
        }
        
        logger.mark(`PDF加密成功: ${outputPath}`);
    } catch (err) {
        let errorMsg = 'PDF加密失败: ';
        
        // Windows特定错误处理
        if (process.platform === 'win32') {
            if (err.code === 'ENOENT') {
                errorMsg += 'qpdf未安装或未添加到PATH环境变量';
            } else if (err.message.includes('permission denied')) {
                errorMsg += '文件权限不足，请以管理员身份运行';
            } else {
                errorMsg += err.message;
            }
        } 
        // 其他系统错误处理
        else {
            errorMsg += err.code === 'ENOENT' 
                ? '请确认已安装qpdf并添加到系统PATH环境变量'
                : err.message;
        }
        
        // 清理可能生成的不完整文件
        try {
            await fs.access(outputPath);
            await fs.unlink(outputPath);
        } catch (cleanErr) {
            logger.warn('清理加密失败文件时出错:', cleanErr);
        }
        
        throw new Error(errorMsg);
    }
}

  async uploadPdf(e, filePath, comicId) {
    await e.reply('☁️ 正在上传加密文件...');
    const fileSize = (await fs.stat(filePath)).size;
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    if (fileSize > PDF_SETTINGS.maxSizeWarning) {
      await e.reply('⚠️ 文件较大，上传可能需要较长时间...');
    }

    if (e.isGroup) {
      e.group?.sendFile 
        ? await e.group.sendFile(filePath)
        : await e.group.fs.upload(await fs.readFile(filePath), '/', path.basename(filePath));
    } else {
      await e.friend.sendFile(filePath);
    }

    await e.reply([
      '✅ 上传成功',
      `📄 文件名: ${path.basename(filePath)}`,
      `🔑 密码: ${comicId}`,
      `📏 大小: ${sizeMB}MB`
    ].join('\n'));
  }

  async cleanDirectory() {
    const items = await fs.readdir(COMIC_BASE_DIR);
    let deletedCount = 0, keptCount = 0, totalSize = 0;

    for (const item of items) {
      if (item === path.basename(CONFIG_FILE)) {
        keptCount++;
        continue;
      }

      const itemPath = path.join(COMIC_BASE_DIR, item);
      try {
        const stat = await fs.stat(itemPath);
        totalSize += stat.size;
        await fs.rm(itemPath, { recursive: true, force: true });
        deletedCount++;
        await ComicManager.delay(100);
      } catch (err) {
        logger.error(`删除 ${itemPath} 失败:`, err);
      }
    }

    return {
      deletedCount,
      keptCount,
      sizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  async sendCleanupResult(e, deletedCount, keptCount, sizeMB) {
    await e.reply([
      '✅ 安全清理完成',
      `🗑️ 删除项目: ${deletedCount}个`,
      `💾 保留配置: ${keptCount}个`,
      `🔓 释放空间: ${sizeMB}MB`,
      `⚙️ 配置已保留: ${path.basename(CONFIG_FILE)}`
    ].join('\n'));
  }

  async handleError(e, context, err) {
    await e.reply(`❌ 处理失败: ${err.message}`);
    logger.error(context, err);
  }
}
