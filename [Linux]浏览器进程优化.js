import { exec } from 'child_process';

// 配置参数
const CHECK_INTERVAL = 600 * 1000; 
const MAX_PROCESSES = 20;   // 触发清理的阈值

function killInactiveChromeProcesses() {
  exec('ps -eo pid,stat,comm | awk \'$3~/chrome|chromium/{print $1,$2}\'', (err, stdout) => {
    if (err || !stdout) {
      return logger.mark('[状态] 无浏览器进程或检测失败');
    }

    const processes = stdout.trim().split('\n').filter(Boolean);
    const allPids = processes.map(p => p.split(' ')[0]);
    const currentCount = allPids.length;
    
    logger.mark(`[检测] 浏览器进程总数: ${currentCount}`);
    
    if (currentCount <= MAX_PROCESSES) {
      return logger.mark('[状态] 进程数量未超过阈值');
    }

    // 筛选非活跃进程(I=空闲状态，S=可中断睡眠)
    const inactivePids = processes
      .filter(p => p.split(' ')[1].includes('I') || p.split(' ')[1].includes('S'))
      .map(p => p.split(' ')[0]);

    if (inactivePids.length === 0) {
      return logger.mark('[状态] 没有非活跃进程可终止');
    }

    logger.mark(`[清理] 准备终止 ${inactivePids.length} 个非活跃进程: ${inactivePids.join(',')}`);
    
    exec(`kill -9 ${inactivePids.join(' ')} 2>/dev/null`, () => {
      setTimeout(() => {
        exec('pgrep -f "chrome|chromium"', (err, stdout) => {
          const remainingCount = stdout ? stdout.trim().split('\n').filter(Boolean).length : 0;
          logger.mark(`[结果] 清理后剩余进程数: ${remainingCount}`);
        });
      }, 3000);
    });
  });
}

// 立即执行并设置定时检测
// killInactiveChromeProcesses();
setInterval(killInactiveChromeProcesses, CHECK_INTERVAL);

logger.mark(`[启动] 浏览器进程监控已启动，每${CHECK_INTERVAL / 1000}秒检测一次，超过${MAX_PROCESSES}个进程时自动清理`);