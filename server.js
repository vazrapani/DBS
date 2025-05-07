const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 8888;

// /api로 시작하는 모든 요청을 Flask(5000)으로 프록시 (가장 먼저 선언)
app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/api': '/api' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    },
    onError: (err, req, res) => {
        console.error('[PROXY ERROR]', err);
    }
}));

// 정적 파일 서비스 (현재 디렉토리 기준)
app.use(express.static(path.resolve(__dirname, '.')));

// SPA 지원 (필요시)
// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'index.html'));
// });

app.listen(PORT, () => {
    console.log(`Express proxy server running on http://localhost:${PORT}`);
}); 