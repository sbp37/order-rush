import * as THREE from 'three';
import type { Dish } from './config';

const BODY_COLORS = [0xf28ba8, 0x7cc6fe, 0xffd166, 0x9bf6c9, 0xc8a8f0, 0xffab76, 0x8ad4df];

let customerSeq = 0;

export class Customer {
  readonly id = ++customerSeq;
  group = new THREE.Group();
  bubble!: THREE.Sprite;
  dish: Dish;
  patience: number;
  maxPatience: number;
  leaving = false;
  served = false;
  bobPhase = Math.random() * Math.PI * 2;
  private canvas: HTMLCanvasElement;
  private tex: THREE.CanvasTexture;
  private bodyMat: THREE.MeshStandardMaterial;
  private moveTarget: THREE.Vector3 | null = null;
  private lastBarDraw = -1;

  constructor(dish: Dish, patience: number) {
    this.dish = dish;
    this.patience = patience;
    this.maxPatience = patience;

    const color = BODY_COLORS[this.id % BODY_COLORS.length];
    this.bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.42, 6, 14), this.bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    this.group.add(body);

    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3 });
    for (const dx of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(dx, 0.72, 0.24);
      this.group.add(eye);
    }

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

  setMoveTarget(x: number, z: number) {
    this.moveTarget = new THREE.Vector3(x, 0, z);
  }

  get atTarget(): boolean {
    return this.moveTarget === null;
  }

  /** returns true while still needs updating */
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
    if (stepped !== this.lastBarDraw) {
      this.lastBarDraw = stepped;
      this.redrawBubble();
    }
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

    ctx.font = '68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(angry ? '💢' : this.served ? '❤️' : this.dish.emoji, w / 2, 70);

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
    this.redrawBubble();
  }

  flashAngry(): void {
    this.leaving = true;
    this.redrawBubble();
  }

  dispose(): void {
    this.tex.dispose();
    this.bubble.material.dispose();
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
