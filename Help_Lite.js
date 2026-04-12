/**
 * @file 文件
 * @author Jiaozi
 * @version 1.2.1
 * @date 2026-04-12
 * @copyright Jiaozi © 2024-2026
 * @license MIT
 */

/** 
 * @description 可视化编辑网页：https://help.jiaozi.live/
 * 资源位置：Yunzai/resources/help-plugin
 */ 

/**
 * MIT License
 * 
 * Copyright (c) 2026 Jiaozi
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import plugin from '../../lib/plugins/plugin.js';
import { createRequire } from "module";
import { createHash } from 'crypto';
import PuppeteerRenderer from '../../renderers/puppeteer/lib/puppeteer.js';
import yaml from 'yaml';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);
const { execSync } = require("child_process");

const _path = process.cwd();
const RES_PATH = path.join(_path, 'resources', 'help-plugin');
const ICON_PATH = path.join(RES_PATH, 'icon');
const CONFIG_PATH = path.join(RES_PATH, 'config.yaml');
const HELP_PATH = path.join(RES_PATH, 'help.yaml');
const TEMP_DIR = path.join(_path, 'data', 'help-plugin-temp');

// 初始化渲染器
const renderer = new PuppeteerRenderer({
    headless: "new",
    args: ["--disable-gpu", "--disable-setuid-sandbox", "--no-sandbox", "--no-zygote", "--disable-dev-shm-usage"]
});

/**
 * 资源管理器：处理配置、图标下载及目录初始化
 */
class ResourceManager {
    constructor() {
        this.initDirs();
        this.initConfig();
        this.initIcons();
    }

    initDirs() {
        [RES_PATH, ICON_PATH, TEMP_DIR].forEach(p => {
            if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
        });
    }

    initConfig() {
        if (!fs.existsSync(CONFIG_PATH)) {
            const defaultCfg = {
                main_title: 'YUNZAI BOT',
                sub_title: 'COMMAND MENU',
                theme: 'auto', 
                device_scale_factor: 1.2,
                default_hitokoto: "", // 留空则从 API 获取
                background_image_url: '' // 背景图片 URL
            };
            fs.writeFileSync(CONFIG_PATH, yaml.stringify(defaultCfg), 'utf8');
        }
        // 初始化一个示例帮助菜单
        if (!fs.existsSync(HELP_PATH)) {
            const defaultHelp = [
                {
                    group: '基础命令',
                    list: [
                        { icon: 'help', title: '#帮助', desc: '查看指令菜单' },
                        { icon: 'update', title: '#全部更新', desc: '更新所有插件' }
                    ]
                }
            ];
            fs.writeFileSync(HELP_PATH, yaml.stringify(defaultHelp), 'utf8');
        }
    }

    /**
     * 检测网络环境
     * @returns {boolean} true 为海外网络，false 为国内网络
     */
    isGlobal() {
        try {
            // 通过 ping google 来判断网络
            const cmd = process.platform === 'win32' ? 'ping -n 1 -w 2000 google.com' : 'ping -c 1 -W 2 google.com';
            execSync(cmd, { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 自动初始化图标库
     */
    initIcons() {
        if (!fs.existsSync(path.join(ICON_PATH, 'logo.png'))) {
            const isGlobal = this.isGlobal();
            const repoUrl = isGlobal 
                ? 'https://github.com/T060925ZX/Help_Icon.git' 
                : 'https://gitee.com/T060925ZX/help-plugin-icon.git';
            
            console.log(`[Help-Plugin] 检测到网络环境: ${isGlobal ? '海外' : '国内'}, 正在下载图标源...`);
            
            try {
                const tempIconPath = `${ICON_PATH}_temp`;
                if (fs.existsSync(tempIconPath)) fs.rmSync(tempIconPath, { recursive: true, force: true });
                
                // 执行克隆
                execSync(`git clone --depth=1 ${repoUrl} ${tempIconPath}`, { stdio: 'inherit' });
                
                // 递归移动文件
                const copyRecursive = (src, dest) => {
                    if (fs.statSync(src).isDirectory()) {
                        if (!fs.existsSync(dest)) fs.mkdirSync(dest);
                        fs.readdirSync(src).forEach(file => copyRecursive(path.join(src, file), path.join(dest, file)));
                    } else {
                        fs.copyFileSync(src, dest);
                    }
                };

                fs.readdirSync(tempIconPath).forEach(file => {
                    if (file === '.git') return;
                    copyRecursive(path.join(tempIconPath, file), path.join(ICON_PATH, file));
                });
                
                // 清理临时文件
                fs.rmSync(tempIconPath, { recursive: true, force: true });
                console.log(`[Help-Plugin] 图标资源初始化成功！`);
            } catch (error) {
                console.error(`[Help-Plugin] 图标下载失败: ${error.message}`);
                console.log(`[Help-Plugin] 请尝试手动下载图标包放入 ${ICON_PATH}`);
            }
        }
    }

    getConfig() {
        try { return yaml.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch (e) { return {}; }
    }

    getHelpData() {
        try { 
            if (!fs.existsSync(HELP_PATH)) return [];
            return yaml.parse(fs.readFileSync(HELP_PATH, 'utf8')); 
        } catch (e) { return []; }
    }

    getFileHash(filePath) {
        if (!fs.existsSync(filePath)) return '';
        try {
            return createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
        } catch (e) {
            return '';
        }
    }
}

const resources = new ResourceManager();

/**
 * 核心渲染函数
 */
const renderHelpImage = async () => {
    const cfg = resources.getConfig();
    const helpData = resources.getHelpData();
    
    // 主题色判断
    let isNight = false;
    const theme = cfg.theme || 'auto';
    if (theme === 'dark') isNight = true;
    else if (theme === 'light') isNight = false;
    else {
        const hour = new Date().getHours();
        isNight = hour < 6 || hour > 18;
    }

    // 获取一言
    let hitokoto = cfg.default_hitokoto;
    if (!hitokoto) {
        try {
            const response = await fetch('https://v1.hitokoto.cn/?encode=json', { timeout: 2000 });
            if (response.ok) {
                const data = await response.json();
                hitokoto = data.hitokoto || "追求卓越，成功就会在不经意间追上你";
            }
        } catch (e) {
            hitokoto = "追求卓越，成功就会在不经意间追上你";
        }
    }

    const hasBg = !!cfg.background_image_url;
    const bodyWidth = 1200;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-cn">
    <head>
        <meta charset="utf-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
            body { 
                width: ${bodyWidth}px; padding: 60px 40px; display: flex; justify-content: center; min-height: 100vh;
                background-image: ${hasBg ? `url('${cfg.background_image_url}')` : 'none'};
                background-color: ${isNight ? '#0f172a' : '#f4f7f9'};
                background-size: cover; background-position: center; background-attachment: fixed;
            }
            .container { 
                width: 100%; padding: 50px; border-radius: 40px; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3);
                background: ${isNight ? (hasBg ? 'rgba(15, 23, 42, 0.75)' : 'rgba(30, 41, 59, 0.95)') : (hasBg ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.95)')}; 
                border: 1px solid ${isNight ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'};
                backdrop-filter: blur(${hasBg ? '25px' : '10px'}) saturate(160%);
                -webkit-backdrop-filter: blur(${hasBg ? '25px' : '10px'}) saturate(160%);
            }
            .header { margin-bottom: 40px; border-left: 8px solid #3b82f6; padding-left: 20px; }
            .header h1 { font-size: 54px; color: ${isNight ? '#f8fafc' : '#1e293b'}; font-weight: 800; letter-spacing: -2px; }
            .header p { font-size: 18px; color: #3b82f6; text-transform: uppercase; letter-spacing: 6px; font-weight: bold; }
            .group-box { margin-top: 45px; }
            .group-label { font-size: 15px; font-weight: 800; color: #3b82f6; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; }
            .group-label::after { content: ""; flex: 1; height: 1px; background: ${isNight ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)'}; margin-left: 15px; }
            .list { display: flex; flex-wrap: wrap; gap: 15px; }
            .item { width: calc(33.33% - 10px); display: flex; align-items: center; padding: 16px 20px; border-radius: 20px; background: ${isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}; border: 1px solid ${isNight ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}; }
            .icon { width: 38px; height: 38px; margin-right: 18px; flex-shrink: 0; filter: ${isNight ? 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}; }
            .info { flex: 1; overflow: hidden; }
            .title-text { font-size: 17px; font-weight: 700; color: ${isNight ? '#f1f5f9' : '#334155'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .desc-text { font-size: 13px; color: ${isNight ? '#94a3b8' : '#64748b'}; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .footer { margin-top: 60px; text-align: center; font-size: 14px; color: ${isNight ? '#64748b' : '#94a3b8'}; font-style: italic; border-top: 1px solid ${isNight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; padding-top: 25px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <p>${cfg.sub_title}</p>
                <h1>${cfg.main_title}</h1>
            </div>
            ${helpData.map(group => `
                <div class="group-box">
                    <div class="group-label">${group.group}</div>
                    <div class="list">
                        ${group.list.map(item => `
                            <div class="item">
                                <img class="icon" src="file://${path.join(ICON_PATH, item.icon + '.png')}" onerror="this.src='file://${path.join(ICON_PATH, 'logo.png')}'">
                                <div class="info">
                                    <div class="title-text">${item.title}</div>
                                    <div class="desc-text">${item.desc}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            <div class="footer">${hitokoto}</div>
        </div>
    </body>
    </html>
    `;

    const htmlPath = path.join(TEMP_DIR, 'help_temp.html');
    fs.writeFileSync(htmlPath, htmlContent);

    try {
        const result = await renderer.screenshot('help-plugin', {
            tplFile: htmlPath,
            imgType: 'jpeg',
            quality: 100,
            setViewport: { deviceScaleFactor: cfg.device_scale_factor || 1.2 }
        });

        if (result) {
            fs.writeFileSync(path.join(TEMP_DIR, 'help.jpg'), result);
            return result;
        }
    } catch (e) {
        console.error("[Help-Plugin] 渲染出错:", e);
    }
    return null;
};

export class HelpPlugin extends plugin {
    constructor() {
        super({
            name: 'Help_Lite_Pro',
            dsc: '高端极简宽屏版帮助',
            event: 'message',
            priority: 5,
            rule: [
                { reg: '^(#|/)?(帮助|菜单|help)$', fnc: 'showHelp' },
                { reg: '^(#|/)?(刷新|重载|重置)帮助$', fnc: 'refreshHelp' }
            ]
        });
        this.autoCheckUpdate();
    }

    /**
     * 自动检测更新，对比配置和数据的 Hash，决定是否重新渲染
     */
    async autoCheckUpdate() {
        const cfg = resources.getConfig();
        // 如果开启了一言自动刷新，则每小时更换一次缓存
        const hitokotoSuffix = !cfg.default_hitokoto ? new Date().getHours() : '';
        const currentHash = `${resources.getFileHash(CONFIG_PATH)}-${resources.getFileHash(HELP_PATH)}-${cfg.theme}-${cfg.background_image_url}-${hitokotoSuffix}`;
        const savedHashPath = path.join(TEMP_DIR, 'cache.hash');
        const savedHash = fs.existsSync(savedHashPath) ? fs.readFileSync(savedHashPath, 'utf8') : '';

        if (currentHash !== savedHash || !fs.existsSync(path.join(TEMP_DIR, 'help.jpg'))) {
            await renderHelpImage();
            fs.writeFileSync(savedHashPath, currentHash);
        }
    }

    async showHelp(e) {
        const imgPath = path.join(TEMP_DIR, 'help.jpg');
        // 如果文件不存在则触发渲染
        if (!fs.existsSync(imgPath)) {
            await renderHelpImage();
        }
        
        if (fs.existsSync(imgPath)) {
            return await e.reply(segment.image(`file://${imgPath}`));
        }
        return await e.reply("帮助生成失败，请检查控制台报错信息。");
    }

    async refreshHelp(e) {
        await e.reply("少女祈祷中...");
        const result = await renderHelpImage();
        if (result) {
            await e.reply(segment.image(result));
        } else {
            await e.reply("刷新失败。");
        }
        return true;
    }
}