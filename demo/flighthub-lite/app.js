import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07100e);
scene.fog = new THREE.Fog(0x07100e, 75, 220);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
camera.position.set(72, 62, 82);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI * 0.46;
controls.minDistance = 36;
controls.maxDistance = 180;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();

const state = {
  streaming: true,
  trailsVisible: true,
  selectedId: "M30-01",
  frameCount: 0,
  lastFpsTime: performance.now(),
  lastUiTime: performance.now(),
  fps: 0,
};

const drones = [
  {
    id: "M30-01",
    task: "园区巡检",
    color: 0x32d7a0,
    route: [
      [-42, 20, -26],
      [-16, 30, -42],
      [20, 24, -34],
      [44, 34, -8],
      [34, 28, 30],
      [-18, 26, 36],
    ],
    progress: 0.05,
    speed: 18,
    battery: 82,
  },
  {
    id: "M3E-07",
    task: "河道测绘",
    color: 0x6aa8ff,
    route: [
      [-52, 16, 34],
      [-28, 22, 18],
      [6, 20, 24],
      [36, 24, 16],
      [52, 18, -18],
      [14, 22, -38],
    ],
    progress: 0.42,
    speed: 14,
    battery: 56,
  },
  {
    id: "Dock-03",
    task: "应急搜救",
    color: 0xffbf47,
    route: [
      [-20, 36, -12],
      [0, 42, -22],
      [24, 38, -18],
      [30, 34, 10],
      [4, 40, 26],
      [-30, 36, 16],
    ],
    progress: 0.68,
    speed: 21,
    battery: 31,
  },
];

const meshes = new Map();
const trailLines = new Map();
const routeLines = new Map();
const telemetryBuffer = [];

window.__flighthubLite = { renderer, scene, camera };

initLights();
initGround();
initRoutes();
initDrones();
bindEvents();
resize();
render();

function initLights() {
  scene.add(new THREE.HemisphereLight(0xb8fff0, 0x0b1515, 2.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(60, 90, 40);
  keyLight.castShadow = true;
  scene.add(keyLight);
}

function initGround() {
  const grid = new THREE.GridHelper(140, 28, 0x2ed39c, 0x21413a);
  grid.position.y = -0.03;
  scene.add(grid);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({
      color: 0x0d1816,
      roughness: 0.95,
      metalness: 0.05,
    }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  const zones = [
    { x: -36, z: -18, w: 20, h: 14, color: 0x234b42 },
    { x: 18, z: 24, w: 24, h: 18, color: 0x20334f },
    { x: 44, z: -20, w: 16, h: 28, color: 0x4c3820 },
  ];

  zones.forEach((zone) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(zone.w, 0.8, zone.h),
      new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.8 }),
    );
    mesh.position.set(zone.x, 0.4, zone.z);
    mesh.receiveShadow = true;
    scene.add(mesh);
  });
}

function initRoutes() {
  drones.forEach((drone) => {
    const routeGeometry = new THREE.BufferGeometry().setFromPoints(
      drone.route.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    const routeLine = new THREE.Line(
      routeGeometry,
      new THREE.LineDashedMaterial({
        color: drone.color,
        dashSize: 2.2,
        gapSize: 1.4,
        transparent: true,
        opacity: 0.42,
      }),
    );
    routeLine.computeLineDistances();
    scene.add(routeLine);
    routeLines.set(drone.id, routeLine);

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Float32Array(90 * 3), 3),
    );
    trailGeometry.setDrawRange(0, 0);

    const trailLine = new THREE.Line(
      trailGeometry,
      new THREE.LineBasicMaterial({
        color: drone.color,
        transparent: true,
        opacity: 0.9,
      }),
    );
    trailLine.userData.points = [];
    scene.add(trailLine);
    trailLines.set(drone.id, trailLine);
  });
}

function initDrones() {
  drones.forEach((drone) => {
    const group = new THREE.Group();
    group.userData.droneId = drone.id;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.8, 2.2),
      new THREE.MeshStandardMaterial({
        color: drone.color,
        emissive: drone.color,
        emissiveIntensity: 0.18,
        roughness: 0.42,
      }),
    );
    body.castShadow = true;
    group.add(body);

    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xdce8e4, roughness: 0.55 });
    const armA = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.18, 0.18), armMaterial);
    const armB = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 6.2), armMaterial);
    group.add(armA, armB);

    const rotorMaterial = new THREE.MeshStandardMaterial({
      color: 0x101918,
      metalness: 0.2,
      roughness: 0.38,
    });
    [
      [-3.8, 0, -3.2],
      [3.8, 0, -3.2],
      [-3.8, 0, 3.2],
      [3.8, 0, 3.2],
    ].forEach(([x, y, z]) => {
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 28), rotorMaterial);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(x, y, z);
      rotor.userData.isRotor = true;
      group.add(rotor);
    });

    const beacon = new THREE.PointLight(drone.color, 1.2, 12);
    beacon.position.set(0, 0.8, 0);
    group.add(beacon);

    scene.add(group);
    meshes.set(drone.id, group);
  });
}

function bindEvents() {
  window.addEventListener("resize", resize);
  canvas.addEventListener("pointerdown", handlePick);

  document.querySelector("#toggle-stream").addEventListener("click", () => {
    state.streaming = !state.streaming;
    document.querySelector("#toggle-stream").textContent = state.streaming ? "暂停数据流" : "恢复数据流";
  });

  document.querySelector("#focus-fleet").addEventListener("click", () => {
    controls.target.set(0, 18, 0);
    camera.position.set(72, 62, 82);
  });

  document.querySelector("#toggle-trails").addEventListener("click", () => {
    state.trailsVisible = !state.trailsVisible;
    document.querySelector("#toggle-trails").textContent = state.trailsVisible ? "隐藏轨迹" : "显示轨迹";
    trailLines.forEach((line) => {
      line.visible = state.trailsVisible;
    });
  });
}

function resize() {
  const { clientWidth, clientHeight } = canvas.parentElement;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

function render() {
  requestAnimationFrame(render);
  const delta = Math.min(clock.getDelta(), 0.04);

  if (state.streaming) {
    updateTelemetry(delta);
  }

  updateDroneMeshes();
  updateFrameStats();
  if (performance.now() - state.lastUiTime > 250) {
    state.lastUiTime = performance.now();
    updateMetrics();
  }
  controls.update();
  renderer.render(scene, camera);
}

function updateTelemetry(delta) {
  drones.forEach((drone) => {
    drone.progress = (drone.progress + delta * drone.speed * 0.0016) % 1;
    drone.battery = Math.max(18, drone.battery - delta * 0.12);
    drone.latency = Math.round(42 + Math.random() * 36);

    const position = getRoutePosition(drone.route, drone.progress);
    drone.position = position;
    drone.altitude = Math.round(position.y * 3.8);
    drone.heading = getHeading(drone.route, drone.progress);
    drone.alert = drone.battery < 25 || drone.latency > 74;

    telemetryBuffer.push({
      id: drone.id,
      ts: performance.now(),
      position: position.toArray(),
      battery: drone.battery,
      latency: drone.latency,
    });
  });

  if (telemetryBuffer.length > 300) {
    telemetryBuffer.splice(0, telemetryBuffer.length - 300);
  }
}

function updateDroneMeshes() {
  drones.forEach((drone) => {
    const mesh = meshes.get(drone.id);
    if (!drone.position) {
      drone.position = getRoutePosition(drone.route, drone.progress);
    }

    mesh.position.copy(drone.position);
    mesh.rotation.y = drone.heading;
    mesh.scale.setScalar(state.selectedId === drone.id ? 1.22 : 1);

    mesh.children.forEach((child) => {
      if (child.userData.isRotor) {
        child.rotation.z += 0.65;
      }
    });

    updateTrail(drone);
  });
}

function updateTrail(drone) {
  const line = trailLines.get(drone.id);
  const points = line.userData.points;
  const last = points[points.length - 1];

  if (!last || last.distanceToSquared(drone.position) > 6) {
    points.push(drone.position.clone());
  }

  if (points.length > 90) {
    points.shift();
  }

  const positions = line.geometry.attributes.position.array;
  points.forEach((point, index) => {
    positions[index * 3] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;
  });
  line.geometry.setDrawRange(0, points.length);
  line.geometry.attributes.position.needsUpdate = true;
}

function updateFrameStats() {
  state.frameCount += 1;
  const now = performance.now();
  if (now - state.lastFpsTime > 500) {
    state.fps = Math.round((state.frameCount * 1000) / (now - state.lastFpsTime));
    state.frameCount = 0;
    state.lastFpsTime = now;
  }
}

function updateMetrics() {
  const online = drones.length;
  const alerts = drones.filter((drone) => drone.alert).length;
  const latency = Math.round(drones.reduce((sum, drone) => sum + (drone.latency || 0), 0) / online);

  document.querySelector("#metric-online").textContent = online;
  document.querySelector("#metric-alerts").textContent = alerts;
  document.querySelector("#metric-latency").textContent = `${latency}ms`;
  document.querySelector("#metric-fps").textContent = state.fps;

  renderFleetList();
  renderSelectedDetail();
}

function renderFleetList() {
  const list = document.querySelector("#fleet-list");
  list.innerHTML = drones
    .map((drone) => {
      const batteryClass = drone.battery < 25 ? "low" : "";
      const statusClass = drone.alert ? (drone.battery < 25 ? "danger" : "warn") : "";
      const selectedClass = state.selectedId === drone.id ? "is-selected" : "";
      return `
        <button class="fleet-item ${selectedClass}" type="button" data-id="${drone.id}">
          <span class="status-dot ${statusClass}"></span>
          <span>
            <strong class="fleet-name">${drone.id}</strong>
            <span class="fleet-meta">${drone.task} · ${Math.round(drone.speed)}m/s · ${drone.altitude || 0}m</span>
          </span>
          <span class="battery ${batteryClass}"><span style="width: ${Math.round(drone.battery)}%"></span></span>
        </button>
      `;
    })
    .join("");

  list.querySelectorAll("[data-id]").forEach((item) => {
    item.addEventListener("click", () => {
      selectDrone(item.dataset.id);
    });
  });
}

function renderSelectedDetail() {
  const drone = drones.find((item) => item.id === state.selectedId);
  const status = document.querySelector("#selected-status");
  const detail = document.querySelector("#drone-detail");

  if (!drone) {
    status.textContent = "未选择";
    return;
  }

  status.textContent = drone.alert ? "需要关注" : "正常";
  detail.innerHTML = `
    <div><dt>设备</dt><dd>${drone.id}</dd></div>
    <div><dt>速度</dt><dd>${Math.round(drone.speed)} m/s</dd></div>
    <div><dt>高度</dt><dd>${drone.altitude || 0} m</dd></div>
    <div><dt>电量</dt><dd>${Math.round(drone.battery)}%</dd></div>
    <div><dt>任务</dt><dd>${drone.task}</dd></div>
  `;
}

function handlePick(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...meshes.values()], true);
  const hit = hits.find((item) => findDroneGroup(item.object));
  if (hit) {
    selectDrone(findDroneGroup(hit.object).userData.droneId);
  }
}

function selectDrone(id) {
  state.selectedId = id;
  const drone = drones.find((item) => item.id === id);
  if (drone?.position) {
    controls.target.copy(drone.position);
  }
}

function findDroneGroup(object) {
  let current = object;
  while (current) {
    if (current.userData.droneId) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function getRoutePosition(route, progress) {
  const segmentCount = route.length;
  const scaled = progress * segmentCount;
  const index = Math.floor(scaled) % segmentCount;
  const nextIndex = (index + 1) % segmentCount;
  const t = scaled - Math.floor(scaled);
  const current = new THREE.Vector3(...route[index]);
  const next = new THREE.Vector3(...route[nextIndex]);
  return current.lerp(next, t);
}

function getHeading(route, progress) {
  const current = getRoutePosition(route, progress);
  const next = getRoutePosition(route, (progress + 0.01) % 1);
  const direction = next.sub(current);
  return Math.atan2(direction.x, direction.z);
}
