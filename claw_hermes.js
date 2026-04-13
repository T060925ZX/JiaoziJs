import plugin from '../../lib/plugins/plugin.js'
import { exec, execSync } from 'child_process'

const ALLOWED_USERS = [1602833550]

/**
 * 移除字符串中的所有 Markdown 语法标记
 * @param {string} text 
 */
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, '')) // 处理代码块但保留内容
    .replace(/[*_~`#]/g, '') // 移除加粗、斜体、删除线、行内代码、标题号
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 将链接 [text](url) 替换为 text
}

export class OpenClawSimple extends plugin {
  constructor () {
    super({
      name: 'OpenClaw & Hermes 控制',
      dsc: '本地 OpenClaw 及 Hermes Agent 控制',
      event: 'message',
      priority: 500,
      rule: [
        {
          reg: '^claw[\\s\\S]*',
          fnc: 'runClaw'
        },
        {
          reg: '^hermes[\\s\\S]*',
          fnc: 'runHermes'
        }
      ]
    })
    
    this.hermesPath = this.detectHermesPath()
  }

  /**
   * 自动检测 hermes 路径
   */
  detectHermesPath() {
    try {
      // 1. 尝试使用 which 查找
      const path = execSync('which hermes', { encoding: 'utf8' }).trim()
      if (path) {
        logger.mark(`[Hermes] 自动定位路径成功: ${path}`)
        return path
      }
    } catch (e) {
      // 2. 如果 which 失败，尝试预设的常见路径
      const commonPaths = [
        '/root/.local/bin/hermes',
        '/usr/local/bin/hermes',
        '/usr/bin/hermes'
      ]
      for (const p of commonPaths) {
        try {
          execSync(`test -x ${p}`)
          logger.mark(`[Hermes] 兜底定位路径成功: ${p}`)
          return p
        } catch (err) {
          continue
        }
      }
    }
    logger.error('[Hermes] 未能自动定位 hermes 路径，将尝试直接调用')
    return 'hermes'
  }

  /**
   * 原有 OpenClaw 逻辑
   */
  async runClaw(e) {
    if (!ALLOWED_USERS.includes(e.user_id)) {
      return e.reply('你没有权限使用此功能')
    }

    const command = e.msg.replace(/^claw\s*/, '').trim()
    if (!command) {
      return e.reply('请告诉我需要执行什么指令')
    }

    logger.mark(`[OpenClaw] 用户 ${e.user_id} 执行指令: ${command}`)

    exec(`/usr/bin/openclaw agent --agent main --message "${command}"`, {
      encoding: 'utf8'
    }, (err, stdout) => {
      if (err) {
        logger.error(`[OpenClaw] 执行失败:`, err)
        return e.reply(`执行失败: ${err.message}`)
      }
      const result = stdout.trim()
      e.reply(result || '执行完成，无输出')
    })
  }

  /**
   * 新增 Hermes 指令处理
   */
  async runHermes(e) {
    if (!ALLOWED_USERS.includes(e.user_id)) {
      return e.reply('你没有权限使用此功能')
    }

    const userInput = e.msg.replace(/^hermes\s*/, '').trim()
    if (!userInput) {
      return e.reply('请输入需要询问 Hermes 的内容')
    }

    // 重新检测一次路径（防止环境变动）
    const executePath = this.hermesPath || this.detectHermesPath()

    // 拼接提示词：明确要求不使用 markdown
    const finalQuery = `${userInput} (请直接回答内容，严禁使用任何Markdown格式符号，如代码块、加粗、星号等)`
    
    logger.mark(`[Hermes] 用户 ${e.user_id} 使用路径 ${executePath} 发起查询: ${userInput}`)

    const options = {
      encoding: 'utf8',
      env: { 
        ...process.env, 
        TERM: 'dumb',
        PATH: process.env.PATH + ':/usr/local/bin:/root/.local/bin:/root/bin' 
      }
    }

    exec(`${executePath} chat --query "${finalQuery.replace(/"/g, '\\"')}"`, options, (err, stdout) => {
      if (err) {
        logger.error(`[Hermes] 执行失败:`, err)
        return e.reply(`Hermes 响应失败: ${err.message}`)
      }

      // 1. 移除 ANSI 颜色代码
      let fullOutput = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')

      // 2. 提取有效回复内容
      let result = fullOutput
      if (result.includes('╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯')) {
          const parts = result.split(/╰─+╯|╰─+─╯/)
          result = parts[parts.length - 1] || result
      }

      if (result.includes('╭─ ⚕ Hermes')) {
          const lines = result.split('\n')
          let capturing = false
          let capturedLines = []
          for (let line of lines) {
              if (line.includes('╭─ ⚕ Hermes')) {
                  capturing = true
                  continue
              }
              if (capturing && (line.includes('╰─') || line.includes('Session:'))) {
                  break
              }
              if (capturing) {
                  capturedLines.push(line.trim())
              }
          }
          result = capturedLines.join('\n').trim()
      }

      if (result.includes('Session:')) {
        result = result.split('Session:')[0].trim()
      }
      
      const cleanResult = stripMarkdown(result)

      logger.mark(`[Hermes] 成功返回，长度: ${cleanResult.length}`)
      e.reply(cleanResult || 'Hermes 执行完成，但未能提取到有效回复文字')
    })
  }
}