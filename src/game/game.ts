import * as THREE from 'three';
import { DISHES, GAME, STATIONS, type Dish, type DishKey, type StationDef } from './config';
import { preload, instance } from './loader';
import { buildWorld } from './world';
import { Customer } from './customer';
import { sfx } from './sfx';

export type Phase = 'ready' | 'running' | 'over';

export interface HudState {
  phase: Phase;
  score: number;
  combo: number;
  timeLeft: number;
  served: number;
  missed: number;
  holding: DishKey | null;
}

type StationState = 'idle' | 'cooking' | 'done';

class Station {
  def: StationDef;
  dish: Dish;
  group = new THREE.Group();
  pad: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  state: StationState = 'idle';
  timer = 0;
  model: THREE.Object3D | null = null;
  sign: THREE.Sprite;
  popT = 0;

  constructor(def: StationDef) {
    this.def = def;
    this.dish = DISHES.find((d) => d.key === def.dish)!;
    this.group.position.set(def.x, 0, def.z);
    this.swap(def.models.idle);

    // hit proxy
    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 1.9, 12),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 0.95;
    hit.userData.station = this;
    this.group.add(hit);

    // hover pad
    this.pad = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.72, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0, side: THREE.DoubleSide }),
    );
    this.pad.rotation.x = -Math.PI / 2;
    this.pad.position.y = 0.02;
    this.group.add(this.pad);

    // dish sign sprite
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.dish.emoji, 48, 52);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    this.sign.scale.set(0.42, 0.42, 1);
    this.sign.position.set(0, 1.95, 0);
    this.group.add(this.sign);
  }

  swap(modelId: string): void {
    if (this.model) this.group.remove(this.model);
    this.model = instance(modelId);
    this.model.position.y = this.def.onBench ? 0.79 : 0;
    // add under the hit proxy so index doesn't matter
    this.group.add(this.model);
  }

  startCook(): void {
    this.state = 'cooking';
    this.timer = 0;
    this.swap(this.def.models.cooking);
    sfx.startCook();
  }

  finishCook(): void {
    this.state = 'done';
    this.swap(this.def.models.done);
    this.popT = 0.35;
    sfx.done();
  }

  pickup(): void {
    this.state = 'idle';
    this.timer = 0;
    this.swap(this.def.models.idle);
    sfx.pickup();
  }

  update(dt: number): void {
    if (this.state === 'cooking') {
      this.timer += dt;
      if (this.timer >= this.dish.cookTime) this.finishCook();
    }
    if (this.popT > 0) {
      this.popT -= dt;
      const s = 1 + 0.18 * Math.max(0, this.popT / 0.35);
      this.group.scale.setScalar(s);
      if (this.popT <= 0) this.group.scale.setScalar(1);
    }
    this.pad.material.opacity = THREE.MathUtils.damp(
      this.pad.material.opacity,
      this.state === 'done' ? 0.75 : this.hoverPad,
      8,
      dt,
    );
    this.pad.rotation.z += dt * (this.state === 'done' ? 2.4 : 0.6);
  }

  hoverPad = 0;
}

export class OrderRushGame {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private stations: Station[] = [];
  private customers: Customer[] = [];
  private overlay: HTMLElement;
  private hudCb: (h: HudState) => void;

  private phase: Phase = 'ready';
  private score = 0;
  private combo = 0;
  private comboT = 0;
  private served = 0;
  private missed = 0;
  private timeLeft = GAME.dayLength;
  private spawnT = 1.2;
  private holding: Dish | null = null;
  private lastT = performance.now();
  private raf = 0;
  private ringEls = new Map<Station, HTMLDivElement>();

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement, hudCb: (h: HudState) => void) {
    this.overlay = overlay;
    this.hudCb = hudCb;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const aspect = window.innerWidth / window.innerHeight;
    const halfH = Math.max(5.9, 5.2 * aspect) / aspect;
    this.camera = new THREE.OrthographicCamera(-halfH * aspect, halfH * aspect, halfH, -halfH, 0.1, 60);
    this.camera.position.set(0, 10.5, 8.4);
    this.camera.lookAt(0, 0.4, 0.8);

    window.addEventListener('resize', this.onResize);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
  }

  async init(): Promise<void> {
    const ids = [
      'restaurant-checker-floor',
      'restaurant-kitchen-tile-wall',
      'restaurant-arched-window-wall',
      'rounded-restaurant-upright-fridge-closed',
      'rounded-restaurant-storage-shelf-fully-stocked',
      'rounded-restaurant-prep-workbench-vegetable-prep',
      'rounded-restaurant-sink-unit-water-filled',
      'rounded-restaurant-trash-bin-empty',
      'rounded-restaurant-prep-workbench-clear',
      'rounded-restaurant-service-counter-trays-ready',
      'rounded-restaurant-service-bell-ready',
      'rounded-restaurant-plate-stack-full-stack',
      'restaurant-dining-table',
      'restaurant-dining-chair',
      'restaurant-booth-seat',
      'restaurant-menu-lectern',
      'restaurant-restaurant-queue-rope-post-streamline-normal',
      'restaurant-planter-partition',
      'restaurant-floor-lamp',
      ...STATIONS.flatMap((s) => [s.models.idle, s.models.cooking, s.models.done]),
    ];
    await preload(ids);

    buildWorld(this.scene);

    for (const def of STATIONS) {
      const st = new Station(def);
      this.scene.add(st.group);
      this.stations.push(st);

      const ring = document.createElement('div');
      ring.className = 'station-ring';
      this.overlay.appendChild(ring);
      this.ringEls.set(st, ring);
    }

    this.pushHud();
    this.onResize();
    this.loop();
  }

  start(): void {
    if (this.phase !== 'ready' && this.phase !== 'over') return;
    // reset
    for (const c of this.customers) this.removeCustomer(c, false);
    this.customers = [];
    for (const st of this.stations) {
      st.state = 'idle';
      st.timer = 0;
      st.swap(st.def.models.idle);
    }
    this.score = 0;
    this.combo = 0;
    this.served = 0;
    this.missed = 0;
    this.timeLeft = GAME.dayLength;
    this.spawnT = 0.6;
    this.holding = null;
    for (const f of this.flyers) {
      this.scene.remove(f.sprite);
      f.sprite.material.dispose();
    }
    this.flyers = [];
    this.phase = 'running';
    this.pushHud();
    sfx.click();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    const cvs = this.renderer.domElement;
    cvs.removeEventListener('pointerdown', this.onPointerDown);
    cvs.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.dispose();
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const halfH = Math.max(5.9, 5.2 * aspect) / aspect;
    this.camera.left = -halfH * aspect;
    this.camera.right = halfH * aspect;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  };

  private spawnInterval(): number {
    const prog = 1 - this.timeLeft / GAME.dayLength;
    return THREE.MathUtils.lerp(GAME.spawnStart, GAME.spawnMin, prog);
  }

  private spawnCustomer(): void {
    const prog = 1 - this.timeLeft / GAME.dayLength;
    const patience = THREE.MathUtils.lerp(GAME.patienceStart, GAME.patienceMin, prog);
    const double = Math.random() < THREE.MathUtils.lerp(GAME.doubleChanceStart, GAME.doubleChanceMax, prog);
    const orders: Dish[] = [];
    for (let i = 0; i < (double ? 2 : 1); i++) {
      let d = DISHES[Math.floor(Math.random() * DISHES.length)];
      while (orders.some((o) => o.key === d.key)) d = DISHES[Math.floor(Math.random() * DISHES.length)];
      orders.push(d);
    }
    const c = new Customer(orders, patience * (double ? 1.5 : 1));
    c.group.position.set(GAME.doorPos.x, 0, GAME.doorPos.z);
    c.group.rotation.y = Math.PI; // face -z (into the room)
    this.scene.add(c.group);
    this.customers.push(c);
    this.layoutQueue();
  }

  private layoutQueue(): void {
    const waiting = this.customers.filter((c) => !c.leaving);
    waiting.forEach((c, i) => {
      if (i < GAME.counterSlots.length) {
        c.setMoveTarget(GAME.counterSlots[i], GAME.counterZ);
      } else {
        const j = i - GAME.counterSlots.length;
        c.setMoveTarget(2.9 + (j % 2) * 0.9, 2.2 + j * 0.75);
      }
    });
  }

  private removeCustomer(c: Customer, exitDoor = true): void {
    c.leaving = true;
    if (exitDoor) {
      c.setMoveTarget(GAME.doorPos.x + 0.4, GAME.doorPos.z + 0.4);
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    this.setPointer(e);
    const hit = this.pick();
    this.renderer.domElement.style.cursor = hit ? 'pointer' : 'default';
    for (const st of this.stations) st.hoverPad = hit === st ? 0.45 : 0;
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (this.phase !== 'running') return;
    this.setPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // stations
    const stationHits = this.raycaster.intersectObjects(
      this.stations.map((s) => s.group),
      true,
    );
    for (const h of stationHits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.station) o = o.parent;
      if (o) {
        this.clickStation(o.userData.station as Station);
        return;
      }
    }

    // customers
    const custHits = this.raycaster.intersectObjects(
      this.customers.filter((c) => !c.leaving).map((c) => c.group),
      true,
    );
    for (const h of custHits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !(o.parent === this.scene)) o = o.parent;
      const cust = this.customers.find((c) => c.group === o);
      if (cust) {
        this.clickCustomer(cust);
        return;
      }
    }
  };

  private clickStation(st: Station): void {
    if (st.state === 'idle') {
      st.startCook();
    } else if (st.state === 'done') {
      if (this.holding) {
        sfx.denied();
        this.toast('이미 음식을 들고 있어요', st);
        return;
      }
      this.holding = st.dish;
      st.pickup();
      this.pushHud();
    } else {
      sfx.click();
    }
  }

  private clickCustomer(c: Customer): void {
    if (!this.holding) {
      sfx.click();
      return;
    }
    if (c.currentOrder.key !== this.holding.key) {
      sfx.denied();
      this.toast('다른 메뉴예요!', c.group.position);
      return;
    }
    const dish = this.holding;
    this.flyDish(dish, c);
    const frac = Math.max(0, c.patience / c.maxPatience);
    const tip = Math.round(dish.price * 0.5 * frac);
    this.combo += 1;
    this.comboT = GAME.comboWindow;
    const gain = dish.price + tip + this.combo * 500;
    this.score += gain;
    this.served += 1;
    const hasMore = c.serveOne();
    if (hasMore) {
      this.popup(`+${gain.toLocaleString()}원`, c.group.position, '#ffd166');
      this.toast('한 개 더 주문했어요!', c.group.position);
    } else {
      c.flashServed();
      this.removeCustomer(c);
      this.popup(`+${gain.toLocaleString()}원`, c.group.position, '#ffd166');
    }
    sfx.serve(this.combo);
    this.holding = null;
    this.pushHud();
  }

  private flyers: { sprite: THREE.Sprite; t: number; from: THREE.Vector3; to: THREE.Object3D }[] = [];

  private flyDish(dish: Dish, c: Customer): void {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dish.emoji, 48, 52);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.set(0.5, 0.5, 1);
    const from = new THREE.Vector3(c.group.position.x, 1.15, GAME.counterZ - 0.75);
    sprite.position.copy(from);
    this.scene.add(sprite);
    this.flyers.push({ sprite, t: 0, from, to: c.group });
  }

  private updateFlyers(dt: number): void {
    for (const f of [...this.flyers]) {
      f.t += dt / 0.45;
      const t = Math.min(1, f.t);
      const target = f.to.position.clone().setY(1.15);
      f.sprite.position.lerpVectors(f.from, target, t);
      f.sprite.position.y += Math.sin(t * Math.PI) * 1.4;
      const s = 0.5 + Math.sin(t * Math.PI) * 0.15;
      f.sprite.scale.set(s, s, 1);
      if (f.t >= 1) {
        this.scene.remove(f.sprite);
        f.sprite.material.map?.dispose();
        f.sprite.material.dispose();
        this.flyers.splice(this.flyers.indexOf(f), 1);
      }
    }
  }

  private pick(): Station | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.stations.map((s) => s.group),
      true,
    );
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.station) o = o.parent;
      if (o) return o.userData.station as Station;
    }
    return null;
  }

  private setPointer(e: PointerEvent): void {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private toast(text: string, at: Station | THREE.Vector3): void {
    const p = at instanceof Station ? new THREE.Vector3(at.def.x, 1.9, at.def.z) : at.clone().setY(1.9);
    this.popup(text, p, '#ff8a8a', true);
  }

  private popup(text: string, worldPos: THREE.Vector3, color: string, small = false): void {
    const el = document.createElement('div');
    el.className = small ? 'popup popup-small' : 'popup';
    el.textContent = text;
    el.style.color = color;
    const sp = this.toScreen(worldPos);
    el.style.left = `${sp.x}px`;
    el.style.top = `${sp.y}px`;
    this.overlay.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  private toScreen(v: THREE.Vector3): { x: number; y: number } {
    const p = v.clone().project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  private pushHud(): void {
    this.hudCb({
      phase: this.phase,
      score: this.score,
      combo: this.combo,
      timeLeft: Math.max(0, this.timeLeft),
      served: this.served,
      missed: this.missed,
      holding: this.holding?.key ?? null,
    });
  }

  private lastHudPush = 0;

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const now2 = performance.now();
    const dt = Math.min((now2 - this.lastT) / 1000, 0.1);
    this.lastT = now2;

    if (this.phase === 'running') {
      this.timeLeft -= dt;
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = this.spawnInterval();
        if (this.customers.filter((c) => !c.leaving).length < 7) this.spawnCustomer();
      }
      if (this.combo > 0) {
        this.comboT -= dt;
        if (this.comboT <= 0) this.combo = 0;
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.phase = 'over';
        for (const c of this.customers) this.removeCustomer(c);
        sfx.end();
      }
    }

    // stations
    for (const st of this.stations) st.update(dt);
    this.updateFlyers(dt);

    // customers
    for (const c of [...this.customers]) {
      c.update(dt);
      c.tickPatience(dt);
      if (this.phase === 'running' && !c.leaving && c.patience <= 0 && c.atTarget) {
        c.flashAngry();
        this.removeCustomer(c);
        this.missed += 1;
        this.combo = 0;
        sfx.angry();
        this.popup('💢 나갔어요', c.group.position, '#ff8a8a', true);
      }
      // fully exited?
      if (c.leaving && c.atTarget) {
        this.scene.remove(c.group);
        c.dispose();
        this.customers.splice(this.customers.indexOf(c), 1);
        this.layoutQueue();
      }
    }

    // station overlay rings
    for (const st of this.stations) {
      const ring = this.ringEls.get(st)!;
      const top = st.def.onBench ? 1.9 : 2.05;
      const sp = this.toScreen(new THREE.Vector3(st.def.x, top, st.def.z));
      ring.style.left = `${sp.x}px`;
      ring.style.top = `${sp.y}px`;
      if (st.state === 'cooking') {
        const frac = Math.min(1, st.timer / st.dish.cookTime);
        ring.style.display = 'block';
        ring.style.background = `conic-gradient(#ffd166 ${frac * 360}deg, rgba(255,255,255,0.25) 0deg)`;
        ring.textContent = '';
      } else if (st.state === 'done') {
        ring.style.display = 'grid';
        ring.style.background = 'rgba(99,214,138,0.9)';
        ring.textContent = '✓';
      } else {
        ring.style.display = 'none';
      }
    }

    // throttle HUD pushes to ~5/s + on change events
    const now = performance.now();
    if (now - this.lastHudPush > 200) {
      this.lastHudPush = now;
      this.pushHud();
    }

    this.renderer.render(this.scene, this.camera);
  };
}
