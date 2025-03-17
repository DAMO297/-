// 创建图标目录
const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, 'static', 'icons');
if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
} 