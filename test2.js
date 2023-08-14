const { createVLESSServer } = require('./index.js');

// 定义端口和 UUID
const port = 3001;
const uuid = '890d0681-ebf8-40d2-82fa-7133e0e58c87';

// 调用函数启动 VLESS 服务器
createVLESSServer(port, uuid);
