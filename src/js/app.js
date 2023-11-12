import * as THREE from "three";
import * as CANNON from "cannon-es";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function () {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.setClearColor(0x333333);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 부드러운 그림자

  const container = document.querySelector("#container");

  container.appendChild(renderer.domElement);

  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    canvasSize.width / canvasSize.height,
    0.1,
    100
  );
  camera.position.set(5, 7, 5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  const world = new CANNON.World();
  // SAPBroadphase 두 물체간의 충돌 가능성을 계산하고 제어할 수 있음
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.gravity.set(0, -9.82, 0); // y축 방향으로 중력 작용
  world.allowSleep = true; // 물리 객체가 정지 상태일 때 자동으로 잠자기 모드 허용

  const worldObjects = [];
  const floorMaterial = new CANNON.Material("floor"); // 이름을 floor로 지정
  const sphereMaterial = new CANNON.Material("sphere");
  const contactMaterial = new CANNON.ContactMaterial(
    floorMaterial,
    sphereMaterial,
    {
      friction: 0.1, // 마찰
      restitution: 0.5, // 탄성
    }
  );
  world.addContactMaterial(contactMaterial);

  setInterval(() => {
    createSphere();
  }, 500);

  const createLight = () => {
    const light = new THREE.DirectionalLight(0xffffff);
    light.castShadow = true;
    light.position.set(0, 10, 0);

    scene.add(light);
  };

  const createFloor = () => {
    const geometry = new THREE.BoxGeometry(6, 1, 6);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;

    scene.add(mesh);

    // 해당 mesh의 geometry width, height, depth를 각각 절반으로 나눈 값을 벡터 3로 넘겨준다
    const shape = new CANNON.Box(new CANNON.Vec3(6 / 2, 1 / 2, 6 / 2));
    const body = new CANNON.Body({
      shape,
      material: floorMaterial,
      mass: 0, // 질량이 0이면 고정 -> 양수면 떨어진다
    });
    world.addBody(body);

    worldObjects.push({ mesh, body });
  };

  const createSphere = () => {
    const geometry = new THREE.SphereGeometry(0.3, 30, 30);
    const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = false;

    scene.add(mesh);

    const shape = new CANNON.Sphere(0.3);
    const body = new CANNON.Body({
      shape,
      material: sphereMaterial,
      mass: 1, // 질량이 0이면 고정 -> 양수면 떨어진다
    });
    body.position.y = 5;
    body.name = "sphere";
    world.addBody(body);

    worldObjects.push({ mesh, body });
  };

  const createObject = () => {
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const addEvent = () => {
    window.addEventListener("resize", resize);
  };

  const draw = () => {
    controls.update();
    renderer.render(scene, camera);
    world.step(1 / 60); // 60fps

    worldObjects.forEach((worldObject) => {
      if (worldObject.body.name === "sphere") {
        worldObject.body.applyForce(
          new CANNON.Vec3(0, 0, 1), // 힘의 크기
          worldObject.body.position // 질량의 중심이 되는 상대적인 포인트
        );
      }
      worldObject.mesh.position.copy(worldObject.body.position);
      worldObject.mesh.quaternion.copy(worldObject.body.quaternion);
    });
    requestAnimationFrame(() => {
      draw();
    });
  };

  const initialize = () => {
    createLight();
    createFloor();
    createSphere();
    createObject();
    addEvent();
    resize();
    draw();
  };

  initialize();
}
