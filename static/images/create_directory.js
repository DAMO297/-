// 创建 static/images 目录
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'static', 'images');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
} 