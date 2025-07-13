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
app.use(express.json()); // 修改为json解析
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

// Texrecon算法处理接口
app.post('/run_texrecon', async (req, res) => {
  try {
    const { jpgFiles, camFiles, plyFile, params } = req.body;
    
    // 创建临时工作目录
    const workDir = path.join(__dirname, 'texrecon_workspace', Date.now().toString());
    fs.mkdirSync(workDir, { recursive: true });
    
    // 创建输出目录
    const outputDir = path.join(workDir, 'out');
    fs.mkdirSync(outputDir, { recursive: true });
    
    console.log('创建工作目录:', workDir);
    
    // 复制JPG文件到工作目录
    for (const jpgFile of jpgFiles) {
      const sourcePath = jpgFile.path;
      const originalName = jpgFile.name; // 使用原始文件名
      const targetPath = path.join(workDir, originalName);
      
      // 读取文件并复制
      const fileContent = fs.readFileSync(sourcePath);
      fs.writeFileSync(targetPath, fileContent);
      console.log('复制JPG文件:', originalName);
    }
    
    // 复制CAM文件到工作目录
    for (const camFile of camFiles) {
      const sourcePath = camFile.path;
      const originalName = camFile.name; // 使用原始文件名
      const targetPath = path.join(workDir, originalName);
      
      // 读取文件并复制
      const fileContent = fs.readFileSync(sourcePath);
      fs.writeFileSync(targetPath, fileContent);
      console.log('复制CAM文件:', originalName);
    }
    
    // 验证文件复制是否成功
    const jpgFilesInDir = fs.readdirSync(workDir).filter(file => 
      file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
    );
    const camFilesInDir = fs.readdirSync(workDir).filter(file => 
      file.toLowerCase().endsWith('.cam')
    );
    
    console.log(`工作目录中的JPG文件数量: ${jpgFilesInDir.length}`);
    console.log(`工作目录中的CAM文件数量: ${camFilesInDir.length}`);
    
    if (jpgFilesInDir.length === 0) {
      throw new Error('没有找到JPG文件');
    }
    if (camFilesInDir.length === 0) {
      throw new Error('没有找到CAM文件');
    }
    
    // 验证文件匹配
    const jpgPrefixes = jpgFilesInDir.map(file => file.replace(/\.(jpg|jpeg)$/i, ''));
    const camPrefixes = camFilesInDir.map(file => file.replace(/\.cam$/i, ''));
    
    console.log('JPG文件前缀:', jpgPrefixes.slice(0, 5));
    console.log('CAM文件前缀:', camPrefixes.slice(0, 5));
    
    // 检查是否有匹配的文件
    const matchingFiles = jpgPrefixes.filter(prefix => camPrefixes.includes(prefix));
    console.log(`匹配的文件对数量: ${matchingFiles.length}`);
    
    if (matchingFiles.length === 0) {
      throw new Error('没有找到匹配的JPG和CAM文件对。请确保JPG和CAM文件有相同的前缀名称。');
    }
    
    // 复制PLY文件到工作目录
    const plySourcePath = plyFile.path;
    const plyFileName = path.basename(plySourcePath);
    const plyTargetPath = path.join(workDir, plyFileName);
    
    const plyContent = fs.readFileSync(plySourcePath);
    fs.writeFileSync(plyTargetPath, plyContent);
    console.log('复制PLY文件:', plyFileName);
    
    // 构建Texrecon命令参数
    const texreconArgs = [];
    
    // 添加可选参数
    if (params.data_term) {
      texreconArgs.push('-d', params.data_term);
    }
    if (params.smoothness_term) {
      texreconArgs.push('-s', params.smoothness_term);
    }
    if (params.outlier_removal) {
      texreconArgs.push('-o', params.outlier_removal);
    }
    if (params.tone_mapping) {
      texreconArgs.push('-t', params.tone_mapping);
    }
    if (params.skip_geometric_visibility_test) {
      texreconArgs.push('--skip_geometric_visibility_test');
    }
    if (params.skip_global_seam_leveling) {
      texreconArgs.push('--skip_global_seam_leveling');
    }
    if (params.skip_local_seam_leveling) {
      texreconArgs.push('--skip_local_seam_leveling');
    }
    if (params.write_timings) {
      texreconArgs.push('--write_timings');
    }
    if (params.no_intermediate_results) {
      texreconArgs.push('--no_intermediate_results');
    }
    
    // 添加必需参数：场景目录、网格文件、输出前缀
    // 使用当前目录作为场景目录，因为JPG和CAM文件都在这里
    // 注意：Texrecon期望的是PLY文件的完整路径，而不是相对路径
    texreconArgs.push('.', plyFileName, 'out/texrecon');
    
    // 调试：打印工作目录中的文件
    console.log('工作目录中的文件列表:');
    const filesInWorkDir = fs.readdirSync(workDir);
    filesInWorkDir.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // 添加内存优化参数
    if (jpgFilesInDir.length > 50) {
      console.log('检测到大量图片文件，启用内存优化模式');
      // 可以在这里添加额外的优化参数
    }
    
    // 计算预估内存使用
    const totalImageSize = jpgFilesInDir.reduce((total, file) => {
      const filePath = path.join(workDir, file);
      try {
        const stats = fs.statSync(filePath);
        return total + stats.size;
      } catch (error) {
        return total;
      }
    }, 0);
    
    const estimatedMemoryMB = (totalImageSize * 3) / (1024 * 1024); // 预估内存使用（图片大小 * 3）
    console.log(`预估内存使用: ${estimatedMemoryMB.toFixed(2)} MB`);
    
    if (estimatedMemoryMB > 4096) { // 超过4GB
      console.warn('警告: 预估内存使用超过4GB，可能导致算法崩溃');
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: "warning", 
            message: `预估内存使用: ${estimatedMemoryMB.toFixed(2)} MB，建议减少图片数量或使用更小的图片` 
          }));
        }
      });
    }
    
    console.log('工作目录:', workDir);
    console.log('Texrecon命令参数:', texreconArgs);
    console.log('工作目录中的文件:', fs.readdirSync(workDir));
    
    console.log('Texrecon命令参数:', texreconArgs);
    
    // 启动Texrecon进程
    const texreconPath = path.join(__dirname, '../Release/texrecon.exe');
    console.log('Texrecon路径:', texreconPath);
    console.log('工作目录:', workDir);
    console.log('完整命令:', `${texreconPath} ${texreconArgs.join(' ')}`);
    
    const child = spawn(texreconPath, texreconArgs, {
      cwd: workDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // 增加内存限制
        'OMP_NUM_THREADS': '8',  // 增加线程数
        'MALLOC_TRIM_THRESHOLD_': '262144',  // 增加内存整理阈值
        'MALLOC_MMAP_THRESHOLD_': '262144',  // 增加内存映射阈值
        'MALLOC_TOP_PAD_': '131072',  // 增加内存填充
        'MALLOC_MMAP_MAX_': '131072',  // 增加内存映射数量
        // 增加内存限制环境变量
        'TEXRECON_MAX_MEMORY': '4096',  // 增加最大内存使用为4GB
        'TEXRECON_BATCH_SIZE': '50'  // 增加批处理大小
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    // 监听标准输出
    child.stdout.on('data', (data) => {
      const message = data.toString();
      stdout += message;
      console.log(`Texrecon输出: ${message}`);
      
      // 发送进度信息到WebSocket客户端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: "process", 
            message: message.trim() 
          }));
        }
      });
    });
    
    // 监听标准错误
    child.stderr.on('data', (data) => {
      const message = data.toString();
      stderr += message;
      console.error(`Texrecon错误: ${message}`);
      
      // 发送错误信息到WebSocket客户端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: "error", 
            message: message.trim() 
          }));
        }
      });
    });
    
    // 监听进程结束
    child.on('close', (code) => {
      console.log(`Texrecon进程退出，退出码 ${code}`);
      
      // 处理不同的退出码
      if (code === 0) {
        // 成功完成
      } else if (code === 3221226505) {
        // 内存访问违规
        const errorMsg = 'Texrecon算法因内存不足而崩溃。建议：1) 减少图片数量 2) 使用更小的图片 3) 增加系统内存';
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "error", 
              message: errorMsg 
            }));
          }
        });
        return;
      } else if (code === 3221225477) {
        // 堆栈溢出
        const errorMsg = 'Texrecon算法因堆栈溢出而崩溃。建议减少输入文件数量。';
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "error", 
              message: errorMsg 
            }));
          }
        });
        return;
      }
      
      if (code === 0) {
        // 算法成功完成，复制结果文件到public目录
        const publicOutputDir = path.join(__dirname, '../public/output');
        fs.mkdirSync(publicOutputDir, { recursive: true });
        
        // 复制生成的OBJ和MTL文件
        const generatedFiles = ['texrecon.obj', 'texrecon.mtl'];
        for (const fileName of generatedFiles) {
          const sourcePath = path.join(outputDir, fileName);
          const targetPath = path.join(publicOutputDir, fileName);
          
          if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`复制结果文件: ${fileName}`);
          }
        }
        
        // 复制纹理贴图文件
        const textureFiles = fs.readdirSync(outputDir).filter(file => 
          file.startsWith('texrecon_material') && file.endsWith('.png')
        );
        
        for (const fileName of textureFiles) {
          const sourcePath = path.join(outputDir, fileName);
          const targetPath = path.join(publicOutputDir, fileName);
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`复制纹理文件: ${fileName}`);
        }
        
        // 发送完成消息
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "done", 
              message: "Texrecon算法处理完成" 
            }));
          }
        });
      } else {
        // 算法失败
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "error", 
              message: `Texrecon算法失败，退出码: ${code}` 
            }));
          }
        });
      }
    });
    
    // 监听进程错误
    child.on('error', (error) => {
      console.error('Texrecon进程错误:', error);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: "error", 
            message: `Texrecon进程错误: ${error.message}` 
          }));
        }
      });
    });
    
    res.json({ message: 'Texrecon算法已启动', workDir });
    
  } catch (error) {
    console.error('启动Texrecon算法失败:', error);
    res.status(500).json({ error: error.message });
  }
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