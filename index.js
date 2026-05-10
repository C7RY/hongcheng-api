const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  console.log(`收到请求: ${req.url}`);
  
  // 处理根路径
  if (parsedUrl.pathname === '/') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ok", message: "API 服务运行正常" }));
    return;
  }
  
  // 测试接口
  if (parsedUrl.pathname === '/test') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ok", message: "Railway API 运行正常" }));
    return;
  }
  
  // ========== 水阀控制 ==========
  // 开启水阀
  if (parsedUrl.pathname === '/start_water_valve') {
    const duration = parsedUrl.query.duration || "30";
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      message: `✅ 水阀已开启，将在 ${duration} 分钟后自动关闭`,
      type: "water",
      duration: duration
    }));
    return;
  }
  
  // 关闭水阀
  if (parsedUrl.pathname === '/close_water_valve') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      message: "🔒 水阀已手动关闭"
    }));
    return;
  }
  
  // ========== 肥阀控制 ==========
  // 开启肥阀
  if (parsedUrl.pathname === '/start_fert_valve') {
    const duration = parsedUrl.query.duration || "30";
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      message: `✅ 肥阀已开启，将在 ${duration} 分钟后自动关闭`,
      type: "fert",
      duration: duration
    }));
    return;
  }
  
  // 关闭肥阀
  if (parsedUrl.pathname === '/close_fert_valve') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      message: "🔒 肥阀已手动关闭"
    }));
    return;
  }
  
  // 404
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not Found" }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
