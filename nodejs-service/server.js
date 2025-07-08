const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const multer = require("multer");
const { spawn } = require('child_process');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 }); // WebSocket 服务器端口
// 自定义文件存储逻辑
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 指定文件存储的目录
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // 生成文件名，保留原始扩展名
    const ext = path.extname(file.originalname); // 获取原始文件的扩展名
    const fileName = `${Date.now()}${ext}`; // 使用时间戳和扩展名生成文件名
    cb(null, fileName);
  }
});
const upload = multer({ storage: storage });
// 设置请求体解析中间件
const cors = require("cors");
app.use(cors());
app.use(express.text());

// 接收配置信息并保存到指定路径
app.post('/api/saveConfig', (req, res) => {
  const configText = req.body; // 获取请求体中的配置文本
  const configFilePath = path.join(__dirname, './VectorReconstruction/exe/config.txt'); // 指定保存路径

  fs.writeFile(configFilePath, configText, (err) => {
    if (err) {
      console.error('保存配置失败:', err);
      return res.status(500).json({ message: '保存配置失败' });
    }
    console.log('配置已成功保存到:', configFilePath);
    res.json({ message: '配置已成功保存' });
  });
});
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // 获取文件存储路径
  const filePath = path.join(__dirname, "uploads", req.file.filename);

  // 假设你的服务器运行在 http://localhost:3000
  const fileUrl = `D:\\webproject\\DigitalSchool_Algorithm_Web\\nodejs-service\\uploads\\${req.file.filename}`;
  console.log("文件已存储：", filePath);

  res.json({ url: fileUrl });
});



// 定义要运行的程序和参数
const program = './VectorReconstruction/exe/KSR-CL.exe';
const args = ['--config', './VectorReconstruction/exe/config.txt'];

app.get('/run_vector_reconstruction', (req, res) => {
    const child = spawn(program, args);

    let stderr = '';

    // 监听标准输出
    child.stdout.on('data', (data) => {
      console.log(`标准输出: ${data.toString()}`);
      // 将数据发送到 WebSocket 客户端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "process", message: data.toString() }));
        }
      });
    });

    // 监听标准错误
    child.stderr.on('data', (data) => {
      console.error(`标准错误: ${data.toString()}`);
      stderr += data.toString();
    });

    // 监听进程结束
    // 监听进程结束
    child.on('close', (code) => {
      console.log(`子进程退出，退出码 ${code}`);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "done", message: "任务完成" }));
        }
      });
    });

    res.send('WebSocket 已启动，等待实时数据');
});





app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});