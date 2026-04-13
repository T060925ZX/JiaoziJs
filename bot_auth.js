import plugin from '../../lib/plugins/plugin.js'
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'

/**
 * 授权插件配置
 * MASTER_BOT: 负责执行授权指令的机器人 QQ 号
 * AUTH_DATA_PATH: 授权数据存储路径
 */
const MASTER_BOT = '2660750139'
const AUTH_DATA_PATH = path.join(process.cwd(), 'data', 'bot_auth.json')

export class BotAuthPlugin extends plugin {
    constructor() {
        super({
            name: "Bot授权管理",
            dsc: "控制群组/用户使用期限，过期拦截消息",
            event: "message",
            priority: -Infinity, 
            rule: [
                {
                    /** 指令格式：#授权12345678:30 (授权群号:天数) */
                    reg: "^#授权\\d+:\\d+$",
                    fnc: "handleAuth",
                    permission: "master"
                },
                {
                    /** 指令格式：#授权本群30 (快速授权当前群:天数) */
                    reg: "^#授权本群\\d+$",
                    fnc: "handleAuthThisGroup",
                    permission: "master"
                },
                {
                    /** 指令格式：#查询授权 或 #授权查询 */
                    reg: "^#(查询授权|授权查询)$",
                    fnc: "queryAuth"
                },
                {
                    /** 保底拦截逻辑 */
                    reg: ".*",
                    fnc: "checkAuth",
                    log: false
                }
            ]
        })
        this.initData()
    }

    initData() {
        const dir = path.dirname(AUTH_DATA_PATH)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        if (!fs.existsSync(AUTH_DATA_PATH)) fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify({}))
    }

    getData() {
        try {
            return JSON.parse(fs.readFileSync(AUTH_DATA_PATH, 'utf8'))
        } catch (e) {
            return {}
        }
    }

    saveData(data) {
        fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(data, null, 4))
    }

    /** 处理指定 ID 授权指令 */
    async handleAuth(e) {
        if (String(this.e.bot.uin) !== MASTER_BOT) return false

        const match = e.msg.match(/^#授权(\d+):(\d+)$/)
        if (!match) return false

        const targetId = match[1]
        const days = parseInt(match[2])
        await this.applyAuth(e, targetId, days)
        return true
    }

    /** 处理授权本群指令 */
    async handleAuthThisGroup(e) {
        if (String(this.e.bot.uin) !== MASTER_BOT) return false
        if (!e.isGroup) {
            await e.reply("❌ 该指令仅限群聊使用")
            return true
        }

        const match = e.msg.match(/^#授权本群(\d+)$/)
        if (!match) return false

        const targetId = String(e.group_id)
        const days = parseInt(match[1])
        await this.applyAuth(e, targetId, days)
        return true
    }

    /** 核心授权逻辑抽离 */
    async applyAuth(e, targetId, days) {
        const data = this.getData()
        const now = Date.now()
        
        let startTime = now
        if (data[targetId] && data[targetId] > now) {
            startTime = data[targetId]
        }

        const expireTime = startTime + (days * 24 * 60 * 60 * 1000)
        data[targetId] = expireTime
        this.saveData(data)

        const expireStr = new Date(expireTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        await e.reply(`✅ 授权成功\n目标：${targetId}\n时长：+${days} 天\n到期时间：${expireStr}`)
    }

    /** 使用原生 Puppeteer 渲染 */
    async renderImage(html) {
        let browser = null
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            })
            const page = await browser.newPage()
            await page.setViewport({ width: 600, height: 1000, deviceScaleFactor: 2 })
            await page.setContent(html, { waitUntil: 'networkidle0' })
            
            const element = await page.$('.container')
            let base64 = ""
            
            if (element) {
                base64 = await element.screenshot({
                    encoding: 'base64',
                    type: 'png',
                    omitBackground: true
                })
            } else {
                base64 = await page.screenshot({
                    encoding: 'base64',
                    fullPage: true,
                    type: 'png'
                })
            }
            
            return base64
        } catch (err) {
            console.error('Puppeteer 渲染失败:', err)
            return null
        } finally {
            if (browser) await browser.close()
        }
    }

    async queryAuth(e) {
        const data = this.getData()
        const now = Date.now()
        let renderData = []

        if (e.isMaster) {
            for (let id in data) {
                const diff = data[id] - now
                renderData.push({
                    id,
                    isGroup: String(id).length > 7,
                    expireStr: new Date(data[id]).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
                    status: diff > 0 ? `剩余 ${Math.floor(diff / (24 * 3600 * 1000))} 天` : '已过期',
                    isExpired: diff <= 0
                })
            }
        } else {
            const targetId = e.isGroup ? String(e.group_id) : String(e.user_id)
            if (!data[targetId]) {
                await e.reply(`⚠️ 当前${e.isGroup ? '群聊' : '用户'}尚未获得授权。`)
                return true
            }
            const diff = data[targetId] - now
            renderData.push({
                id: targetId,
                isGroup: e.isGroup,
                expireStr: new Date(data[targetId]).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
                status: diff > 0 ? `${Math.floor(diff / (24 * 3600 * 1000))}天 ${Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000))}时` : '已过期',
                isExpired: diff <= 0
            })
        }

        if (renderData.length === 0) {
            await e.reply("暂无任何授权记录")
            return true
        }

        const html = this.getHtml(renderData, e.isMaster)
        const base64 = await this.renderImage(html)
        
        if (base64) {
            await e.reply(segment.image(`base64://${base64}`))
        } else {
            await e.reply("❌ 授权查询失败：浏览器渲染异常")
        }
        
        return true
    }

    async checkAuth(e) {
        if (e.isMaster) return false
        const targetId = e.isGroup ? String(e.group_id) : String(e.user_id)
        const data = this.getData()
        const now = Date.now()

        if (data[targetId] && now < data[targetId]) return false
        return true
    }

    getHtml(list, isMaster) {
        const itemsHtml = list.map(item => `
            <div class="card ${item.isExpired ? 'expired' : ''}">
                <div class="avatar-wrapper">
                    <img class="avatar" src="https://p.qlogo.cn/gh/${item.id}/${item.id}/640/" onerror="this.src='https://q1.qlogo.cn/g?b=qq&nk=${item.id}&s=640'">
                </div>
                <div class="info">
                    <div class="id-tag">
                        <span class="type-badge">${item.isGroup ? '群' : '友'}</span>
                        ${item.id}
                    </div>
                    <div class="expire-time">截止: ${item.expireStr}</div>
                </div>
                <div class="status-box">
                    <div class="status-tag">${item.status}</div>
                </div>
            </div>
        `).join('')

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
                    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
                    display: inline-block;
                    margin: 0;
                    padding: 30px;
                }
                .container {
                    width: 520px;
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    border-radius: 32px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                }
                .header {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 35px 20px;
                    text-align: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 26px; 
                    color: #0369a1; 
                    letter-spacing: 1px;
                    font-weight: 600;
                    text-shadow: 0 2px 4px rgba(255,255,255,0.5);
                }
                .list { padding: 20px; }
                .card {
                    display: flex;
                    align-items: center;
                    padding: 18px;
                    margin-bottom: 15px;
                    background: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.8);
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }
                .card.expired {
                    background: rgba(254, 242, 242, 0.4);
                    border-left: 6px solid #fca5a5;
                }
                .card:not(.expired) {
                    border-left: 6px solid #7dd3fc;
                }
                .avatar-wrapper {
                    position: relative;
                    margin-right: 18px;
                }
                .avatar {
                    width: 60px;
                    height: 60px;
                    border-radius: 18px;
                    border: 2px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .info { flex: 1; }
                .id-tag { 
                    font-weight: 600; 
                    color: #0c4a6e; 
                    font-size: 18px; 
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                }
                .type-badge {
                    font-size: 11px;
                    background: #bae6fd;
                    color: #0369a1;
                    padding: 2px 6px;
                    border-radius: 6px;
                    margin-right: 8px;
                    font-weight: bold;
                }
                .expire-time { color: #64748b; font-size: 13px; font-weight: 500; }
                .status-box { text-align: right; }
                .status-tag {
                    font-size: 12px;
                    padding: 6px 12px;
                    background: rgba(3, 105, 161, 0.1);
                    color: #0369a1;
                    border-radius: 12px;
                    font-weight: 600;
                    border: 1px solid rgba(3, 105, 161, 0.1);
                }
                .expired .status-tag {
                    background: rgba(220, 38, 38, 0.1);
                    color: #dc2626;
                    border-color: rgba(220, 38, 38, 0.1);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${isMaster ? '授权管理中心' : '授权详情'}</h1>
                </div>
                <div class="list">
                    ${itemsHtml}
                </div>
            </div>
        </body>
        </html>`
    }
}