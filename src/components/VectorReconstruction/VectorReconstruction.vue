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
        >
          <el-button size="small" type="primary">上传点云数据文件</el-button>
          <div class="el-upload__tip">支持上传.vg、.ply、.pcd格式文件</div>
        </el-upload>
        <el-upload
          class="upload-demo"
          action=""
          :on-change="handleAlphaShapeChange"
          :file-list="uploadData.alphaShapeFileList"
          list-type="text"
        >
          <el-button size="small" type="primary">上传Alpha shape边界网格文件</el-button>
          <div class="el-upload__tip">支持上传.ply格式文件</div>
        </el-upload>
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
      </div>
      <div>
        <div v-if="results.surfaceResult" class="result-placeholder">
          <h3>重建的三维表面网格模型</h3>
          <div>[surface.obj 文件内容占位]</div>
        </div>
        <div v-if="results.cellsResult" class="result-placeholder">
          <h3>中间单元复合体模型</h3>
          <div>[cells.obj 文件内容占位]</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, watch } from "vue";

export default {
  name: "VectorReconstruction",
  setup() {
    const uploadData = ref({
      pointCloudFileList: [],
      alphaShapeFileList: [],
    });

    const results = ref({
      surfaceResult: false,
      cellsResult: false,
    });

    const isReady = ref(false);

    const handlePointCloudChange = (file, fileList) => {
      uploadData.value.pointCloudFileList = fileList;
    };

    const handleAlphaShapeChange = (file, fileList) => {
      uploadData.value.alphaShapeFileList = fileList;
    };

    const runAlgorithm = () => {
      if (
        uploadData.value.pointCloudFileList.length > 0 &&
        uploadData.value.alphaShapeFileList.length > 0
      ) {
        results.value.surfaceResult = true;
        results.value.cellsResult = true;
        isReady.value = false; // 重置状态
      } else {
        alert("请先上传所有必要的文件！");
      }
    };

    watch(
      () => uploadData.value.pointCloudFileList.length,
      (newVal) => {
        isReady.value =
          newVal > 0 && uploadData.value.alphaShapeFileList.length > 0;
      }
    );

    watch(
      () => uploadData.value.alphaShapeFileList.length,
      (newVal) => {
        isReady.value =
          newVal > 0 && uploadData.value.pointCloudFileList.length > 0;
      }
    );

    return {
      uploadData,
      results,
      handlePointCloudChange,
      handleAlphaShapeChange,
      runAlgorithm,
      isReady,
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