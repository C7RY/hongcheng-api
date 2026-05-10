const http = require('http');
const url = require('url');

// 存储各区域各阀门的倒计时状态
// 结构: { "zone_1_water": { timer: null, endTime: null }, "zone_1_fert": {...} }
const valveState = {};

// 生成HTML页面
function generateHTML(zoneId, valveType, status, remainingSeconds = 0) {
  const valveName = valveType === 'water' ? '水阀' : '肥阀';
  const isRunning = status === 'running';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${zoneId} - ${valveName}控制</title>
    <style>
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 500px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        h2 {
            color: #2d6a4f;
            margin-bottom: 10px;
        }
        .zone-badge {
            background: #1b4332;
            color: white;
            padding: 8px 16px;
            border-radius: 25px;
            display: inline-block;
            font-size: 14px;
            margin-bottom: 20px;
        }
        .status {
            font-size: 18px;
            margin: 20px 0;
            padding: 15px;
            border-radius: 12px;
        }
        .status-running {
            background: #d8f3dc;
            color: #1b4332;
            border: 1px solid #2d6a4f;
        }
        .status-idle {
            background: #f8f9fa;
            color: #6c757d;
            border: 1px solid #dee2e6;
        }
        .timer {
            font-size: 48px;
            font-weight: bold;
            font-family: monospace;
            margin: 20px 0;
            color: #2d6a4f;
        }
        button {
            background: #2d6a4f;
            color: white;
            border: none;
            padding: 14px 28px;
            font-size: 18px;
            border-radius: 30px;
            cursor: pointer;
            transition: all 0.2s;
            margin: 10px;
            font-weight: 600;
        }
        button:hover {
            background: #1b4332;
            transform: scale(1.02);
        }
        button:active {
            transform: scale(0.98);
        }
        .stop-btn {
            background: #dc3545;
        }
        .stop-btn:hover {
            background: #b02a37;
        }
        .note {
            margin-top: 20px;
            font-size: 12px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="zone-badge">${zoneId}</div>
        <h2>${valveName}控制系统</h2>
        
        <div class="status ${isRunning ? 'status-running' : 'status-idle'}">
            ${isRunning ? '⚡ 阀门已开启' : '⏸️ 阀门已关闭'}
        </div>
        
        ${isRunning ? `
        <div class="timer">剩余: <span id="countdown">${formatTime(remainingSeconds)}</span></div>
        ` : ''}
        
        <div>
            ${!isRunning ? `
            <button onclick="startValve()">▶ 开启阀门</button>
            ` : `
            <button class="stop-btn" onclick="stopValve()">⏹️ 立即关闭</button>
            `}
        </div>
        
        <div class="note">
            ⏰ 开启后自动倒计时30分钟<br>
            💡 手动关闭后自动计时清零
        </div>
    </div>
    
    <script>
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
        }
        
        async function startValve() {
            const resp = await fetch('/api/start?zone=${zoneId}&type=${valveType}');
            const data = await resp.json();
            if (data.status === 'ok') {
                location.reload();
            }
        }
        
        async function stopValve() {
            const resp = await fetch('/api/stop?zone=${zoneId}&type=${valveType}');
            const data = await resp.json();
            if (data.status === 'ok') {
                location.reload();
            }
        }
        
        ${isRunning ? `
        let remaining = ${remainingSeconds};
        const timerElement = document.getElementById('countdown');
        const interval = setInterval(() => {
            if (remaining <= 1) {
                clearInterval(interval);
                if (timerElement) timerElement.textContent = '00:00';
                setTimeout(() => location.reload(), 2000);
            } else {
                remaining--;
                if (timerElement) timerElement.textContent = formatTime(remaining);
            }
        }, 1000);
        ` : ''}
    </script>
</body>
</html>`;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 获取阀门状态标识
function getStateKey(zoneId, valveType) {
  return `${zoneId}_${valveType}`;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  console.log(`收到请求: ${req.url}`);
  
  // API: 开启阀门
  if (parsedUrl.pathname === '/api/start') {
    const zoneId = parsedUrl.query.zone;
    const valveType = parsedUrl.query.type;
    
    if (!zoneId || !valveType) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少参数 zone 或 type' }));
      return;
    }
    
    const key = getStateKey(zoneId, valveType);
    const duration = 30 * 60; // 30分钟 = 1800秒
    const endTime = Date.now() + duration * 1000;
    
    // 清除之前的定时器
    if (valveState[key] && valveState[key].timer) {
      clearTimeout(valveState[key].timer);
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      console.log(`${zoneId} ${valveType} 自动关闭`);
      if (valveState[key]) {
        valveState[key].status = 'idle';
        valveState[key].timer = null;
        valveState[key].endTime = null;
      }
    }, duration * 1000);
    
    valveState[key] = {
      status: 'running',
      timer: timer,
      endTime: endTime
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: `${zoneId} ${valveType} 已开启` }));
    return;
  }
  
  // API: 关闭阀门
  if (parsedUrl.pathname === '/api/stop') {
    const zoneId = parsedUrl.query.zone;
    const valveType = parsedUrl.query.type;
    
    if (!zoneId || !valveType) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '缺少参数 zone 或 type' }));
      return;
    }
    
    const key = getStateKey(zoneId, valveType);
    
    if (valveState[key] && valveState[key].timer) {
      clearTimeout(valveState[key].timer);
      valveState[key].status = 'idle';
      valveState[key].timer = null;
      valveState[key].endTime = null;
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: `${zoneId} ${valveType} 已关闭` }));
    return;
  }
  
  // 页面: 水阀控制页
  if (parsedUrl.pathname === '/water') {
    const zoneId = parsedUrl.query.zone || 'zone_1';
    const key = getStateKey(zoneId, 'water');
    let status = 'idle';
    let remaining = 0;
    
    if (valveState[key] && valveState[key].status === 'running') {
      status = 'running';
      remaining = Math.max(0, Math.floor((valveState[key].endTime - Date.now()) / 1000));
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateHTML(zoneId, 'water', status, remaining));
    return;
  }
  
  // 页面: 肥阀控制页
  if (parsedUrl.pathname === '/fert') {
    const zoneId = parsedUrl.query.zone || 'zone_1';
    const key = getStateKey(zoneId, 'fert');
    let status = 'idle';
    let remaining = 0;
    
    if (valveState[key] && valveState[key].status === 'running') {
      status = 'running';
      remaining = Math.max(0, Math.floor((valveState[key].endTime - Date.now()) / 1000));
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(generateHTML(zoneId, 'fert', status, remaining));
    return;
  }
  
  // 测试接口
  if (parsedUrl.pathname === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: "ok", message: "Railway API 运行正常" }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: "Not Found" }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
