<template>
  <div class="vector-reconstruction-container">
    <h2>矢量重建操作界面</h2>
    <el-card class="box-card">
      <div class="clearfix">
        <span>文件上传</span>
      </div>
      <div>
        <el-upload
          class="upload-demo"
          action="" 
          :on-change="handlePointCloudChange"
          :file-list="uploadData.pointCloudFileList"
          list-type="text"
          :auto-upload="false"
          accept=".ply"
        >
          <el-button size="small" type="primary">上传点云数据文件</el-button>
          <div class="el-upload__tip">支持上传ply格式文件</div>
        </el-upload>
      </div>
      <el-button @click="uploadFile">开始上传</el-button>
    </el-card>

    <el-card class="box-card">
        <div class="clearfix">
          <span>参数配置</span>
        </div>
        <div>
        <el-form label-width="200px">
          <!-- 数值参数 -->
          <el-form-item label="nmin">
            <el-input-number v-model="config.nmin" :min="0"></el-input-number>
          </el-form-item>
          <el-form-item label="epsilon">
            <el-input-number v-model="config.epsilon" :min="0" :step="0.001"></el-input-number>
          </el-form-item>
          <el-form-item label="tolerance_angle">
            <el-input-number v-model="config.tolerance_angle" :min="0"></el-input-number>
          </el-form-item>
          <el-form-item label="tolerance_coplanarity">
            <el-input-number v-model="config.tolerance_coplanarity" :min="0" :step="0.001"></el-input-number>
          </el-form-item>
          <el-form-item label="K">
            <el-input-number v-model="config.K" :min="0"></el-input-number>
          </el-form-item>
          <el-form-item label="lambda">
            <el-input-number v-model="config.lambda" :min="0" :step="0.001"></el-input-number>
          </el-form-item>

          <!-- 布尔值参数 -->
          <el-form-item label="regularize">
            <el-switch v-model="config.regularize"></el-switch>
          </el-form-item>
          <el-form-item label="save_alpha_shapes">
            <el-switch v-model="config.save_alpha_shapes"></el-switch>
          </el-form-item>
          <el-form-item label="save_convex_hulls">
            <el-switch v-model="config.save_convex_hulls"></el-switch>
          </el-form-item>
          <el-form-item label="save_partition_ply">
            <el-switch v-model="config.save_partition_ply"></el-switch>
          </el-form-item>
          <el-form-item label="save_partition_kgraph">
            <el-switch v-model="config.save_partition_kgraph"></el-switch>
          </el-form-item>
          <el-form-item label="verbose">
            <el-switch v-model="config.verbose"></el-switch>
          </el-form-item>

          <!-- 按钮 -->
          <el-form-item>
            <el-button type="primary" @click="saveConfig">Save Configuration</el-button>
          </el-form-item>
        </el-form>
      </div>
      </el-card>

    <el-card class="box-card">
      <div class="clearfix">
        <span>操作</span>
      </div>
      <div>
        <el-button type="success" @click="runAlgorithm" :disabled="!isReady">
          运行算法
        </el-button>
      </div>
    </el-card>

    <el-card class="box-card">
      <div class="clearfix">
        <span>结果展示</span>
        <div>进度展示：{{ process }}</div>
        <div ref="containerRef" style="height: 100vh; width: 100vw;"></div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import axios from "axios";
import { onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ElMessage } from 'element-plus';
export default {
  name: "VectorReconstruction",
  setup() {

    const containerRef = ref(null); // 容器引用
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;

    const initThree = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        75,
        containerRef.value.clientWidth / containerRef.value.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      const ambientLight = new THREE.AmbientLight(0x404040); // 柔和的白色光
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 白色光，强度为1
      directionalLight.position.set(1, 1, 1); // 设置光源位置
      scene.add(directionalLight);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
      containerRef.value.appendChild(renderer.domElement); // 修改这里

      controls = new OrbitControls(camera, renderer.domElement);
      animate();
    };

    const loadPLYModel = (url) => {
      console.log('尝试加载PLY文件:', url);
      const loader = new PLYLoader();
      
      return new Promise((resolve, reject) => {
        loader.load(
          url, 
          (geometry) => {
            console.log('PLY文件加载成功:', geometry);
            // 检查颜色属性
            console.log('geometry.attributes.color:', geometry.attributes.color);
            // 使用 MeshBasicMaterial 便于调试颜色
            const material = new THREE.MeshBasicMaterial({ vertexColors: true });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            // 增加线框显示
            const wireframe = new THREE.WireframeGeometry(geometry);
            const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x000000 }));
            scene.add(line);
            // 增加半球光源
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
            scene.add(hemiLight);
            // 调整相机和控件的中心位置
            const box = new THREE.Box3().setFromObject(mesh);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.set(center.x, center.y, maxDim * 1.5);
            controls.target.set(center.x, center.y, center.z);
            controls.update();
            console.log('模型已添加到场景');
            resolve();
          },
          (progress) => {
            console.log('加载进度:', progress);
          },
          (error) => {
            console.error('PLY文件加载失败:', error);
            alert('PLY文件加载失败: ' + error.message);
            reject(error);
          }
        );
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    const uploadData = ref({
      pointCloudFileList: [],
    });

    const process = ref('')

    const isReady = ref(false);
    const inputfile = ref('');
    const handlePointCloudChange = (file, fileList) => {
      console.log('文件选择变化:', file, fileList);
      uploadData.value.pointCloudFileList = fileList;
      console.log('更新后的文件列表:', uploadData.value.pointCloudFileList);
    };
    const uploadFile = async () => {
      console.log('开始上传文件...');
      console.log('当前文件列表:', uploadData.value.pointCloudFileList);
      
      // 获取文件列表中的第一个文件
      const file = uploadData.value.pointCloudFileList[0]?.raw;

      if (!file) {
        console.log('没有选择文件');
        alert("请先选择文件");
        return;
      }

      console.log('选择的文件:', file);
      console.log('文件名称:', file.name);
      console.log('文件大小:', file.size);
      console.log('文件类型:', file.type);

      const formData = new FormData();
      formData.append("file", file);

      try {
        console.log('发送上传请求到: http://localhost:3000/upload');
        const response = await axios.post("http://localhost:3000/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        console.log('服务器响应:', response);
        // 假设后端返回的文件地址在 response.data.url 中
        const fileUrl = response.data.url;
        console.log("文件地址：", fileUrl);
        inputfile.value = fileUrl
        alert("文件上传成功");
        return fileUrl
      } catch (error) {
        console.error("文件上传失败：", error);
        console.error("错误详情:", error.response?.data || error.message);
        alert("文件上传失败: " + (error.response?.data?.error || error.message));
        return ' '
      }
    };
    const runAlgorithm = () => {
      process.value = "加载中"
      if (
        uploadData.value.pointCloudFileList.length > 0
      ) {
        isReady.value = false; // 重置状态
        const apiUrl = 'http://localhost:3000/run_vector_reconstruction';

        // 发送 GET 请求
        axios.get(apiUrl)
          .then(response => {
            // 处理响应数据
            console.log('响应数据：', response.data);
            if (response.data.process) {
              process.value = response.data.process
            } else {
              console.log('未获取到进程输出');
            }
          })
          .catch(error => {
            // 处理错误
            console.error('请求失败：', error);
          });
      } else {
        alert("请先上传所有必要的文件！");
      }
    };

    const ws = new WebSocket('ws://localhost:8081'); // 连接到后端 WebSocket 服务器

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket消息:', message);
      if (message.type === "done") {
        // 如果是任务完成消息
        console.log("算法执行完成");
        process.value = "已完成";
        initThree();
        
        // 尝试加载PLY文件，使用绝对路径
        const plyPath = '/nodejs-service/VectorReconstruction/output/test/output.ply';
        console.log('尝试加载PLY文件:', plyPath);
        
        // 如果PLY文件不存在，尝试加载其他格式的文件
        loadPLYModel(plyPath).catch(() => {
          console.log('PLY文件不存在，尝试加载其他格式文件...');
          // 这里可以添加加载其他格式文件的逻辑
        });
      } 
      else{
        // 普通日志信息
        process.value = message.message;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket 连接已关闭');
    };

    onUnmounted(() => {
      ws.close(); // 组件销毁时关闭 WebSocket 连接
    });

    watch(
      () => uploadData.value.pointCloudFileList.length,
      (newVal) => {
        isReady.value =
          newVal > 0 ;
      }
    );
    const config = ref({
      
      output: '',
      nmin: 50,
      epsilon: 0.3,
      regularize: true,
      tolerance_angle: 5,
      tolerance_coplanarity: 0.03,
      K: 1,
      lambda: 0.3,
      save_alpha_shapes: true,
      save_convex_hulls: true,
      save_partition_ply: true,
      save_partition_kgraph: true,
      verbose: true,
    });

    // 保存配置到 config.txt
    const saveConfig = async () => {
      try {
        // 构造配置文本
        let configText = '';

        // 添加输入输出路径
        configText += `input ${inputfile.value}\n`;
        configText += `output D:\\webproject\\DigitalSchool_Algorithm_Web\\nodejs-service\\VectorReconstruction\\output\\test\\output.ply\n`;

        // 添加数值参数
        configText += `nmin ${config.value.nmin}\n`;
        configText += `epsilon ${config.value.epsilon.toFixed(4)}\n`;
        configText += `tolerance_angle ${config.value.tolerance_angle}\n`;
        configText += `tolerance_coplanarity ${config.value.tolerance_coplanarity.toFixed(4)}\n`;
        configText += `K ${config.value.K}\n`;
        configText += `lambda ${config.value.lambda.toFixed(4)}\n`;

        // 添加布尔值参数
        if (config.value.regularize) configText += 'regularize\n';
        if (config.value.save_alpha_shapes) configText += 'save_alpha_shapes\n';
        if (config.value.save_convex_hulls) configText += 'save_convex_hulls\n';
        if (config.value.save_partition_ply) configText += 'save_partition_ply\n';
        if (config.value.save_partition_kgraph) configText += 'save_partition_kgraph\n';
        if (config.value.verbose) configText += 'verbose\n';

        // 发送配置到服务器
        const response = await fetch('http://localhost:3000/api/saveConfig', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: configText,
        });

        if (response.ok) {
          const result = await response.json();
          ElMessage.success(result.message);
        } else {
          ElMessage.error('保存配置失败');
        }
      } catch (error) {
        ElMessage.error(`保存配置失败：${error.message}`);
      }
    };
    return {
      uploadData,
      handlePointCloudChange,
      runAlgorithm,
      isReady,
      config,
      saveConfig,
      uploadFile,
      inputfile,
      process,
      containerRef,
      initThree,
      loadPLYModel,
      animate,
    };
  },
};
</script>

<style>
.vector-reconstruction-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.box-card {
  width: 100%;
}
.clearfix {
  margin-bottom: 10px;
}
.result-placeholder {
  border: 1px dashed #ccc;
  padding: 20px;
  margin: 10px 0;
  text-align: center;
}
</style>