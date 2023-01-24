import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";
import fragmentMask from "./shader/fragmentMask.glsl";
import * as dat from "lil-gui";
import { TextureLoader } from "three";
import createInputEvents from "simple-input-events";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { CurtainShader } from "./effect1";
import { RGBAShader } from "./effect2";

gsap.registerPlugin(ScrollTrigger);

export class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.gallery = options.gallery;
    this.textures = this.gallery;
    this.maskTexture = options.mask;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.Xaspect = this.width / this.height;
    this.Yaspect = this.height / this.width;
    this.imageXAspect =
      this.gallery[0].source.data.width / this.gallery[0].source.data.height;
    this.imageYAspect =
      this.gallery[0].source.data.height / this.gallery[0].source.data.width;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.time = 0;
    this.isPlaying = true;

    this.event = createInputEvents(this.renderer.domElement);

    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();

    this.settings();
    this.addObjects();
    this.addCamera();
    this.initPost();
    this.resize();
    this.render();
    this.setupResize();
    this.events();
  }

  initPost() {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.effectPass = new ShaderPass(CurtainShader);
    this.composer.addPass(this.effectPass);

    this.effectPass1 = new ShaderPass(RGBAShader);
    this.composer.addPass(this.effectPass1);
  }

  events() {
    this.event.on("move", ({ uv }) => {
      this.mouse.x = uv[0] - 0.5;
      this.mouse.y = uv[1] - 0.5;
    });
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      progress1: 0,
      runAnimation: () => {
        this.runAnimation();
      },
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "runAnimation");
    this.gui.add(this.settings, "progress1", 0, 1, 0.01).onChange((val) => {
      this.effectPass.uniforms.uProgress.value = val;
    });
  }

  runAnimation() {
    console.log((this.groups.length - 1) * 2.5, this.camera.position.x);
    const tl = gsap.timeline();
    if (this.camera.position.x == (this.groups.length - 1) * 2.5) {
      console.log('match')
      tl.to(this.camera.position, {
        // x: "+=2.5",
        x: 0,
        duration: 2,
        ease: "power4.inOut",
      });
    } else {
      tl.to(this.camera.position, {
        x: "+=2.5",
        // x: 2.5,
        duration: 2,
        ease: "power4.inOut",
      });
    }
    tl.to(
      this.camera.position,
      {
        z: 1,
        duration: 1,
        ease: "power4.inOut",
      },
      0
    );
    tl.to(
      this.camera.position,
      {
        z: 2,
        duration: 1,
        ease: "power4.inOut",
      },
      1
    );

    tl.to(
      this.effectPass.uniforms.uProgress,
      {
        value: 1,
        duration: 1,
        ease: "power3.inOut",
      },
      0
    );
    tl.to(
      this.effectPass.uniforms.uProgress,
      {
        value: 0,
        duration: 1,
        ease: "power3.inOut",
      },
      1
    );

    tl.to(
      this.effectPass1.uniforms.uProgress,
      {
        value: 1,
        duration: 1,
        ease: "power3.inOut",
      },
      0
    );
    tl.to(
      this.effectPass1.uniforms.uProgress,
      {
        value: 0,
        duration: 1,
        ease: "power3.inOut",
      },
      1
    );
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.Xaspect = this.width / this.height;
    this.Yaspect = this.height / this.width;
    this.imageXAspect =
      this.gallery[0].source.data.width / this.gallery[0].source.data.height;
    this.imageYAspect =
      this.gallery[0].source.data.height / this.gallery[0].source.data.width;
    this.groups.forEach((g) => {
      g.children.forEach((m) => {
        m.material.uniforms.uXAspect.value = this.Xaspect / this.imageXAspect;
        m.material.uniforms.uYAspect.value = this.Yaspect / this.imageYAspect;
      });
    });
    this.camera.aspect = this.width / this.height;

    const dist = this.camera.position.z; //perspectiveで画面いっぱいにオブジェクトを映す場合
    const height = 1 * 0.999; //カメラを少し近づける
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist)); //perspectiveで画面いっぱいにオブジェクトを映す場合

    if (this.Xaspect > 1) {
      //perspectiveで画面いっぱいにオブジェクトを映す場合
      this.groups.forEach((g) => {
        g.scale.x = this.Xaspect;
      });
    } else {
      // this.plane.scale.y = this.Yaspect;
      this.groups.forEach((g) => {
        g.scale.y = this.Yaspect;
      });
    }

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);

    this.camera.updateProjectionMatrix();
  }

  addCamera() {
    const fov = 60;
    const fovRad = (fov / 2) * (Math.PI / 180);
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.width / this.height,
      0.001,
      5000
    );
    this.camera.position.set(0, 0, 2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.groups = [];
    this.textures.forEach((t, j) => {
      let group = new THREE.Group();
      this.scene.add(group);
      this.groups.push(group);
      for (let i = 0; i < 6; i++) {
        // let m = new THREE.MeshBasicMaterial({
        //   map: t,
        // });
        let m = new THREE.ShaderMaterial({
          extensions: {
            derivatives: "#extension GL_OES_standard_derivatives:",
          },
          side: THREE.DoubleSide,
          uniforms: {
            time: {
              value: 0,
            },
            uXAspect: {
              value: this.Xaspect / this.imageXAspect,
            },
            uYAspect: {
              value: this.Yaspect / this.imageYAspect,
            },
            progress: {
              value: 0,
            },
            uTexture: {
              value: t,
            },
          },
          transparent: true,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
        });
        if (i > 0) {
          // m = new THREE.MeshBasicMaterial({
          //   map: t,
          //   alphaMap: this.maskTexture,
          //   transparent: true,
          // });
          m = new THREE.ShaderMaterial({
            extensions: {
              derivatives: "#extension GL_OES_standard_derivatives:",
            },
            side: THREE.DoubleSide,
            uniforms: {
              time: {
                value: 0,
              },
              uXAspect: {
                value: this.Xaspect / this.imageXAspect,
              },
              uYAspect: {
                value: this.Yaspect / this.imageYAspect,
              },
              progress: {
                value: 0,
              },
              uTexture: {
                value: t,
              },
              uMaskTexture: {
                value: this.maskTexture,
              },
            },
            transparent: true,
            vertexShader: vertexShader,
            fragmentShader: fragmentMask,
          });
        }
        const mesh = new THREE.Mesh(this.geometry, m);
        mesh.position.z = (i + 1) * 0.1;

        group.add(mesh);
        group.position.x = j * 2.5;
      }
    });
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) {
      return;
    }
    const elapsedTime = this.clock.getElapsedTime();
    this.time = elapsedTime;

    this.oscillator = Math.sin(this.time * 0.1) * 0.5 + 0.5;

    this.mouseTarget.lerp(this.mouse, 0.05);
    this.groups.forEach((g) => {
      g.rotation.x = -this.mouseTarget.y * 0.3;
      g.rotation.y = this.mouseTarget.x * 0.3;

      g.children.forEach((m, i) => {
        m.position.z = (i + 1) * 0.15 - this.oscillator * 0.25;
      });
    });
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}
