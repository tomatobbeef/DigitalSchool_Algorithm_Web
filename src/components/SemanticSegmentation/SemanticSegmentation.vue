<template>
  <div class="semantic-instance-segmentation-container">
    <h2>语义分割与实例分割操作界面</h2>
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
        >
          <el-button size="small" type="primary">上传点云文件</el-button>
          <div class="el-upload__tip">支持上传.ply格式文件</div>
        </el-upload>
      </div>
    </el-card>

    <el-card class="box-card">
      <div class="clearfix">
        <span>参数配置</span>
      </div>
      <div>
        <el-form label-width="150px">
          <el-form-item label="语义分割阈值">
            <el-slider v-model="algorithmParams.semanticThreshold"></el-slider>
          </el-form-item>
          <el-form-item label="实例分割阈值">
            <el-slider v-model="algorithmParams.instanceThreshold"></el-slider>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runAlgorithm">运行算法</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="box-card">
      <div class="clearfix">
        <span>结果展示</span>
        <div ref="containerRef" style="height: 100vh; width: 100vw;"></div>
      </div>
      <div>
        <div v-if="results.semanticResult" class="result-placeholder">
          <h3>语义分割结果</h3>
          <div>[语义分割后的点云文件]</div>
        </div>
        <div v-if="results.instanceResult" class="result-placeholder">
          <h3>实例分割结果</h3>
          <div>[实例分割后的点云文件]</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ref, onMounted } from 'vue';

export default {
  name: 'SemanticInstanceSegmentation',
  setup() {
    const containerRef = ref(null); // 容器引用
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;

    const uploadData = ref({
      pointCloudFileList: [],
    });

    const algorithmParams = ref({
      semanticThreshold: 50,
      instanceThreshold: 50,
    });

    const results = ref({
      semanticResult: false,
      instanceResult: false,
    });

    const handlePointCloudChange = (file, fileList) => {
      uploadData.value.pointCloudFileList = fileList;
    };

    const runAlgorithm = () => {
      if (uploadData.value.pointCloudFileList.length > 0) {
        results.value.semanticResult = true;
        results.value.instanceResult = true;
      } else {
        alert("请先上传点云文件！");
      }
    };

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
      const loader = new PLYLoader();
      loader.load(url, (geometry) => {
        const material = new THREE.PointsMaterial({ size: 0.01, vertexColors: true });
        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const box = new THREE.Box3().setFromObject(points);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        camera.position.set(center.x, center.y, maxDim * 1.5);
        controls.target.set(center.x, center.y, center.z);
        controls.update();
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    onMounted(() => {
      initThree();
      loadPLYModel('static/semanticSegmentation/semantic_2.ply');
    });

    return {
      containerRef,
      uploadData,
      algorithmParams,
      results,
      handlePointCloudChange,
      runAlgorithm,
      initThree,
      loadPLYModel,
      animate,
    };
  },
};
</script>

<style scoped>
.semantic-instance-segmentation-container {
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