import "./styles/index.scss";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
import { gsap } from "gsap";

export default class Sketch {
  constructor(canvas) {
    this.canvas = canvas;

    //Sizes
    this.width = window.innerWidth;
    this.height = window.innerHeight;

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

    this.colors = [
      new THREE.Color(color1),
      new THREE.Color(color2),
      new THREE.Color(color3),
      new THREE.Color(color4),
    ];

    //Hover parameter
    this.uniforms = {
      uHover: 0,
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
        this.brain = gltf.scene.children[0];
        // this.scene.add(brain);

        this.geometry = new THREE.ConeGeometry(0.003, 0.005, 10);
        // this.geometry = new THREE.IcosahedronGeometry(0.005, 1);
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

    gsap.to(this.camera.position, {
      x: () => x * 0.1,
      y: () => y * 0.1,
      duration: 0.5,
    });

    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.intersects = this.raycaster.intersectObject(this.brain);

    if (this.intersects.length === 0) {
      //   console.log("mouseleave");
      this.animateUniformsHover(0);
    } else {
      //   console.log("mouseenter");
      this.animateUniformsHover(1);

      gsap.to(this.point, {
        x: () => this.intersects[0]?.point.x,
        y: () => this.intersects[0]?.point.y,
        z: () => this.intersects[0]?.point.z,
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
}

new Sketch().init();
