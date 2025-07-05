<template>
  <div ref="containerRef" style="height: 100vh; width: 100vw;"></div>
</template>

<script>
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let containerRef = null;
let scene = null;
let renderer = null;
let controls = null;

export default {
  name: 'PointCloudViewer',
  data() {
    return {
    };
  },
  mounted() {
    this.initThree();
    this.loadPLYModel('static/semanticSegmentation/semantic_2.ply');
  },
  methods: {
    initThree() {
      containerRef = this.$refs.containerRef;
      scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        containerRef.clientWidth / containerRef.clientHeight,
        0.1,
        1000
      );
      this.camera.position.z = 5;
      const ambientLight = new THREE.AmbientLight(0x404040); // 柔和的白色光
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 白色光，强度为1
      directionalLight.position.set(1, 1, 1); // 设置光源位置
      scene.add(directionalLight);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(containerRef.clientWidth, containerRef.clientHeight);
      containerRef.appendChild(renderer.domElement);

      controls = new OrbitControls(this.camera, renderer.domElement);
      this.animate();
    },
    loadPLYModel(url) {
      const loader = new PLYLoader();
      loader.load(url, (geometry) => {
        const material = new THREE.PointsMaterial({ size: 0.01, vertexColors: true });
        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const box = new THREE.Box3().setFromObject(points);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        this.camera.position.set(center.x, center.y, maxDim * 1.5);
        controls.target.set(center.x, center.y, center.z);
        controls.update();
      });
    },
    animate() {
      requestAnimationFrame(this.animate);
      renderer.render(scene, this.camera);
    },
  },
};
</script>