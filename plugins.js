import plugin from '../../lib/plugins/plugin.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { exec } = require("child_process");
import fetch from "node-fetch";
import fs from 'fs'

//插件列表API
let plugins_list_url = `https://raw.githubusercontent.com/T060925ZX/JiaoziJs/refs/heads/main/plugins_list_new.json`;

const filePath = 'plugins/example/up.js';
const url = 'https://gitee.com/tu-zhengxiong0925/JiaoziJS/raw/main/JavaScript/update.js';
const update = 'https://gitee.com/tu-zhengxiong0925/JiaoziJS/raw/main/JavaScript/update.js';

fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
        console.log('文件不存在，正在下载...');
        const curlCommand = `curl -o ${filePath} ${url}`;
        exec(curlCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行curl命令出错: ${error}`);
            }
            console.log('下载完成:', stdout);
        });
    } else {
        return false;
    }
});

/**
 * 作者：千奈千祁(2632139786)
 * Gitee主页：Gitee.com/QianNQQ
 * Github主页：Github.com/QianNQQ
 * 
 * 二改：Jiaozi饺子(1602833550)
 */

export class example2 extends plugin {
    constructor () {
      super({
        name: '插件管理器',
        dsc: '插件管理器@Jiaozi',
        event: 'message',
        priority: -1,
        rule: [
          {
            reg: '^#更新up(.*)$',
            fnc: 'update'
          },{
            reg: '^#插件帮助$',
            fnc: '插件帮助'
          },{
            reg: '^#搜索插件(.*)$',
            fnc: '搜索插件'
          },{
            reg: '^#插件(列表|市场|大全)$',
            fnc: '插件列表'
          },{
            reg: '^#安装插件(.*)$',
            fnc: '安装插件'
          },{
            reg: '^#安装依赖(.*)$',
            fnc: '安装依赖'
          },{
            reg: '^#(删除|卸载)插件(.*)$',
            fnc: '卸载插件'
          },{
            reg: '^#已安装插件(列表)?$',
            fnc: '已安装插件'
          },{
            reg: '^#(.*)插件(列表|市场|大全)',
            fnc: '插件分类'
          },{
            reg: '^#安装(JS|Js|js)插件(.*)$',
            fnc: 'JS安装插件'
          },{
            reg: '^#(删除|卸载)(JS|Js|js)插件(.*)$',
            fnc: 'JS卸载插件'
          },{
            reg: '^#?已安装(JS|Js|js)插件(列表)?$',
            fnc: 'JS已安装插件'
          }
        ]
      })
    }

    async 插件帮助(e) {
  const helpMessage = `———插件帮助———
# (分类)插件列表
# 安装(js)插件[插件名]
# 卸载(js)插件[插件名]
# 已安装(js)插件
# 更新插件安装器
# 搜索插件[关键词]
# 安装依赖[插件名]
分类：推荐 功能 游戏 文游 JS
>> (选填) [必填]
>>插件管理器 v2.3.5`;

  return e.reply(helpMessage, { quto: true });
    }

    async 已安装插件(e) {
      if(!e.isMaster) return false
      let files
      try {
        files = fs.readdirSync(`./plugins`, { withFileTypes: true });
      } catch(err) {
        await e.reply(`获取PathName时出错！\n${err.message}`)
        return true
      }
      let directories = files.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
      let local_plugins_list = []
      for (let item of directories) {
        if(item !== `example` && item !== `genshin` && item !== `system` && item !== `other`) {
          local_plugins_list.push(item)
        }
      }
      let cloud_plugins_list = []
      try {
        cloud_plugins_list = await fetch(plugins_list_url)
        cloud_plugins_list = await cloud_plugins_list.json()
      } catch(err) {
        await e.reply(`获取在线插件列表失败！\n${err.message}`)
        cloud_plugins_list = {}
      }
      let local_plugins_list_msg = []
      for (let litem of local_plugins_list) {
        local_plugins_list_msg.push(await lplm(cloud_plugins_list, litem))
      }
      let msgList = []
      for (let item of local_plugins_list_msg) {
        let msgList_ = 
`插件名称:${item.pluginname}
作者:${item.author}
简介:${item.describe}
插件链接:${item.url}
卸载指令:#卸载插件${item.pathname}`
        msgList.push({
          user_id: Bot.uin,
          message: msgList_
        }) 
      }
      let msg;
      try {
        msg = await e.group.makeForwardMsg(msgList)
      } catch {
        msg = await e.friend.makeForwardMsg(msgList)
      }
      await e.reply(msg)
      return true
    }
    async 卸载插件(e) {
        if(!e.isMaster) return false
        let plugin_pathname = e.msg.match(/^#(删除|卸载)插件(.*)$/)[2]
        if(!plugin_pathname) {
          await e.reply(`要卸载的插件名为空！`)
          return true
        }
        if(!fs.existsSync(`./plugins/${plugin_pathname}`)) {
          await e.reply(`要卸载的插件不存在！`)
          return true
        }
        if(plugin_pathname == `miao-plugin` || plugin_pathname == `genshin` || plugin_pathname == `system` || plugin_pathname == `example` || plugin_pathname == `other`) {
          await e.reply(`系统组件不支持卸载`)
          return true
        }
        try {
          fs.rmSync(`./plugins/${plugin_pathname}`, { recursive: true, force: true })
        } catch(err) {
          await e.reply(`插件卸载失败！\n${err.message}`)
          return true
        }
        await e.reply(`插件卸载成功！`)
        return true
    }
    async 安装插件(e){
        if(!e.isMaster) return false
        let commsg = e.msg.match(/^#安装插件(.*)$/)
        let plugin_name = commsg[1]
        if(fs.existsSync(`./plugins/${plugin_name}`)) {
          await e.reply(`该插件已经安装了`)
          return true
        }
        let plugins_list = await fetch(plugins_list_url)
        plugins_list = await plugins_list.json()
        let plugin_onoff = []
        for(let item of plugins_list) {
            if(item.pathname == plugin_name) {
                plugin_onoff.push(item)
            }
        }
        if(plugin_onoff.length == 0) {
            await e.reply(`插件不存在！`)
            return true
        }
        await e.reply(`已搜索到插件，正在安装中……`)
        let com
        if(plugin_onoff[0].url.includes(`github`)) {
            com = `git clone --depth=1 https://ghp.ci/${plugin_onoff[0].url}.git ./plugins/${plugin_onoff[0].pathname}/`
        } else {
            com = `git clone --depth=1 ${plugin_onoff[0].url}.git ./plugins/${plugin_onoff[0].pathname}/`
        }
        let com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`安装时出现错误！\n${com_result.error.message}`)
            return true
        }
        await e.reply(`插件下载完成！正在安装依赖……`)
        com = `cd ./plugins/${plugin_onoff[0].pathname}&& pnpm i --registry=https://registry.npmmirror.com`
        com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`安装依赖时出现错误！\n${com_result.stdout}`)
            console.log(com_result)
        }
        await e.reply(`插件安装成功！重启后生效`)
    }
    async 插件列表(e) {
      if (!e.isMaster) return false;
  
      let plugins_list = await fetch(plugins_list_url);
      plugins_list = await plugins_list.json();
  
      let msgList = [];
      for (let item of plugins_list) {
          // 根据 item.type 判断安装指令格式
          let installCommand = item.type === 'JS' ? `#安装js插件${item.pathname}` : `#安装插件${item.pathname}`;
  
          let msg = `插件类型: ${item.type}\n插件目录: ${item.pathname}\n插件名称: ${item.pluginname}\n作者: ${item.author}\n简介: ${item.describe}\n插件链接: ${item.url}\n安装指令: ${installCommand}`;
          msgList.push({
              user_id: e.self_id,
              message: msg
          });
  
          // 每100条消息转发一次
          if (msgList.length >= 150) {
              let msg;
              try {
                  msg = await e.group.makeForwardMsg(msgList);
              } catch {
                  msg = await e.friend.makeForwardMsg(msgList);
              }
              await e.reply(msg);
              // 清空消息列表
              msgList = [];
          }
      }
  
      // 处理剩余的消息
      if (msgList.length > 0) {
          let msg;
          try {
              msg = await e.group.makeForwardMsg(msgList);
          } catch {
              msg = await e.friend.makeForwardMsg(msgList);
          }
          await e.reply(msg);
      }
  
      return true;
  }

  async 插件分类(e) {
    if (!e.isMaster) return false;

    const keyword = e.msg.match(/^#(.*)插件(列表|市场|大全)/)[1].trim();
    if (!keyword) {
        await e.reply("请提供搜索关键词");
        return true;
    }

    let plugins_list;
    try {
        plugins_list = await fetch(plugins_list_url).then(res => res.json());
    } catch (err) {
        await e.reply(`获取在线插件列表失败！\n${err.message}`);
        return true;
    }

    const searchResults = plugins_list.filter(plugin => 
        plugin.type.toLowerCase().includes(keyword.toLowerCase())
    );

    if (searchResults.length === 0) {
        await e.reply("没有找到相关的插件");
        return true;
    }

    let msgList = [];
    let allMsgs = [];
    for (let item of searchResults) {
        // 根据 item.type 判断安装指令格式
        let installCommand = item.type === 'JS' ? `#安装js插件${item.pathname}` : `#安装插件${item.pathname}`;
        let msgList_ = 
`插件类型: ${item.type}
插件目录: ${item.pathname}
插件名称: ${item.pluginname}
作者: ${item.author}
简介: ${item.describe}
插件链接: ${item.url}
安装指令: ${installCommand}`;

        msgList.push({
            user_id: e.self_id, 
            message: msgList_,
            type: 'node' 
        });

        // 每100条消息转发一次
        if (msgList.length >= 150) {
            allMsgs.push(msgList);
            msgList = [];
        }
    }

    // 处理剩余的消息
    if (msgList.length > 0) {
        allMsgs.push(msgList);
    }

    // 发送所有消息
    for (let batch of allMsgs) {
        let msg;
        try {
            msg = await e.group.makeForwardMsg(batch);
            if (!msg) {
                msg = await e.friend.makeForwardMsg(batch);
            }
        } catch (err) {
            await e.reply(`转发消息时出错: ${err.message}`);
            return true;
        }
        await e.reply(msg);
    }

    return true;
}


async 搜索插件(e) {
  if (!e.isMaster) return false;

  const keyword = (e.msg.match(/^#搜索插件(.*)/) || [])[1]?.trim() || '';
  if (!keyword) {
      await e.reply("请提供搜索关键词。");
      return true;
  }

  let plugins_list;
  try {
      plugins_list = await fetch(plugins_list_url).then(res => res.json());
  } catch (err) {
      await e.reply(`获取在线插件列表失败！\n${err.message}`);
      return true;
  }

  const searchResults = plugins_list.filter(plugin => {
      const pluginName = plugin.pluginname?.toLowerCase() || '';
      const author = plugin.author?.toLowerCase() || '';
      const describe = plugin.describe?.toLowerCase() || '';
      const pathname = plugin.pathname?.toLowerCase() || '';
      const lowerKeyword = keyword.toLowerCase();

      return pluginName.includes(lowerKeyword) ||
             author.includes(lowerKeyword) ||
             describe.includes(lowerKeyword) ||
             pathname.includes(lowerKeyword);
  });

  if (searchResults.length === 0) {
      await e.reply("没有找到相关的插件。");
      return true;
  }

  let msgList = [];
  let allMsgs = [];
  for (let item of searchResults) {
    let installCommand = item.type === 'JS' ? `#安装js插件${item.pathname}` : `#安装插件${item.pathname}`;
      let msgList_ = 
`插件类型: ${item.type || '未知'}
插件名称: ${item.pluginname || '未知'}
作者: ${item.author || '未知'}
简介: ${item.describe || '无'}
插件链接: ${item.url || '无'}
安装指令: ${installCommand}`;

      msgList.push({
          user_id: e.self_id, 
          message: msgList_,
          type: 'node' 
      });

      // 每100条消息转发一次
      if (msgList.length >= 150) {
          allMsgs.push(msgList);
          msgList = [];
      }
  }

  // 处理剩余的消息
  if (msgList.length > 0) {
      allMsgs.push(msgList);
  }

  // 发送所有消息
  for (let batch of allMsgs) {
      let msg;
      try {
          msg = await e.group.makeForwardMsg(batch);
          if (!msg) {
              msg = await e.friend.makeForwardMsg(batch);
          }
      } catch (err) {
          await e.reply(`转发消息时出错: ${err.message}`);
          return true;
      }
      await e.reply(msg);
  }

  return true;
}


    async JS已安装插件(e) {
      if (!e.isMaster) return false;
      let files;
      try {
        files = fs.readdirSync(`./plugins/example`, { withFileTypes: true });
      } catch (err) {
        await e.reply(`获取PathName时出错！\n${err.message}`);
        return true;
      }
      let jsFiles = files.filter(dirent => dirent.isFile() && dirent.name.endsWith('.js')).map(dirent => dirent.name);
      let local_plugins_list = jsFiles.map(file => file.replace('.js', ''));
      let cloud_plugins_list = [];
      try {
        cloud_plugins_list = await fetch(plugins_list_url)
        cloud_plugins_list = await cloud_plugins_list.json();
      } catch (err) {
        await e.reply(`获取在线插件列表失败！\n${err.message}`);
        cloud_plugins_list = {};
      }
      let local_plugins_list_msg = [];
      for (let litem of local_plugins_list) {
        local_plugins_list_msg.push(await lplm(cloud_plugins_list, litem));
      }
      let msgList = [];
      for (let item of local_plugins_list_msg) {
        let msgList_ = 
`插件名称:${item.pluginname}
作者:${item.author}
简介:${item.describe}
插件链接:${item.url}
卸载指令:#卸载js插件${item.pathname}`;
        msgList.push({
          user_id: Bot.uin,
          message: msgList_
        }); 
      }
      let msg;
      try {
        msg = await e.group.makeForwardMsg(msgList);
      } catch {
        msg = await e.friend.makeForwardMsg(msgList);
      }
      await e.reply(msg);
      return true;
    }


    async JS卸载插件(e) {
        if(!e.isMaster) return false
        let plugin_pathname = e.msg.match(/^#(删除|卸载)(JS|Js|js)插件(.*)$/)[3]
        if(!plugin_pathname) {
          await e.reply(`要卸载的插件名为空！`)
          return true
        }
        if(!fs.existsSync(`./plugins/example/${plugin_pathname}.js`)) {
          await e.reply(`要卸载的插件不存在！`)
          return true
        }

      if (plugin_pathname == `miao-plugin` || plugin_pathname == `genshin` || plugin_pathname == `system` || plugin_pathname == `example` || plugin_pathname == `other`) {
        await e.reply(`系统组件不支持卸载`);
        return true;
      }
      try {
        fs.rmSync(`./plugins/example/${plugin_pathname}.js`, { recursive: true, force: true });
      } catch (err) {
        await e.reply(`插件卸载失败！\n${err.message}`);
        return true;
      }
      await e.reply(`插件卸载成功！`);
      return true;
    }

    async JS安装插件(e){
        if(!e.isMaster) return false
        let commsg = e.msg.match(/^#安装(JS|Js|js)插件(.*)$/)
        let plugin_name = commsg[2]
        if(fs.existsSync(`./plugins/example/${plugin_name}.js`)) {
          await e.reply(`该插件已经安装了`)
          return true
        }
        let plugins_list = await fetch(plugins_list_url)
        plugins_list = await plugins_list.json()
        let plugin_onoff = []
        for(let item of plugins_list) {
            if(item.pathname == plugin_name) {
                plugin_onoff.push(item)
            }
        }
        if(plugin_onoff.length == 0) {
            await e.reply(`插件不存在！`)
            return true
        }
        await e.reply(`已搜索到插件，正在安装中……`)
        let com
        if(plugin_onoff[0].url.includes(`github`)) {
            com = `curl -o ./plugins/example/${plugin_onoff[0].pathname}.js ${plugin_onoff[0].url}`
        } else {
            com = `curl -o ./plugins/example/${plugin_onoff[0].pathname}.js ${plugin_onoff[0].url}`
        }
        let com_result = await this.execSyncc(com, { encoding: 'buffer' })
        if(com_result.error) {
            await e.reply(`安装时出现错误！\n${com_result.error.message}`)
            return true
        }
        await e.reply(`插件安装成功！重启后生效`)
    }
    async execSyncc(cmd) {
      return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
          resolve({ error, stdout, stderr });
        });
      });
    }
    async update(e) {
      let plugin_name = 'up';
    try {
      fs.rmSync(`./plugins/example/${plugin_name}.js`, { recursive: true, force: true });
    } catch (err) {
      await e.reply(`插件更新失败！\n${err.message}`);
      return true;
    }
      
      await e.reply(`本次更新通道${update}，正在更新中……`)
      let com
          com = `rm -f plugins/example/up.js && curl -o ./plugins/example/${plugin_name}.js ${update}`
      
      let com_result = await this.execSyncc(com, { encoding: 'buffer' })
      if(com_result.error) {
          await e.reply(`安装时出现错误！\n${com_result.error.message}`)
          return true
      }
      await e.reply(`插件更新成功！重启后生效`)
  
  }
  
  async 安装依赖(e) {
    if(!e.isMaster) return false
    let commsg = e.msg.match(/^#安装依赖(.*)$/)
    let plugin_name = commsg[1]
    await e.reply(`正在执行cd plugins/${plugin_name} && pnpm install`)
    let com
        com = `cd plugins/${plugin_name} && pnpm install`
    
    let com_result = await this.execSyncc(com, { encoding: 'buffer' })
    if(com_result.error) {
        await e.reply(`安装时出现错误！\n${com_result.error.message}`)
        return true
    }
    await e.reply(`依赖安装成功！重启后生效`)

}

  async execSyncc(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      });
    });
  }
}

async function lplm(c, l) {
  let a;
  for (let item of c) {
    if(item.pathname == l) {
      a = item
    }
  }
  if(!a) {
    a = {
      author: '@未知',
      describe: '暂无',
      pathname: l,
      pluginname: l,
      url: '未知'
    }
  }
  return a
}
