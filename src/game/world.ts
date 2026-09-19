import * as THREE from 'three';
import { instance } from './loader';
import { STATIONS } from './config';

export function buildWorld(scene: THREE.Scene): void {
  // --- floor: checker tiles ---
  const floorParent = new THREE.Group();
  for (let i = -5; i < 5; i++) {
    for (let j = -4; j < 7; j++) {
      const tile = instance('restaurant-checker-floor');
      tile.position.set(i + 0.5, 0, j + 0.5);
      tile.castShadow = false;
      floorParent.add(tile);
    }
  }
  scene.add(floorParent);

  // --- back wall ---
  for (let i = -5; i < 5; i++) {
    const id = i % 2 === 0 ? 'restaurant-kitchen-tile-wall' : 'restaurant-arched-window-wall';
    const wall = instance(id);
    wall.position.set(i + 0.5, 0, -3.6);
    scene.add(wall);
  }

  // --- back-row decor ---
  const decor: Array<[string, number, number, number?]> = [
    ['rounded-restaurant-upright-fridge-closed', -4.4, -2.9],
    ['rounded-restaurant-storage-shelf-fully-stocked', -3.3, -2.9],
    ['rounded-restaurant-prep-workbench-vegetable-prep', 4.3, -2.9],
    ['rounded-restaurant-sink-unit-water-filled', 3.1, -2.9],
    ['rounded-restaurant-trash-bin-empty', 2.2, -2.9],
  ];
  for (const [id, x, z] of decor) {
    const m = instance(id);
    m.position.set(x, 0, z);
    scene.add(m);
  }

  // --- kitchen row: workbench + appliances ---
  for (const st of STATIONS) {
    if (st.onBench) {
      const bench = instance('rounded-restaurant-prep-workbench-clear');
      bench.position.set(st.x, 0, st.z);
      scene.add(bench);
    }
    // appliance itself is placed by the station logic
  }

  // --- service counter row ---
  for (const x of [-2.1, 0, 2.1]) {
    const c = instance('rounded-restaurant-service-counter-trays-ready');
    c.position.set(x, 0, 0.35);
    scene.add(c);
  }
  const bell = instance('rounded-restaurant-service-bell-ready');
  bell.position.set(-2.5, 1.04, 0.35);
  scene.add(bell);
  const plates = instance('rounded-restaurant-plate-stack-full-stack');
  plates.position.set(1.7, 1.04, 0.35);
  scene.add(plates);

  // --- dining area ---
  const sets: Array<[number, number, number]> = [
    [-2.6, 3.2, 0],
    [0.2, 4.0, 0],
    [2.6, 3.2, 0],
  ];
  for (const [x, z, rot] of sets) {
    const t = instance('restaurant-dining-table');
    t.position.set(x, 0, z);
    t.rotation.y = rot;
    scene.add(t);
    for (const off of [-0.9, 0.9]) {
      const ch = instance('restaurant-dining-chair');
      ch.position.set(x + off, 0, z);
      ch.rotation.y = off < 0 ? Math.PI / 2 : -Math.PI / 2;
      scene.add(ch);
    }
  }
  const booth = instance('restaurant-booth-seat');
  booth.position.set(-4.1, 0, 4.6);
  booth.rotation.y = Math.PI / 2;
  scene.add(booth);

  // --- entrance area ---
  const lectern = instance('restaurant-menu-lectern');
  lectern.position.set(3.7, 0, 4.4);
  lectern.rotation.y = -Math.PI / 4;
  scene.add(lectern);

  const rope1 = instance('restaurant-restaurant-queue-rope-post-streamline-normal');
  rope1.position.set(4.4, 0, 3.4);
  scene.add(rope1);

  const planter1 = instance('restaurant-planter-partition');
  planter1.position.set(4.55, 0, 2.0);
  planter1.rotation.y = Math.PI / 2;
  scene.add(planter1);

  const lamp = instance('restaurant-floor-lamp');
  lamp.position.set(-4.4, 0, 1.6);
  scene.add(lamp);

  // --- lighting ---
  const hemi = new THREE.HemisphereLight(0xfff6e8, 0x8a7a66, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffedd0, 1.6);
  sun.position.set(5, 9, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const warm = new THREE.PointLight(0xffd9a0, 6, 10);
  warm.position.set(0, 3, 2.5);
  scene.add(warm);

  scene.background = new THREE.Color(0x2b2f3a);
  scene.fog = new THREE.Fog(0x2b2f3a, 18, 34);
}
