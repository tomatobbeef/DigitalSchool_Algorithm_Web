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
  import * as THREE from 'three'
  import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
  import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  
  let scene, camera, renderer, controls, model;

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
        },
        // Three.js 相关变量
        currentModelPath: {
          obj: '/model/vis2mesh_sim_MakeDense.obj',
          mtl: '/model/vis2mesh_sim_MakeDense.mtl'
        }
      }
    },
    mounted() {
      this.$nextTick(() => {
        this.initThreeJS()
        this.loadOBJModel()
      })
    },
    beforeDestroy() {
      this.cleanup()
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
        
        // 模拟算法运行后生成新的模型文件
        // 在实际应用中，这里会调用后端API处理算法，然后返回新的obj/mtl文件路径
        setTimeout(() => {
          // 模拟算法完成后更新模型路径
          this.currentModelPath = {
            obj: '/model/vis2mesh_sim_MakeDense.obj', // 这里应该是算法生成的新模型路径
            mtl: '/model/vis2mesh_sim_MakeDense.mtl'  // 这里应该是算法生成的新材质路径
          }
          
          // 重新加载模型
          this.loadOBJModel()
          
          console.log('算法完成，模型已更新')
        }, 2000) // 模拟2秒的算法处理时间
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
  }
  .box-card {
    width: 100%;
  }

  </style>