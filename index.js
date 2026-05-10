const http = require('http');
const url = require('url');

// 存储每个区域每个阀门的倒计时状态
// 结构: { "zone_1": { "water": { active: false, endTime: null, timer: null }, "fert": {...} }, ... }
const valveState = {};

// 初始化6个区域的状态
for (let i = 1; i <= 6; i++) {
  valveState[`zone_${i}`] = {
    water: { active: false, endTime: null, timer: null },
    fert: { active: false, endTime: null, timer: null }
  };
}

// 设置倒计时
function startTimer(zoneId, valveType, durationMinutes) {
  const state = valveState[zoneId][valveType];
  
  // 清除已有定时器
  if (state.timer) {
    clearTimeout(state.timer);
  }
  
  const endTime = Date.now() + durationMinutes * 60 * 1000;
  state.active = true;
  state.endTime = endTime;
  
  // 设置自动关闭定时器
  state.timer = setTimeout(() => {
    state.active = false;
    state.endTime = null;
    state.timer = null;
    console.log(`${zoneId} ${valveType} 阀门自动关闭`);
  }, durationMinutes * 60 * 1000);
  
  console.log(`${zoneId} ${valveType} 阀门已开启，将在 ${durationMinutes} 分钟后自动关闭`);
}

// 停止倒计时
function stopTimer(zoneId, valveType) {
  const state = valveState[zoneId][valveType];
  if (state.timer) {
    clearTimeout(state.timer);
  }
  state.active = false;
  state.endTime = null;
  state.timer = null;
  console.log(`${zoneId} ${valveType} 阀门已手动关闭`);
}

// 生成HTML页面
function generateHTML(zonesData) {
  // zonesData 包含每个区域的各项指标和标准范围
  // 用于在页面上显示区域状态
  
  let rows = '';
  for (let i = 1; i <= 6; i++) {
    const zoneId = `zone_${i}`;
    const waterState = valveState[zoneId].water;
    const fertState = valveState[zoneId].fert;
    
    const waterBtnText = waterState.active ? '关闭水阀' : '开启水阀';
    const waterBtnClass = waterState.active ? 'btn-close' : 'btn-open';
    const waterStatus = waterState.active ? `<span class="status-on">已开启 ${Math.ceil((waterState.endTime - Date.now()) / 60000)} 分钟后自动关闭</span>` : '<span class="status-off">已关闭</span>';
    
    const fertBtnText = fertState.active ? '关闭肥阀' : '开启肥阀';
    const fertBtnClass = fertState.active ? 'btn-close' : 'btn-open';
    const fertStatus = fertState.active ? `<span class="status-on">已开启 ${Math.ceil((fertState.endTime - Date.now()) / 60000)} 分钟后自动关闭</span>` : '<span class="status-off">已关闭</span>';
    
    rows += `
      <div class="zone-card">
        <h3>${zoneId.toUpperCase()}</h3>
        <div class="zone-data">
          ${zonesData?.zoneData?.[zoneId] || ''}
        </div>
        <div class="valve-control">
          <div class="valve-item">
            <span>💧 水阀：</span>
            <button class="${waterBtnClass}" onclick="controlValve('${zoneId}', 'water')">${waterBtnText}</button>
            ${waterStatus}
          </div>
          <div class="valve-item">
            <span>🌿 肥阀：</span>
            <button class="${fertBtnClass}" onclick="controlValve('${zoneId}', 'fert')">${fertBtnText}</button>
            ${fertStatus}
          </div>
        </div>
      </div>
    `;
  }
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>廉江红橙智慧农场 - 阀门控制系统</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f4e8;
      padding: 20px;
      color: #2c3e2f;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #2e7d32;
      text-align: center;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }
    .zone-card {
      background: white;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      border: 1px solid #d9e2d0;
    }
    .zone-card h3 {
      font-size: 18px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #c8e6c9;
      color: #1b5e20;
    }
    .zone-data {
      background: #f8faf6;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #333;
    }
    .valve-control {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .valve-item {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 8px 0;
      border-top: 1px solid #eee;
    }
    .valve-item span:first-child { width: 50px; font-weight: 500; }
    button {
      padding: 8px 20px;
      border: none;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-open {
      background: #2e7d32;
      color: white;
    }
    .btn-open:hover { background: #1b5e20; }
    .btn-close {
      background: #d32f2f;
      color: white;
    }
    .btn-close:hover { background: #b71c1c; }
    .status-on { color: #2e7d32; font-size: 12px; background: #e8f5e9; padding: 4px 10px; border-radius: 20px; }
    .status-off { color: #999; font-size: 12px; background: #f5f5f5; padding: 4px 10px; border-radius: 20px; }
    .refresh-note {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #aaa;
    }
    @media (max-width: 700px) {
      .grid { grid-template-columns: 1fr; }
      .valve-item { flex-direction: column; align-items: flex-start; }
      .valve-item span:first-child { width: auto; }
    }
  </style>
</head>
<body>
<div class="container">
  <h1>🍊 廉江红橙智慧农场</h1>
  <div class="subtitle">阀门远程控制系统 | 点击按钮开启/关闭 | 30分钟后自动关闭</div>
  <div class="grid" id="zonesGrid">
    ${rows}
  </div>
  <div class="refresh-note">⏰ 页面每30秒自动刷新状态 | 阀门开启后倒计时自动运行</div>
</div>

<script>
  async function controlValve(zoneId, valveType) {
    const response = await fetch('/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId, valveType })
    });
    const result = await response.json();
    if (result.success) {
      location.reload();
    } else {
      alert('操作失败：' + result.message);
    }
  }
  
  // 每30秒自动刷新页面，更新倒计时显示
  setTimeout(() => {
    location.reload();
  }, 30000);
</script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // 设置CORS和内容类型
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  // GET / - 返回控制面板HTML
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // 如果有区域数据传入，可以在这里解析query参数
    // 格式: /?zoneData=编码后的JSON
    let zonesData = null;
    if (parsedUrl.query.data) {
      try {
        zonesData = JSON.parse(decodeURIComponent(parsedUrl.query.data));
      } catch(e) {}
    }
    res.end(generateHTML(zonesData));
    return;
  }
  
  // POST /control - 阀门控制API
  if (req.method === 'POST' && parsedUrl.pathname === '/control') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { zoneId, valveType } = JSON.parse(body);
        
        if (!zoneId || !valveState[zoneId]) {
          res.end(JSON.stringify({ success: false, message: '区域不存在' }));
          return;
        }
        if (valveType !== 'water' && valveType !== 'fert') {
          res.end(JSON.stringify({ success: false, message: '阀门类型错误' }));
          return;
        }
        
        const currentState = valveState[zoneId][valveType];
        
        if (currentState.active) {
          // 当前已开启，执行关闭
          stopTimer(zoneId, valveType);
          res.end(JSON.stringify({ success: true, message: `已关闭${valveType === 'water' ? '水阀' : '肥阀'}` }));
        } else {
          // 当前已关闭，执行开启（30分钟倒计时）
          startTimer(zoneId, valveType, 30);
          res.end(JSON.stringify({ success: true, message: `已开启${valveType === 'water' ? '水阀' : '肥阀'}，30分钟后自动关闭` }));
        }
      } catch(e) {
        res.end(JSON.stringify({ success: false, message: '请求格式错误' }));
      }
    });
    return;
  }
  
  // GET /status - 获取所有阀门状态（API）
  if (req.method === 'GET' && parsedUrl.pathname === '/status') {
    const status = {};
    for (const zoneId in valveState) {
      status[zoneId] = {
        water: { active: valveState[zoneId].water.active, remainingMinutes: valveState[zoneId].water.active ? Math.max(0, Math.ceil((valveState[zoneId].water.endTime - Date.now()) / 60000)) : 0 },
        fert: { active: valveState[zoneId].fert.active, remainingMinutes: valveState[zoneId].fert.active ? Math.max(0, Math.ceil((valveState[zoneId].fert.endTime - Date.now()) / 60000)) : 0 }
      };
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, status }));
    return;
  }
  
  // 其他请求返回404
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
