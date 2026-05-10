module.exports = async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === "/test") {
    return res.status(200).json({ status: "ok", message: "Vercel API 运行正常" });
  }
  
  if (url.pathname === "/start_valve") {
    const type = url.searchParams.get("type") || "water";
    const duration = url.searchParams.get("duration") || "30";
    return res.status(200).json({
      status: "ok",
      message: `模拟开启 ${type} 阀，持续 ${duration} 分钟`,
      type: type,
      duration: duration
    });
  }
  
  if (url.pathname === "/close_valve") {
    return res.status(200).json({
      status: "ok",
      message: "阀门已手动关闭"
    });
  }
  
  return res.status(404).json({ error: "Not Found" });
};
