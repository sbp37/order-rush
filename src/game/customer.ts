import * as THREE from 'three';
import type { Dish } from './config';

const BODY_COLORS = [0xf28ba8, 0x7cc6fe, 0xffd166, 0x9bf6c9, 0xc8a8f0, 0xffab76, 0x8ad4df];

let customerSeq = 0;

type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'love';

export class Customer {
  readonly id = ++customerSeq;
  group = new THREE.Group();
  bubble!: THREE.Sprite;
  orders: Dish[];
  vip: boolean;
  patience: number;
  maxPatience: number;
  leaving = false;
  served = false;
  bobPhase = Math.random() * Math.PI * 2;
  private canvas: HTMLCanvasElement;
  private tex: THREE.CanvasTexture;
  private bodyMat: THREE.MeshStandardMaterial;
  private faceTex: THREE.CanvasTexture;
  private face: THREE.Sprite;
  private moveTarget: THREE.Vector3 | null = null;
  private lastBarDraw = -1;
  private mood: Mood | null = null;

  constructor(orders: Dish[], patience: number, vip = false) {
    this.orders = orders;
    this.vip = vip;
    this.patience = patience;
    this.maxPatience = patience;

    const color = vip ? 0xf6c945 : BODY_COLORS[this.id % BODY_COLORS.length];
    this.bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: vip ? 0.35 : 0.6,
      metalness: vip ? 0.4 : 0,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 6, 14), this.bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    this.group.add(body);

    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    this.faceTex = new THREE.CanvasTexture(faceCanvas);
    this.faceTex.colorSpace = THREE.SRGBColorSpace;
    this.face = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.faceTex, transparent: true, depthWrite: false }),
    );
    this.face.scale.set(0.4, 0.4, 1);
    this.face.position.set(0, 0.74, -0.3);
    this.group.add(this.face);
    this.drawFace('happy', faceCanvas);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 192;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthWrite: false });
    this.bubble = new THREE.Sprite(mat);
    this.bubble.scale.set(1.05, 0.79, 1);
    this.bubble.position.y = 1.65;
    this.group.add(this.bubble);
    this.redrawBubble();
  }

  get currentOrder(): Dish {
    return this.orders[0];
  }

  /** Remove the served dish; returns false if no orders remain. Refills some patience for multi-orders. */
  serveOne(): boolean {
    this.orders.shift();
    if (this.orders.length === 0) {
      this.served = true;
      this.redrawBubble();
      return false;
    }
    this.patience = Math.min(this.maxPatience, this.patience + this.maxPatience * 0.4);
    this.redrawBubble();
    return true;
  }

  setMoveTarget(x: number, z: number) {
    this.moveTarget = new THREE.Vector3(x, 0, z);
  }

  get atTarget(): boolean {
    return this.moveTarget === null;
  }

  update(dt: number): void {
    if (this.moveTarget) {
      const p = this.group.position;
      const d = this.moveTarget.clone().sub(p);
      d.y = 0;
      const dist = d.length();
      const step = 2.6 * dt;
      if (dist <= step) {
        p.x = this.moveTarget.x;
        p.z = this.moveTarget.z;
        this.moveTarget = null;
      } else {
        d.normalize();
        p.x += d.x * step;
        p.z += d.z * step;
      }
    }
    this.bobPhase += dt * (this.moveTarget ? 10 : 3);
    this.group.position.y = Math.abs(Math.sin(this.bobPhase)) * (this.moveTarget ? 0.09 : 0.03);
  }

  tickPatience(dt: number): void {
    if (this.served || this.leaving) return;
    this.patience -= dt;
    const frac = this.patience / this.maxPatience;
    const stepped = Math.floor(frac * 24);
    const mood: Mood = frac > 0.6 ? 'happy' : frac > 0.35 ? 'neutral' : frac > 0.15 ? 'worried' : 'angry';
    if (mood !== this.mood) {
      this.mood = mood;
      this.drawFace(mood);
    }
    if (stepped !== this.lastBarDraw) {
      this.lastBarDraw = stepped;
      this.redrawBubble();
    }
  }

  private drawFace(mood: Mood, canvas?: HTMLCanvasElement): void {
    const c = canvas ?? this.faceTex.image as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#222233';
    ctx.strokeStyle = '#222233';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    const eyeY = 52;
    if (mood === 'happy' || mood === 'love') {
      // closed happy arches
      for (const x of [42, 86]) {
        ctx.beginPath();
        ctx.arc(x, eyeY + 6, 11, Math.PI, 0);
        ctx.stroke();
      }
    } else if (mood === 'angry') {
      // >_< eyes
      for (const x of [42, 86]) {
        ctx.beginPath();
        ctx.moveTo(x - 9, eyeY - 7);
        ctx.lineTo(x + 9, eyeY + 7);
        ctx.moveTo(x + 9, eyeY - 7);
        ctx.lineTo(x - 9, eyeY + 7);
        ctx.stroke();
      }
    } else {
      for (const x of [42, 86]) {
        ctx.beginPath();
        ctx.arc(x, eyeY, mood === 'worried' ? 8 : 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.beginPath();
    if (mood === 'happy') {
      ctx.arc(64, 74, 16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    } else if (mood === 'love') {
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('😍', 64, 88);
    } else if (mood === 'neutral') {
      ctx.arc(64, 78, 11, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else if (mood === 'worried') {
      ctx.moveTo(48, 88);
      ctx.quadraticCurveTo(56, 80, 64, 88);
      ctx.quadraticCurveTo(72, 96, 80, 88);
      ctx.stroke();
      // sweat drop
      ctx.fillStyle = '#7cc6fe';
      ctx.beginPath();
      ctx.arc(104, 30, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // angry frown
      ctx.arc(64, 96, 13, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    }
    this.faceTex.needsUpdate = true;
  }

  private redrawBubble(): void {
    const ctx = this.canvas.getContext('2d')!;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const frac = Math.max(0, this.patience / this.maxPatience);
    const angry = this.leaving && !this.served;

    // bubble body
    ctx.fillStyle = angry ? '#ffd7d7' : '#ffffff';
    ctx.strokeStyle = this.served ? '#63d68a' : angry ? '#ff6b6b' : '#3b3f52';
    ctx.lineWidth = 10;
    roundRect(ctx, 26, 12, w - 52, 118, 34);
    ctx.fill();
    ctx.stroke();
    // tail
    ctx.beginPath();
    ctx.moveTo(w / 2 - 18, 126);
    ctx.lineTo(w / 2, 152);
    ctx.lineTo(w / 2 + 18, 126);
    ctx.closePath();
    ctx.fillStyle = angry ? '#ffd7d7' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = angry ? '#ff6b6b' : '#3b3f52';
    ctx.stroke();

    if (this.vip && !angry && !this.served) {
      ctx.font = '40px sans-serif';
      ctx.fillText('👑', w - 56, 42);
    }
    ctx.font = '68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (angry) {
      ctx.fillText('💢', w / 2, 70);
    } else if (this.served) {
      ctx.fillText('❤️', w / 2, 70);
    } else if (this.orders.length === 2) {
      ctx.font = '54px sans-serif';
      ctx.fillText(this.orders[0].emoji, w / 2 - 34, 66);
      ctx.fillText(this.orders[1].emoji, w / 2 + 34, 66);
      // small x2 marker
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#8a4fff';
      ctx.fillText('×2', w / 2, 104);
    } else {
      ctx.fillText(this.currentOrder.emoji, w / 2, 70);
    }

    // patience bar
    ctx.fillStyle = '#e6e6ee';
    roundRect(ctx, 26, 164, w - 52, 18, 9);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#63d68a' : frac > 0.25 ? '#ffc93d' : '#ff6b6b';
    if (frac > 0.01) {
      roundRect(ctx, 26, 164, (w - 52) * frac, 18, 9);
      ctx.fill();
    }
    this.tex.needsUpdate = true;
  }

  flashServed(): void {
    this.served = true;
    this.mood = 'love';
    this.drawFace('love');
    this.redrawBubble();
  }

  flashAngry(): void {
    this.leaving = true;
    this.mood = 'angry';
    this.drawFace('angry');
    this.redrawBubble();
  }

  dispose(): void {
    this.tex.dispose();
    this.faceTex.dispose();
    this.bubble.material.dispose();
    this.face.material.dispose();
    this.bodyMat.dispose();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
