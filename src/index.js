import "./styles/index.scss";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
import { gsap } from "gsap";
import * as dat from "lil-gui";

export default class Sketch {
  constructor(container) {
    this.container = document.querySelector(container);

    //Sizes
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    //Colors
    const color1 = getComputedStyle(document.documentElement).getPropertyValue(
      "--clr-1"
    );
    const color2 = getComputedStyle(document.documentElement).getPropertyValue(
      "--clr-2"
    );
    const color3 = getComputedStyle(document.documentElement).getPropertyValue(
      "--clr-3"
    );
    const color4 = getComputedStyle(document.documentElement).getPropertyValue(
      "--clr-4"
    );
    const color5 = getComputedStyle(document.documentElement).getPropertyValue(
      "--clr-5"
    );

    const value1 = parseInt(color1.replace("#", "0x"), 16);
    const value2 = parseInt(color2.replace("#", "0x"), 16);
    const value3 = parseInt(color3.replace("#", "0x"), 16);
    const value4 = parseInt(color4.replace("#", "0x"), 16);

    this.colors = [
      new THREE.Color(value1),
      new THREE.Color(value2),
      new THREE.Color(value3),
      new THREE.Color(value4),
    ];

    this.debugObject = {};
    this.debugObject.colorBg = color4;

    //Hover parameters
    this.hover = false;

    this.uniforms = {
      uHover: 0,
      maxHover: 1,
    };

    this.resize = () => this.onResize();
    this.mousemove = (e) => this.onMousemove(e);
  }

  init() {
    this.addListeners();
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLoader();
    this.createRaycaster();
    this.checkMobile();
    this.addDebugPanel();

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
    this.camera.position.set(0, 0, 1.2);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      // canvas: this.canvas,
      alpha: true,
      antialias: true,
      // antialias: window.devicePixelRatio === 1,
    });

    this.container.appendChild(this.renderer.domElement);

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
        this.brain = gltf.scene.children[0];

        // this.geometry = new THREE.ConeGeometry(0.003, 0.005, 10);
        // this.geometry = new THREE.IcosahedronGeometry(0.002, 1);
        // this.geometry = new THREE.OctahedronGeometry(0.003, 1);
        this.geometry = new THREE.TetrahedronGeometry(0.003, 1);
        this.material = new THREE.ShaderMaterial({
          wireframe: true,
          vertexShader: require("./static/shaders/brain.vertex.glsl"),
          fragmentShader: require("./static/shaders/brain.fragment.glsl"),
          uniforms: {
            uColor: { value: new THREE.Color() },
            uPointer: { value: new THREE.Vector3() },
            uSize: { value: 0 },
            uRotation: { value: 0 },
            uHover: { value: this.uniforms.uHover },
          },
        });

        this.count = this.brain.geometry.attributes.position.count;

        this.instancedMesh = new InstancedUniformsMesh(
          this.geometry,
          this.material,
          this.count
        );

        this.scene.add(this.instancedMesh);

        const dummy = new THREE.Object3D();

        const positions = this.brain.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          dummy.position.set(
            positions[i + 0],
            positions[i + 1],
            positions[i + 2]
          );

          dummy.updateMatrix();

          this.instancedMesh.setMatrixAt(i / 3, dummy.matrix);

          this.instancedMesh.setUniformAt(
            "uSize",
            i / 3,
            THREE.MathUtils.randFloat(3, 0.3)
          );
          this.instancedMesh.setUniformAt(
            "uRotation",
            i / 3,
            THREE.MathUtils.randFloat(1, -1)
          );

          const colorIndex = THREE.MathUtils.randInt(0, this.colors.length - 1);
          this.instancedMesh.setUniformAt(
            "uColor",
            i / 3,
            this.colors[colorIndex]
          );
        }

        this.gui.add(this.material, "wireframe");

        resolve();
      });
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    this.camera.lookAt(new THREE.Vector3());
    this.camera.position.z = this.isMobile ? 1.8 : 1;
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

  createRaycaster() {
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();
    this.intersects = [];
  }

  animateUniformsHover(value) {
    gsap.to(this.uniforms, {
      uHover: value,
      duration: 0.3,
      onUpdate: () => {
        for (let i = 0; i < this.instancedMesh.count; i++) {
          this.instancedMesh.setUniformAt("uHover", i, this.uniforms.uHover);
        }
      },
    });
  }

  onMousemove(e) {
    const x = (e.clientX / this.width) * 2 - 1;
    const y = -((e.clientY / this.height) * 2 - 1);

    this.mouse.set(x, y);

    gsap.to(this.camera.position, {
      x: () => x * 0.15,
      y: () => y * 0.1,
      duration: 0.5,
    });

    this.raycaster.setFromCamera(this.mouse, this.camera);

    this.intersects = this.raycaster.intersectObject(this.brain);

    if (this.intersects.length === 0) {
      //   console.log("mouseleave");
      if (this.hover) {
        this.hover = false;
        this.animateUniformsHover(0);
      }
    } else {
      //   console.log("mouseenter");
      if (!this.hover) {
        this.hover = true;
        this.animateUniformsHover(this.uniforms.maxHover);
      }

      gsap.to(this.point, {
        x: () => this.intersects[0]?.point.x || 0,
        y: () => this.intersects[0]?.point.y || 0,
        z: () => this.intersects[0]?.point.z || 0,
        overwrite: true,
        duration: 0.3,
        onUpdate: () => {
          for (let i = 0; i < this.instancedMesh.count; i++) {
            this.instancedMesh.setUniformAt("uPointer", i, this.point);
          }
        },
      });
    }
  }

  addListeners() {
    window.addEventListener("resize", this.resize, { passive: true });
    window.addEventListener("mousemove", this.mousemove, { passive: true });
  }

  addDebugPanel() {
    //Debug
    this.gui = new dat.GUI({ touchStyles: false });

    this.gui
      .addColor(this.debugObject, "colorBg")
      .onChange(() => {
        document.body.style.background = `radial-gradient(circle, ${
          this.debugObject.colorBg + "da"
        } 20%, ${this.debugObject.colorBg} 65%)`;
      })
      .name("backgroundColor");

    this.gui
      .add(this.uniforms, "maxHover")
      .min(0.5)
      .max(2)
      .step(0.001)
      .name("hover size")
      .onFinishChange(() => {
        this.material.uniforms.uHover.value = this.uniforms.maxHover;
      });
  }
}

new Sketch("#app").init();
