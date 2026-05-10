const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // 设置响应头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  console.log(`收到请求: ${req.url}`);
  
  // 处理根路径
  if (parsedUrl.pathname === '/') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ok", message: "API 服务运行正常" }));
    return;
  }
  
  // 处理 /test 请求
  if (parsedUrl.pathname === '/test') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: "ok", message: "Railway API 运行正常" }));
    return;
  }
  
  // 处理 /start_valve 请求
  if (parsedUrl.pathname === '/start_valve') {
    const type = parsedUrl.query.type || "water";
    const duration = parsedUrl.query.duration || "30";
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      message: `模拟开启 ${type} 阀，持续 ${duration} 分钟`,
      type: type,
      duration: duration
    }));
    return;
  }
  
  // 处理 /close_valve 请求
  if (parsedUrl.pathname === '/close_valve') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      message: "阀门已手动关闭"
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
