import "./styles/index.scss";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { gsap } from "gsap";

export default class Sketch {
  constructor(canvas) {
    this.canvas = canvas;

    //Sizes
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.resize = () => this.onResize();
    this.mousemove = (e) => this.onMousemove(e);
  }

  init() {
    this.addListeners();
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLoader();

    this.loadModel().then(() => {
      this.renderer.setAnimationLoop(() => {
        this.render();
        this.update();
      });
    });
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 4);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
    });

    document.body.appendChild(this.renderer.domElement);

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.physicallyCorrectLights = true;
  }

  createLoader() {
    this.gltfLoader = new GLTFLoader();
  }

  loadModel() {
    return new Promise((resolve) => {
      this.gltfLoader.load("models/brain.glb", (gltf) => {
        const brain = gltf.scene.children[0];
        this.scene.add(brain);

        resolve();
      });
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    this.camera.position.z = this.isMobile ? 2 : 1.2;
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 767;
  }

  onResize() {
    //Update sizes
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    //Update camera
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    //Update renderer
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    //Check mobile
    this.checkMobile();
  }

  onMousemove(e) {
    const x = (e.clientX / this.width) * 2 - 1;
    const y = -((e.clientY / this.height) * 2 - 1);

    gsap.to(this.camera.position, {
      x: () => x * 0.1,
      y: () => y * 0.1,
      duration: 0.5,
    });
  }

  addListeners() {
    window.addEventListener("resize", this.resize, { passive: true });
    window.addEventListener("mousemove", this.mousemove, { passive: true });
  }
}

new Sketch().init();
