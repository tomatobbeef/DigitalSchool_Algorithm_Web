<template>
    <div class="texture-mapping-container">
      <h2>纹理映射算法操作界面</h2>
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>文件上传</span>
        </div>
        <div>
          <el-upload
            class="upload-demo"
            action="https://jsonplaceholder.typicode.com/posts/"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :file-list="fileList"
            list-type="text"
          >
            <el-button size="small" type="primary">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">支持上传.nvm、.ply、.jpg、.cam格式文件</div>
          </el-upload>
        </div>
      </el-card>
  
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>参数配置</span>
        </div>
        <div>
          <el-form label-width="150px">
            <el-form-item label="映射方法">
              <el-select v-model="algorithmParams.method_type" placeholder="请选择映射方法">
                <el-option label="MRF" value="mrf"></el-option>
                <el-option label="Projection" value="projection"></el-option>
                <el-option label="SubMRF" value="submrf"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="MRF库选择">
              <el-select v-model="algorithmParams.mrf_call_lib" placeholder="请选择MRF库">
                <el-option label="MAPMAP" value="mapmap"></el-option>
                <el-option label="OpenMVS" value="openmvs"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="异常点移除策略">
              <el-select v-model="algorithmParams.outlier_removal" placeholder="请选择异常点移除策略">
                <el-option label="None" value="none"></el-option>
                <el-option label="Gauss Clamping" value="gauss_clamping"></el-option>
                <el-option label="Gauss Damping" value="gauss_damping"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="稀疏模型标识">
              <el-switch v-model="algorithmParams.sparse_model"></el-switch>
            </el-form-item>
            <el-form-item label="纹理质量">
              <el-slider v-model="algorithmParams.textureQuality"></el-slider>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="runAlgorithm">运行算法</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
  
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>结果展示</span>
        </div>
        <div>
          <canvas id="resultCanvas" width="600" height="400"></canvas>
        </div>
      </el-card>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fileList: [],
        algorithmParams: {
          method_type: 'mrf',
          mrf_call_lib: 'mapmap',
          outlier_removal: 'none',
          sparse_model: false,
          textureQuality: 50
        }
      }
    },
    methods: {
      handleRemove(file, fileList) {
        console.log(file, fileList)
      },
      handlePreview(file) {
        console.log(file)
      },
      runAlgorithm() {
        // 这里可以添加运行算法的逻辑
        console.log('运行纹理映射算法', this.algorithmParams)
        // 模拟结果展示
        const canvas = document.getElementById('resultCanvas')
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.font = '20px Arial'
        ctx.fillStyle = 'black'
        ctx.fillText('纹理映射结果', 10, 50)
      }
    }
  }
  </script>
  
  <style>
  .texture-mapping-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .box-card {
    width: 100%;
  }
  </style>