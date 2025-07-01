<template>
  <div class="app-container">
    <div class="header">
      <h1>数字孪生校园算法实验平台</h1>
    </div>
    <div class="content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="语义分割算法" name="SemanticSegmentation">
          <SemanticSegmentation/>
        </el-tab-pane>
        <el-tab-pane label="实例分割算法" name="InstanceSegmentation">
          <InstanceSegmentation/>
        </el-tab-pane>
        <el-tab-pane label="纹理映射算法" name="TextureMapping">
          <TextureMapping/>
        </el-tab-pane>
        <el-tab-pane label="矢量重建算法" name="VectorReconstruction">
          <VectorReconstruction/>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import SemanticSegmentation from './components/SemanticSegmentation/SemanticSegmentation.vue'
import InstanceSegmentation from './components/InstanceSegmentation/InstanceSegmentation.vue'
import TextureMapping from './components/TextureMapping/TextureMapping.vue'
import VectorReconstruction from './components/VectorReconstruction/VectorReconstruction.vue'

export default {
  components: {
    SemanticSegmentation,
    InstanceSegmentation,
    TextureMapping,
    VectorReconstruction
  },
  data() {
    return {
      activeTab: 'SemanticSegmentation',
    }
  },
  methods: {

  }
}
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 98vh;
}
.header {
  background-color: #409eff;
  color: white;
  padding: 10px;
  text-align: center;
}
.content {
  flex: 1;
  padding: 20px;
}
</style>