const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8888;

const isProduction = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

// 상품 데이터 API (Express에서 직접 제공)
app.get('/api/products/:category', (req, res) => {
    const category = req.params.category;
    fs.readFile(path.resolve(__dirname, 'products.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, error: '상품 데이터 파일을 읽을 수 없습니다.' });
        }
        try {
            const products = JSON.parse(data);
            if (!products[category]) {
                return res.status(404).json({ success: false, error: '해당 카테고리 상품이 없습니다.' });
            }
            res.json({ success: true, products: products[category] });
        } catch (e) {
            res.status(500).json({ success: false, error: '상품 데이터 파싱 오류' });
        }
    });
});

// 인사말 API (Express에서 직접 제공)
app.get('/api/greeting', (req, res) => {
    fs.readFile(path.resolve(__dirname, 'greeting.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, error: '인사말 데이터 파일을 읽을 수 없습니다.' });
        }
        try {
            const greeting = JSON.parse(data);
            res.json(greeting);
        } catch (e) {
            res.status(500).json({ success: false, error: '인사말 데이터 파싱 오류' });
        }
    });
});

// 프록시 미들웨어는 항상 활성화
app.use('/api', (req, res, next) => {
    // GET /api/products 또는 GET /api/greeting만 직접 처리
    if (
        (req.method === 'GET' && req.path.startsWith('/products')) ||
        (req.method === 'GET' && req.path === '/greeting')
    ) {
        return next();
    }
    // 나머지(POST 등)는 Flask로 프록시
    createProxyMiddleware({
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
    })(req, res, next);
});

// 정적 파일 서비스 (현재 디렉토리 기준)
app.use(express.static(path.resolve(__dirname, '.')));

// SPA 지원 (필요시)
// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'index.html'));
// });

const galleryDir = path.resolve(__dirname, 'images/gallery');

app.get('/api/gallery/list', (req, res) => {
    fs.readdir(galleryDir, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, error: '갤러리 이미지 목록을 불러올 수 없습니다.' });
        }
        // 이미지 파일만 필터링 (jpg, png, jpeg, gif 등)
        const images = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
        res.json({ images });
    });
});

app.listen(PORT, () => {
    console.log(`Express proxy server running on http://localhost:${PORT}`);
}); 