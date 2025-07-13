<template>
    <div class="texture-mapping-container">
      <h2>纹理映射算法操作界面</h2>
      
      <!-- 文件上传区域 -->
      <el-card class="box-card">
        <div class="clearfix">
          <span>文件上传</span>
        </div>
        <div>
          <!-- JPG文件上传 -->
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handleJpgUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeJpgUpload"
            :file-list="jpgFileList"
            list-type="text"
            multiple
            accept=".jpg,.jpeg"
          >
            <el-button size="small" type="primary">上传JPG照片</el-button>
            <div class="el-upload__tip">支持上传.jpg格式的照片文件（最多150张）</div>
          </el-upload>
          
          <!-- CAM文件上传 -->
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handleCamUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeCamUpload"
            :file-list="camFileList"
            list-type="text"
            multiple
            accept=".cam"
            style="margin-top: 20px;"
          >
            <el-button size="small" type="primary">上传CAM相机参数</el-button>
            <div class="el-upload__tip">支持上传.cam格式的相机参数文件（最多150个）</div>
          </el-upload>
          
          <!-- PLY文件上传 -->
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handlePlyUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforePlyUpload"
            :file-list="plyFileList"
            list-type="text"
            accept=".ply"
            style="margin-top: 20px;"
          >
            <el-button size="small" type="primary">上传PLY模型</el-button>
            <div class="el-upload__tip">支持上传.ply格式的3D模型文件（1个）</div>
          </el-upload>
        </div>
      </el-card>

      <!-- Texrecon参数配置 -->
      <el-card class="box-card">
        <div class="clearfix">
          <span>Texrecon参数配置</span>
        </div>
        <div>
          <el-form label-width="150px">
            <el-form-item label="数据项类型">
              <el-select v-model="texreconParams.data_term" placeholder="请选择数据项类型">
                <el-option label="Area" value="area"></el-option>
                <el-option label="GMI" value="gmi"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="光滑性约束">
              <el-select v-model="texreconParams.smoothness_term" placeholder="请选择光滑性约束">
                <el-option label="Potts" value="potts"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="离群值移除">
              <el-select v-model="texreconParams.outlier_removal" placeholder="请选择离群值移除">
                <el-option label="None" value="none"></el-option>
                <el-option label="Gauss Damping" value="gauss_damping"></el-option>
                <el-option label="Gauss Clamping" value="gauss_clamping"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="色调映射">
              <el-select v-model="texreconParams.tone_mapping" placeholder="请选择色调映射">
                <el-option label="None" value="none"></el-option>
                <el-option label="Gamma" value="gamma"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="跳过几何可见性测试">
              <el-switch v-model="texreconParams.skip_geometric_visibility_test"></el-switch>
            </el-form-item>
            <el-form-item label="跳过全局缝隙优化">
              <el-switch v-model="texreconParams.skip_global_seam_leveling"></el-switch>
            </el-form-item>
            <el-form-item label="跳过局部缝隙优化">
              <el-switch v-model="texreconParams.skip_local_seam_leveling"></el-switch>
            </el-form-item>
            <el-form-item label="输出各步骤耗时">
              <el-switch v-model="texreconParams.write_timings"></el-switch>
            </el-form-item>
            <el-form-item label="不输出中间结果">
              <el-switch v-model="texreconParams.no_intermediate_results"></el-switch>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="runTexreconAlgorithm" :loading="isProcessing">运行Texrecon算法</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>

      <!-- 处理进度 -->
      <el-card class="box-card" v-if="isProcessing">
        <div class="clearfix">
          <span>处理进度</span>
        </div>
        <div>
          <el-progress :percentage="progressPercentage" :status="progressStatus"></el-progress>
          <div class="progress-message">{{ progressMessage }}</div>
        </div>
      </el-card>

      <!-- 结果展示 -->
      <el-card class="box-card">
        <div class="clearfix">
          <span>结果展示</span>
        </div>
        <div>
          <canvas id="resultCanvas" width="600" height="400"></canvas>
        </div>
      </el-card>
    </div>
  </template>

  <script>
  import * as THREE from 'three'
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
  import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  
  let scene, camera, renderer, controls, model;

  export default {
    data() {
      return {
        uploadUrl: 'http://localhost:3000/upload',
        jpgFileList: [],
        camFileList: [],
        plyFileList: [],
        uploadedFiles: {
          jpg: [],
          cam: [],
          ply: null
        },
        texreconParams: {
          data_term: 'gmi',
          smoothness_term: 'potts',
          outlier_removal: 'none',
          tone_mapping: 'none',
          skip_geometric_visibility_test: false,
          skip_global_seam_leveling: false,
          skip_local_seam_leveling: false,
          write_timings: false,
          no_intermediate_results: false
        },
        isProcessing: false,
        progressPercentage: 0,
        progressStatus: '',
        progressMessage: '',
        // Three.js 相关变量
        currentModelPath: {
          obj: '/model/vis2mesh_sim_MakeDense.obj',
          mtl: '/model/vis2mesh_sim_MakeDense.mtl'
        },
        websocket: null
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.initThreeJS()
        this.loadOBJModel()
        this.initWebSocket()
      })
    },
    beforeDestroy() {
      this.cleanup()
      if (this.websocket) {
        this.websocket.close()
      }
    },
    methods: {
      // 文件上传相关方法
      beforeJpgUpload(file) {
        const isJPG = file.type === 'image/jpeg' || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')
        const isLt100M = file.size / 1024 / 1024 < 100
        if (!isJPG) {
          this.$message.error('只能上传JPG格式的文件!')
          return false
        }
        if (!isLt100M) {
          this.$message.error('文件大小不能超过100MB!')
          return false
        }
        if (this.jpgFileList.length >= 150) {
          this.$message.error('最多只能上传150张JPG照片!')
          return false
        }
        return true
      },
      
      beforeCamUpload(file) {
        const isCAM = file.name.endsWith('.cam')
        const isLt1M = file.size / 1024 / 1024 < 1
        if (!isCAM) {
          this.$message.error('只能上传CAM格式的文件!')
          return false
        }
        if (!isLt1M) {
          this.$message.error('文件大小不能超过1MB!')
          return false
        }
        if (this.camFileList.length >= 150) {
          this.$message.error('最多只能上传150个CAM文件!')
          return false
        }
        return true
      },
      
      beforePlyUpload(file) {
        const isPLY = file.name.endsWith('.ply')
        const isLt100M = file.size / 1024 / 1024 < 100
        if (!isPLY) {
          this.$message.error('只能上传PLY格式的文件!')
          return false
        }
        if (!isLt100M) {
          this.$message.error('文件大小不能超过100MB!')
          return false
        }
        if (this.plyFileList.length >= 1) {
          this.$message.error('只能上传1个PLY文件!')
          return false
        }
        return true
      },
      
      handleJpgUploadSuccess(response, file, fileList) {
        this.uploadedFiles.jpg.push({
          name: file.name,
          path: response.url
        })
        this.$message.success(`JPG文件 ${file.name} 上传成功`)
      },
      
      handleCamUploadSuccess(response, file, fileList) {
        this.uploadedFiles.cam.push({
          name: file.name,
          path: response.url
        })
        this.$message.success(`CAM文件 ${file.name} 上传成功`)
      },
      
      handlePlyUploadSuccess(response, file, fileList) {
        this.uploadedFiles.ply = {
          name: file.name,
          path: response.url
        }
        this.$message.success(`PLY文件 ${file.name} 上传成功`)
      },
      
      handleUploadError(err, file, fileList) {
        this.$message.error(`文件 ${file.name} 上传失败`)
      },

      // WebSocket初始化
      initWebSocket() {
        this.websocket = new WebSocket('ws://localhost:8081')
        
        this.websocket.onopen = () => {
          console.log('WebSocket连接已建立')
        }
        
        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.type === 'process') {
            this.progressMessage = data.message
            this.progressPercentage = Math.min(this.progressPercentage + 5, 95)
          } else if (data.type === 'done') {
            this.progressPercentage = 100
            this.progressStatus = 'success'
            this.progressMessage = '算法处理完成'
            this.isProcessing = false
            this.loadGeneratedModel()
          } else if (data.type === 'error') {
            this.handleWebSocketError(data.message)
          } else if (data.type === 'warning') {
            this.$message.warning(data.message)
          }
        }
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket错误:', error)
        }
        
        this.websocket.onclose = () => {
          console.log('WebSocket连接已关闭')
        }
      },

      // 运行Texrecon算法
      async runTexreconAlgorithm() {
        // 检查文件上传情况
        if (this.uploadedFiles.jpg.length === 0) {
          this.$message.error('请至少上传一张JPG照片')
          return
        }
        if (this.uploadedFiles.cam.length === 0) {
          this.$message.error('请至少上传一个CAM相机参数文件')
          return
        }
        if (!this.uploadedFiles.ply) {
          this.$message.error('请上传PLY模型文件')
          return
        }
        
        this.isProcessing = true
        this.progressPercentage = 0
        this.progressStatus = ''
        this.progressMessage = '开始处理...'
        
        try {
          const response = await fetch('http://localhost:3000/run_texrecon', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jpgFiles: this.uploadedFiles.jpg,
              camFiles: this.uploadedFiles.cam,
              plyFile: this.uploadedFiles.ply,
              params: this.texreconParams
            })
          })
          
          if (!response.ok) {
            throw new Error('算法启动失败')
          }
          
          this.$message.success('算法已启动，请等待处理完成')
          
        } catch (error) {
          console.error('运行算法失败:', error)
          this.$message.error('算法启动失败: ' + error.message)
          this.isProcessing = false
        }
      },

      // 加载生成的模型
      loadGeneratedModel() {
        // 更新模型路径为算法生成的文件
        this.currentModelPath = {
          obj: '/output/texrecon.obj',
          mtl: '/output/texrecon.mtl'
        }
        
        // 重新加载模型
        this.loadOBJModel()
        this.$message.success('模型已更新')
      },

      // 处理WebSocket错误消息
      handleWebSocketError(message) {
        this.progressStatus = 'exception'
        this.progressMessage = '处理失败: ' + message
        this.isProcessing = false
        this.$message.error('算法处理失败: ' + message)
      },

      // Three.js 相关方法
      initThreeJS() {
        const canvas = document.getElementById('resultCanvas')
        
        // 创建场景
        scene = new THREE.Scene()
        scene.background = new THREE.Color(0xf0f0f0)
        
        // 创建摄像机
        camera = new THREE.PerspectiveCamera(
          75,
          canvas.width / canvas.height,
          0.1,
          10000
        )
        camera.position.set(0, 0, 1000)
        
        // 创建渲染器
        renderer = new THREE.WebGLRenderer({ 
          canvas: canvas,
          antialias: true 
        })
        renderer.setSize(canvas.width, canvas.height)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        
        // 创建控制器
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        
        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
        scene.add(ambientLight)
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(1000, 1000, 1000)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048
        scene.add(directionalLight)
        
        // 添加辅助网格
        const gridHelper = new THREE.GridHelper(1000, 20)
        scene.add(gridHelper)
        
        // 开始渲染循环
        this.animate()
      },

      loadOBJModel() {
        // 清理当前模型
        if (model) {
          scene.remove(model)
          model = null
        }
        
        console.log('开始加载OBJ模型...', this.currentModelPath.obj)
        
        // 创建MTL加载器
        const mtlLoader = new MTLLoader()
        const mtlPath = this.currentModelPath.mtl
        const objPath = this.currentModelPath.obj
        
        // 设置材质文件路径
        const mtlDir = mtlPath.substring(0, mtlPath.lastIndexOf('/') + 1)
        const mtlFile = mtlPath.substring(mtlPath.lastIndexOf('/') + 1)
        mtlLoader.setPath(mtlDir)
        
        // 加载材质文件
        mtlLoader.load(
          mtlFile,
          (materials) => {
            console.log('材质加载成功:', materials)
            materials.preload()
            
            // 创建OBJ加载器
            const objLoader = new OBJLoader()
            objLoader.setMaterials(materials)
            objLoader.setPath(mtlDir)
            
            // 加载OBJ文件
            const objFile = objPath.substring(objPath.lastIndexOf('/') + 1)
            objLoader.load(
              objFile,
              (object) => {
                console.log('OBJ模型加载成功:', object)
                model = object
                this.processLoadedModel(object)
              },
              (progress) => {
                console.log('OBJ加载进度:', (progress.loaded / progress.total * 100) + '%')
              },
              (error) => {
                console.error('OBJ加载失败:', error)
                this.loadOBJWithoutMaterial()
              }
            )
          },
          (progress) => {
            console.log('MTL加载进度:', (progress.loaded / progress.total * 100) + '%')
          },
          (error) => {
            console.error('MTL加载失败:', error)
            this.loadOBJWithoutMaterial()
          }
        )
      },

      loadOBJWithoutMaterial() {
        console.log('尝试不加载材质的方式加载OBJ...')
        
        const objLoader = new OBJLoader()
        const objPath = this.currentModelPath.obj
        const objDir = objPath.substring(0, objPath.lastIndexOf('/') + 1)
        const objFile = objPath.substring(objPath.lastIndexOf('/') + 1)
        
        objLoader.setPath(objDir)
        
        objLoader.load(
          objFile,
          (object) => {
            console.log('OBJ模型加载成功（无材质）:', object)
            model = object
            
            // 为模型添加默认材质
            object.traverse((child) => {
              if (child.isMesh) {
                child.material = new THREE.MeshLambertMaterial({ 
                  color: 0x808080,
                  side: THREE.DoubleSide
                })
                child.castShadow = true
                child.receiveShadow = true
              }
            })
            
            this.processLoadedModel(object)
          },
          (progress) => {
            console.log('OBJ加载进度:', (progress.loaded / progress.total * 100) + '%')
          },
          (error) => {
            console.error('OBJ加载失败:', error)
          }
        )
      },

      processLoadedModel(object) {
        // 计算包围盒
        const box = new THREE.Box3().setFromObject(object)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        console.log('模型中心:', center)
        console.log('模型尺寸:', size)
        
        // 调整模型位置和缩放
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 1000 / maxDim
        object.scale.setScalar(scale)
        
        // 将模型居中
        object.position.sub(center.multiplyScalar(scale))
        
        // 添加到场景
        scene.add(object)
        
        // 设置摄像机位置
        this.setupCameraForModel(box, scale)
        
        // 为模型添加阴影
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
      },

      setupCameraForModel(box, scale) {
        const size = box.getSize(new THREE.Vector3())
        const distance = Math.max(size.x, size.y, size.z) * scale * 2
        
        camera.position.set(distance, distance, distance)
        camera.lookAt(0, 0, 0)
        
        controls.target.set(0, 0, 0)
        controls.update()
      },

      animate() {
        requestAnimationFrame(this.animate)
        if (controls) {
          controls.update()
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera)
        }
      },

      cleanup() {
        if (renderer) {
          renderer.dispose()
        }
      }
    }
  }
  </script>
  
  <style>
  .texture-mapping-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  .box-card {
    width: 100%;
  }
  .upload-demo {
    margin-bottom: 20px;
  }
  .progress-message {
    margin-top: 10px;
    font-size: 14px;
    color: #666;
  }
  #resultCanvas {
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  </style>